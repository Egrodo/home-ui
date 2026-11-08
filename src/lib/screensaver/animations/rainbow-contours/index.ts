import { loop } from '../../loop';
import type { Screensaver } from '../../types';
import * as config from './config';
import { COLOR_SHADER, FIELD_SHADER, VERTEX_SHADER, WARP_SHADER } from './shader';

const TAU = Math.PI * 2;

const PREVIOUS_TEXTURE_UNIT = 0;
const LATEST_TEXTURE_UNIT = 1;
const WARP_TEXTURE_UNIT = 2;

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

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
	const shader = gl.createShader(type) as WebGLShader;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw new Error(`Shader failed to compile: ${gl.getShaderInfoLog(shader)}`);
	}
	return shader;
}

function createProgram(gl: WebGL2RenderingContext, fragmentSource: string): WebGLProgram {
	const program = gl.createProgram() as WebGLProgram;
	gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
	gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
	gl.linkProgram(program);
	// Large palettes or seed counts can exceed the GPU's uniform limit.
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error(`Shader failed to link: ${gl.getProgramInfoLog(program)}`);
	}
	return program;
}

interface Target {
	texture: WebGLTexture;
	framebuffer: WebGLFramebuffer;
}

function createTarget(
	gl: WebGL2RenderingContext,
	format: number,
	width: number,
	height: number,
	filter: number
): Target {
	const texture = gl.createTexture() as WebGLTexture;
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texStorage2D(gl.TEXTURE_2D, 1, format, width, height);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

	const framebuffer = gl.createFramebuffer() as WebGLFramebuffer;
	gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
		throw new Error(`Render target is incomplete (format ${format})`);
	}
	return { texture, framebuffer };
}

const hexToRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.substring(i, i + 2), 16) / 255);

