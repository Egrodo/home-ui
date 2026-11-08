import { loop } from '../../loop';
import type { Screensaver } from '../../types';
import * as config from './config';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './shader';

const TAU = Math.PI * 2;

const ease = (x: number) => x * x * (3 - 2 * x);

/** A smooth random curve: Catmull-Rom through random knots. */
class Drift {
	private knot = 0;
	private points = [Math.random(), Math.random(), Math.random(), Math.random()];

	constructor(private range: config.DriftRange) {}

	value(t: number): number {
		const { min, max, period } = this.range;
		const s = t / period;
		while (s >= this.knot + 1) {
			this.knot++;
			this.points.shift();
			this.points.push(Math.random());
		}
		const f = s - this.knot;
		const [p0, p1, p2, p3] = this.points;
		const v =
			0.5 *
			(2 * p1 +
				(-p0 + p2) * f +
				(2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f +
				(-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
		return min + (max - min) * Math.min(1, Math.max(0, v));
	}
}

interface Seed extends config.Shape {
	x: number;
	y: number;
	r: number;
	rot: number;
	fx: number;
	fy: number;
	ph: number;
	sp: number;
	on: boolean;
	presence: number;
	/** Already respawned while fully sunk, awaiting its turn to rise again. */
	fresh: boolean;
}

function pickRandom<T>(items: T[]): T {
	return items.splice(Math.floor(Math.random() * items.length), 1)[0];
}

const betweenRange = ({ min, max }: config.NumberRange) => config.between(min, max);

/** Randomizes a seed's shape and placement, leaving its presence untouched. */
function respawn(seed: Seed) {
	Object.assign(seed, config.SHAPES[Math.floor(Math.random() * config.SHAPES.length)](), {
		x: (Math.random() - 0.5) * config.SEED_SPAWN_WIDTH,
		y: (Math.random() - 0.5) * config.SEED_SPAWN_HEIGHT,
		r: betweenRange(config.SEED_RADIUS),
		rot: Math.random() * TAU,
		fx: betweenRange(config.SEED_ORBIT_FREQUENCY),
		fy: betweenRange(config.SEED_ORBIT_FREQUENCY),
		ph: Math.random() * TAU,
		sp: Math.random() - 0.5
	});
}

function createSeed(on: boolean): Seed {
	const seed = { on, presence: on ? 1 : 0, fresh: false } as Seed;
	respawn(seed);
	return seed;
}

/** Turns seeds on or off to reach count. Their presence then fades to match. */
function syncSeedCount(seeds: Seed[], count: number) {
	const active = seeds.filter((s) => s.on);
	const inactive = seeds.filter((s) => !s.on);
	while (active.length > count) pickRandom(active).on = false;
	while (active.length < count && inactive.length > 0) {
		const seed = pickRandom(inactive);
		if (seed.presence <= 0) respawn(seed);
		seed.on = true;
		active.push(seed);
	}
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
	const shader = gl.createShader(type) as WebGLShader;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw new Error(`Shader failed to compile: ${gl.getShaderInfoLog(shader)}`);
	}
	return shader;
}

const hexToRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.substring(i, i + 2), 16) / 255);

