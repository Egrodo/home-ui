function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
	const shader = gl.createShader(type) as WebGLShader;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		throw new Error(`Shader failed to compile: ${gl.getShaderInfoLog(shader)}`);
	}
	return shader;
}

export function createProgram(
	gl: WebGL2RenderingContext,
	vertexSource: string,
	fragmentSource: string
): WebGLProgram {
	const program = gl.createProgram() as WebGLProgram;
	gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
	gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
	gl.linkProgram(program);
	// Large uniform arrays can exceed the GPU's limit.
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error(`Shader failed to link: ${gl.getProgramInfoLog(program)}`);
	}
	return program;
}