const rainbowContours: Screensaver = {
	start({ canvas, width, height, signal }) {
		// Opaque, so the browser needn't composite the UI underneath it.
		const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false });
		if (!gl) throw new Error('WebGL2 not available');

		// Unlike half-float, R32F can't be filtered on the Pi's GPU, but it is sampled 1:1 here.
		if (!gl.getExtension('EXT_color_buffer_float')) {
			throw new Error('Rendering to float textures is not supported');
		}

		const warpWidth = Math.max(1, Math.round(width * config.WARP_SCALE));
		const warpHeight = Math.max(1, Math.round(height * config.WARP_SCALE));
		const warpTarget = createTarget(gl, gl.RG16F, warpWidth, warpHeight, gl.LINEAR);

		// The screen blends previous to latest while pending is drawn a slice per frame.
		const createFieldTarget = () => createTarget(gl, gl.R32F, width, height, gl.NEAREST);
		let previous = createFieldTarget();
		let latest = createFieldTarget();
		let pending = createFieldTarget();

		const warpProgram = createProgram(gl, WARP_SHADER);
		const fieldProgram = createProgram(gl, FIELD_SHADER);
		const colorProgram = createProgram(gl, COLOR_SHADER);

		// One oversized triangle, so the fragment shader runs once per pixel.
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		const warpUniform = (name: string) => gl.getUniformLocation(warpProgram, name);
		const uNoiseOff = warpUniform('uNoiseOff');

		const fieldUniform = (name: string) => gl.getUniformLocation(fieldProgram, name);
		const uWarp = fieldUniform('uWarp');
		const uSmooth = fieldUniform('uSmooth');
		const uSeedCount = fieldUniform('uSeedCount');
		const uSeed = fieldUniform('uSeed');
		const uSeedTurn = fieldUniform('uSeedTurn');
		const uSeedShape = fieldUniform('uSeedShape');

		const colorUniform = (name: string) => gl.getUniformLocation(colorProgram, name);
		const uBlend = colorUniform('uBlend');
		const uPhase = colorUniform('uPhase');
		const uBand = colorUniform('uBand');
		const uGrain = colorUniform('uGrain');

		gl.useProgram(warpProgram);
		gl.uniform2f(warpUniform('uRes'), warpWidth, warpHeight);
		gl.uniform1f(warpUniform('uWScale'), config.WOBBLE_SCALE);

		gl.useProgram(fieldProgram);
		gl.uniform1i(fieldUniform('uWarpPattern'), WARP_TEXTURE_UNIT);
		gl.uniform2f(fieldUniform('uRes'), width, height);

		gl.useProgram(colorProgram);
		gl.uniform1i(colorUniform('uFieldA'), PREVIOUS_TEXTURE_UNIT);
		gl.uniform1i(colorUniform('uFieldB'), LATEST_TEXTURE_UNIT);
		gl.uniform2f(colorUniform('uRes'), width, height);
		gl.uniform1f(colorUniform('uLine'), config.LINE_WEIGHT);
		gl.uniform3fv(colorUniform('uLineColor'), new Float32Array(hexToRgb(config.LINE_COLOR)));
		gl.uniform1f(colorUniform('uVignette'), config.VIGNETTE);
		gl.uniform3fv(colorUniform('uPal'), new Float32Array(config.PALETTE.flatMap(hexToRgb)));

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
		const seedTurn = new Float32Array(config.SEED_SLOTS * 4);
		const seedShape = new Float32Array(config.SEED_SLOTS * 4);

		const bindFields = () => {
			gl.activeTexture(gl.TEXTURE0 + PREVIOUS_TEXTURE_UNIT);
			gl.bindTexture(gl.TEXTURE_2D, previous.texture);
			gl.activeTexture(gl.TEXTURE0 + LATEST_TEXTURE_UNIT);
			gl.bindTexture(gl.TEXTURE_2D, latest.texture);
		};

		/** Copies visible seeds in slot order, returning how many there are. */
		const packSeeds = () => {
			const { SEED_ORBIT_RADIUS: orbit, SEED_ORBIT_PHASE_SKEW: skew } = config;
			let count = 0;
			for (const seed of seeds) {
				if (seed.presence <= 0) continue;
				const i = count++ * 4;
				seedData[i] = seed.x + orbit * Math.sin(morphClock * seed.fx + seed.ph);
				seedData[i + 1] = seed.y + orbit * Math.cos(morphClock * seed.fy + seed.ph * skew);
				seedData[i + 2] = seed.r;
				seedData[i + 3] = (1 - ease(seed.presence)) * config.SEED_SINK_DEPTH;
				seedTurn[i] = Math.cos(seed.rot);
				seedTurn[i + 1] = Math.sin(seed.rot);
				seedTurn[i + 2] = seed.n;
				seedTurn[i + 3] = seed.type;
				if (seed.type === 1) {
					seedShape[i] = Math.cos(Math.PI / seed.n);
					seedShape[i + 1] = Math.sin(Math.PI / seed.n);
					seedShape[i + 2] = Math.cos(Math.PI / seed.m);
					seedShape[i + 3] = Math.sin(Math.PI / seed.m);
				} else {
					seedShape[i] = seed.m;
				}
			}
			return count;
		};

		/** Freezes the current state for the next field, which may take several frames to draw. */
		const prepareField = () => {
			gl.useProgram(warpProgram);
			gl.bindFramebuffer(gl.FRAMEBUFFER, warpTarget.framebuffer);
			gl.viewport(0, 0, warpWidth, warpHeight);
			gl.uniform2f(
				uNoiseOff,
				config.NOISE_RADIUS * Math.cos(noiseAngle),
				config.NOISE_RADIUS * Math.sin(noiseAngle)
			);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			gl.viewport(0, 0, width, height);

			gl.useProgram(fieldProgram);
			gl.uniform1f(uWarp, drift.warp.value(elapsed));
			gl.uniform1f(uSmooth, drift.rounding.value(elapsed));
			gl.uniform1i(uSeedCount, packSeeds());
			gl.uniform4fv(uSeed, seedData);
			gl.uniform4fv(uSeedTurn, seedTurn);
			gl.uniform4fv(uSeedShape, seedShape);
		};

		const drawField = (target: Target, bottom: number, top: number) => {
			gl.useProgram(fieldProgram);
			gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
			gl.enable(gl.SCISSOR_TEST);
			gl.scissor(0, bottom, width, top - bottom);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
			gl.disable(gl.SCISSOR_TEST);
		};

		gl.activeTexture(gl.TEXTURE0 + WARP_TEXTURE_UNIT);
		gl.bindTexture(gl.TEXTURE_2D, warpTarget.texture);
		bindFields();

		prepareField();
		drawField(previous, 0, height);
		drawField(latest, 0, height);

		let slice = 0;

		loop(signal, (frameDt) => {
			const dt = frameDt * config.ANIMATION_SPEED;
			elapsed += dt;
			const morph = drift.morph.value(elapsed);

			syncSeedCount(seeds, Math.round(drift.seeds.value(elapsed)));
			phase = (phase + dt * drift.flow.value(elapsed) * config.FLOW_RATE) % config.PALETTE.length;
			morphClock += dt * morph;
			noiseAngle = (noiseAngle + (dt * config.NOISE_SPEED) / config.NOISE_RADIUS) % TAU;

			seeds.forEach((seed) => {
				const change = ((seed.on ? 1 : -1) * dt) / config.SEED_FADE_SECONDS;
				seed.presence = Math.min(1, Math.max(0, seed.presence + change));
				if (!seed.on && seed.presence === 0 && !seed.fresh) {
					respawn(seed); // somewhere new while it's invisible
					seed.fresh = true;
				}
				if (seed.on) seed.fresh = false;
				seed.rot = (seed.rot + dt * morph * seed.sp * config.SEED_SPIN_RATE) % TAU;
			});

			const slices = config.FIELD_UPDATE_FRAMES;
			if (slice === 0) prepareField();
			drawField(
				pending,
				Math.round((height * slice) / slices),
				Math.round((height * (slice + 1)) / slices)
			);
			slice++;
			if (slice === slices) {
				[previous, latest, pending] = [latest, pending, previous];
				bindFields();
				slice = 0;
			}

			gl.useProgram(colorProgram);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.uniform1f(uBlend, slice / slices);
			gl.uniform1f(uPhase, phase);
			gl.uniform1f(uBand, drift.band.value(elapsed));
			gl.uniform1f(uGrain, drift.grain.value(elapsed));
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		});
	}
};

export default rainbowContours;
