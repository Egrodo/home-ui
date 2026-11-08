import { loop } from '../../loop';
import type { Screensaver } from '../../types';
import { createProgram } from '../../webgl';
import { bakeFrameRamps, bakeLoopingRamp } from './color';
import * as config from './config';
import { COLOR_SHADER, VERTEX_SHADER } from './shader';

const TAU = Math.PI * 2;

const INTERIOR_TEXTURE_UNIT = 0;
const FRAME_TEXTURE_UNIT = 1;

/** Largest random offset for the dither noise each frame, in pixels. */
const DITHER_SEED_RANGE = 1024;

/** The farthest a pixel can be from an edge, in fractions of the short edge. */
const MAX_EDGE_DISTANCE = 0.5;

/** Stores ramps at 16 bits, since 8 would band before the final dither could help. */
function createRampTexture(
	gl: WebGL2RenderingContext,
	pixels: Float32Array,
	rows: number,
	wrap: number
) {
	const size = pixels.length / 4 / rows;
	gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
	gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, size, rows);
	gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, size, rows, gl.RGBA, gl.FLOAT, pixels);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

const spectral: Screensaver = {
	start({ canvas, width, height, signal }) {
		// Opaque, so the browser needn't composite the UI underneath it.
		const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false });
		if (!gl) throw new Error('WebGL2 not available');

		const program = createProgram(gl, VERTEX_SHADER, COLOR_SHADER);

		// One oversized triangle, so the fragment shader runs once per pixel.
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		gl.activeTexture(gl.TEXTURE0 + INTERIOR_TEXTURE_UNIT);
		createRampTexture(gl, bakeLoopingRamp(config.INTERIOR_STOPS, config.RAMP_SIZE), 1, gl.REPEAT);

		// The shader expects the rows in this order.
		const { top, side, bottom, topCorner, bottomCorner } = config.FRAME_STOPS;
		const frameRamps = [top, side, bottom, topCorner, bottomCorner];
		gl.activeTexture(gl.TEXTURE0 + FRAME_TEXTURE_UNIT);
		createRampTexture(
			gl,
			bakeFrameRamps(frameRamps, config.RAMP_SIZE, MAX_EDGE_DISTANCE),
			frameRamps.length,
			gl.CLAMP_TO_EDGE
		);

		const uniform = (name: string) => gl.getUniformLocation(program, name);
		const uPhase = uniform('uPhase');
		const uDitherSeed = uniform('uDitherSeed');
		const uReach = uniform('uReach');
		const uDensity = uniform('uDensity');
		const uWave = uniform('uWave');

		gl.useProgram(program);
		gl.uniform1i(uniform('uInterior'), INTERIOR_TEXTURE_UNIT);
		gl.uniform1i(uniform('uFrame'), FRAME_TEXTURE_UNIT);
		gl.uniform2f(uniform('uRes'), width, height);
		gl.uniform1f(uniform('uVisible'), config.INTERIOR_VISIBLE_FRACTION);
		gl.uniform1f(uniform('uCurve'), config.INTERIOR_CURVE);
		gl.uniform1f(uniform('uDither'), config.DITHER_STRENGTH);
		gl.uniform1f(uniform('uCornerSharpness'), config.FRAME_CORNER_SHARPNESS);
		gl.uniform1f(uniform('uCornerSize'), config.FRAME_CORNER_SIZE);
		gl.uniform1f(uniform('uMaxDistance'), MAX_EDGE_DISTANCE);
		gl.uniform1f(uniform('uUnevenness'), config.HALO_UNEVENNESS);
		gl.uniform1f(uniform('uColorWander'), config.HALO_COLOR_WANDER);

		// Starts somewhere new each time. Wraps at 1, which the repeating ramp makes invisible.
		let phase = Math.random();
		let elapsed = 0;

		const waveStarts = config.HALO_WAVES.map(() => Math.random() * TAU);
		const waveData = new Float32Array(config.HALO_WAVES.flatMap((w) => [TAU * w.x, TAU * w.y, 0]));

		loop(signal, (frameDt) => {
			const dt = frameDt * config.ANIMATION_SPEED;
			elapsed += dt;
			phase = (phase + dt / config.INTERIOR_LOOP_SECONDS) % 1;

			const periods = config.HALO_PULSE_PERIODS;
			const pulse =
				periods.reduce((sum, period) => sum + Math.sin((TAU * elapsed) / period), 0) /
				periods.length;

			gl.uniform1f(uPhase, phase);
			gl.uniform1f(uReach, 1 + pulse * config.HALO_REACH_PULSE);
			gl.uniform1f(uDensity, 1 - pulse * config.HALO_DENSITY_PULSE);

			config.HALO_WAVES.forEach((wave, i) => {
				waveData[i * 3 + 2] = (waveStarts[i] + (TAU * elapsed) / wave.period) % TAU;
			});
			gl.uniform3fv(uWave, waveData);

			if (config.DITHER_ANIMATED) {
				gl.uniform2f(
					uDitherSeed,
					Math.random() * DITHER_SEED_RANGE,
					Math.random() * DITHER_SEED_RANGE
				);
			}
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		});
	}
};

export default spectral;