const rainbowContours: Screensaver = {
	start({ canvas, width, height, signal }) {
		const gl = canvas.getContext('webgl', { antialias: false });
		if (!gl) throw new Error('WebGL not available');
		gl.getExtension('OES_standard_derivatives');

		const program = gl.createProgram() as WebGLProgram;
		gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
		gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
		gl.linkProgram(program);
		// Large palettes or seed counts can exceed the GPU's uniform limit.
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw new Error(`Shader failed to link: ${gl.getProgramInfoLog(program)}`);
		}
		gl.useProgram(program);

		// One oversized triangle, so the fragment shader runs once per pixel.
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		const position = gl.getAttribLocation(program, 'a');
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

		const uniform = (name: string) => gl.getUniformLocation(program, name);
		const uNoiseOff = uniform('uNoiseOff');
		const uPhase = uniform('uPhase');
		const uBand = uniform('uBand');
		const uWarp = uniform('uWarp');
		const uGrain = uniform('uGrain');
		const uSmooth = uniform('uSmooth');
		const uSeed = uniform('uSeed');
		const uSeedP = uniform('uSeedP');

		gl.viewport(0, 0, width, height);
		gl.uniform2f(uniform('uRes'), width, height);
		gl.uniform1f(uniform('uWScale'), config.WOBBLE_SCALE);
		gl.uniform1f(uniform('uLine'), config.LINE_WEIGHT);
		gl.uniform3fv(uniform('uLineColor'), new Float32Array(hexToRgb(config.LINE_COLOR)));
		gl.uniform1f(uniform('uVignette'), config.VIGNETTE);
		gl.uniform3fv(uniform('uPal'), new Float32Array(config.PALETTE.flatMap(hexToRgb)));

		const drift = {
			seeds: new Drift(config.SEED_COUNT),
			band: new Drift(config.BAND_WIDTH),
			warp: new Drift(config.WARP),
			flow: new Drift(config.BAND_FLOW),
			morph: new Drift(config.MORPH),
			rounding: new Drift(config.ROUNDING),
			grain: new Drift(config.GRAIN)
		};

		const initialCount = Math.round(drift.seeds.value(0));
		const seeds = Array.from({ length: config.SEED_SLOTS }, (_, i) => createSeed(i < initialCount));

		// Rates are integrated rather than multiplied by time, so a changing speed never
		// jumps the image, and clocks that would grow forever are wrapped or looped.
		let elapsed = 0;
		let phase = 0; // wraps at the palette length, which is invisible
		let morphClock = 0;
		let noiseAngle = Math.random() * TAU;

		const seedData = new Float32Array(config.SEED_SLOTS * 4);
		const seedParams = new Float32Array(config.SEED_SLOTS * 4);

		loop(signal, (frameDt) => {
			const dt = frameDt * config.ANIMATION_SPEED;
			elapsed += dt;
			const morph = drift.morph.value(elapsed);

			syncSeedCount(seeds, Math.round(drift.seeds.value(elapsed)));
			phase = (phase + dt * drift.flow.value(elapsed) * config.FLOW_RATE) % config.PALETTE.length;
			morphClock += dt * morph;
			noiseAngle = (noiseAngle + (dt * config.NOISE_SPEED) / config.NOISE_RADIUS) % TAU;

			seeds.forEach((seed, i) => {
				const change = ((seed.on ? 1 : -1) * dt) / config.SEED_FADE_SECONDS;
				seed.presence = Math.min(1, Math.max(0, seed.presence + change));
				if (!seed.on && seed.presence === 0 && !seed.fresh) {
					respawn(seed); // somewhere new while it's invisible
					seed.fresh = true;
				}
				if (seed.on) seed.fresh = false;
				seed.rot = (seed.rot + dt * morph * seed.sp * config.SEED_SPIN_RATE) % TAU;

				const { SEED_ORBIT_RADIUS: orbit, SEED_ORBIT_PHASE_SKEW: skew } = config;
				seedData[i * 4] = seed.x + orbit * Math.sin(morphClock * seed.fx + seed.ph);
				seedData[i * 4 + 1] = seed.y + orbit * Math.cos(morphClock * seed.fy + seed.ph * skew);
				seedData[i * 4 + 2] = seed.r;
				seedData[i * 4 + 3] = seed.n;
				seedParams[i * 4] = seed.m;
				seedParams[i * 4 + 1] = seed.rot;
				seedParams[i * 4 + 2] = seed.type;
				seedParams[i * 4 + 3] = (1 - ease(seed.presence)) * config.SEED_SINK_DEPTH;
			});

			gl.uniform2f(
				uNoiseOff,
				config.NOISE_RADIUS * Math.cos(noiseAngle),
				config.NOISE_RADIUS * Math.sin(noiseAngle)
			);
			gl.uniform1f(uPhase, phase);
			gl.uniform1f(uBand, drift.band.value(elapsed));
			gl.uniform1f(uWarp, drift.warp.value(elapsed));
			gl.uniform1f(uGrain, drift.grain.value(elapsed));
			gl.uniform1f(uSmooth, drift.rounding.value(elapsed));
			gl.uniform4fv(uSeed, seedData);
			gl.uniform4fv(uSeedP, seedParams);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		});
	}
};

export default rainbowContours;
