function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  // Lookup the size the browser is displaying the canvas in CSS pixels.
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Check if the canvas is not the same size.
  const needResize = canvas.width !== displayWidth ||
    canvas.height !== displayHeight;

  if (needResize) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}

function randomInt(range: number) {
  return Math.floor(Math.random() * range);
}

function randomRangedInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Matrix for ortho projection
 * @param {number} left   – min X del volume di vista
 * @param {number} right  – max X
 * @param {number} bottom – min Y
 * @param {number} top    – max Y
 * @param {number} near   – near distance plane
 * @param {number} far    – far distance plane
 * @returns {Float32Array} matrice 4×4 (16 elementi)
 */
function createOrthoMatrix(left: number, right: number, bottom: number, top: number, near: number = -1, far: number = 1) {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);

  // Column-major order
  return new Float32Array([
    -2 * lr, 0, 0, 0,
    0, -2 * bt, 0, 0,
    0, 0, 2 * nf, 0,
    (left + right) * lr,
    (top + bottom) * bt,
    (far + near) * nf,
    1
  ]);
}
/**
 * Convert colors to Float32Array [r, g, b, a],
 * 
 * @param color hex string, rgb(a) or array [r,g,b,a]
 */
function parseColorRGBA(
  color: string | [number, number, number] | [number, number, number, number]
): Float32Array {
  let r: number, g: number, b: number, a: number;

  if (typeof color === "string") {
    color = color.trim();

    // Hex: #RRGGBB o #RRGGBBAA
    const hexMatch = color.match(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
    if (hexMatch) {
      const hex = hexMatch[1];
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) : 255;
    } else {
      // rgb() o rgba()
      const numMatch = color.match(
        /^rgba?\(\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*,\s*([\d.]+%?)\s*(?:,\s*([\d.]+%?)\s*)?\)$/
      );
      if (!numMatch) {
        throw new Error(`Formato colore non valido: "${color}"`);
      }
      const toVal = (v: string) =>
        v.endsWith("%")
          ? Math.round((parseFloat(v) / 100) * 255)
          : Math.round(parseFloat(v));
      r = toVal(numMatch[1]);
      g = toVal(numMatch[2]);
      b = toVal(numMatch[3]);
      a = numMatch[4] !== undefined ? toVal(numMatch[4]) : 255;
    }
  } else {
    // array numerico [r,g,b] o [r,g,b,a]
    [r, g, b, a = 255] = color;
  }

  // Normalizza e restituisce
  return new Float32Array([r / 255, g / 255, b / 255, a / 255]);
}


const loadShader = (
  gl: WebGL2RenderingContext,
  source: string,
  type: WebGL2RenderingContext['VERTEX_SHADER'] | WebGL2RenderingContext['FRAGMENT_SHADER']
) => {
  const shader = gl.createShader(type) as WebGLShader;

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}


const createGraphicProgram = (
  gl: WebGL2RenderingContext,
  params: {
    vertex: string,
    fragment: string
  }) => {
  let vertexShader: WebGLShader | null = loadShader(gl, params.vertex, gl.VERTEX_SHADER);
  let fragmentShader: WebGLShader | null = loadShader(gl, params.fragment, gl.FRAGMENT_SHADER);

  const shaderProgram = gl.createProgram();

  if (vertexShader) {
    gl.attachShader(shaderProgram, vertexShader);
  }

  if (fragmentShader) {
    gl.attachShader(shaderProgram, fragmentShader);
  }

  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram,
      )}`,
    );
    return null;
  }

  return shaderProgram;
}


export {
  resizeCanvasToDisplaySize,
  randomInt,
  randomRangedInt,
  createOrthoMatrix,
  parseColorRGBA,
  createGraphicProgram
}