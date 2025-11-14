import { PaxelRendererConfig } from "../../interfaces";
import { GraphicsApi } from "../../interfaces/graphics-api";
import { PaxelParticle } from "../../particle";
import { shaders } from "../../shaders/instanced-pixels";
import { createGraphicProgram, createOrthoMatrix, resizeCanvasToDisplaySize } from "../../utils/webgl";

class WebGlCanvasApi implements GraphicsApi {
  private renderPixelProgram: WebGLProgram | null;
  private vao: WebGLVertexArrayObject;
  private quadVBO: WebGLBuffer;
  private posVBO: WebGLBuffer;
  private colVBO: WebGLBuffer;
  private uCellSize: WebGLUniformLocation;
  private uProjectionMatrix: WebGLUniformLocation;

  private _inited: boolean = false;
  get inited() {
    return this._inited;
  }

  public get gl() {
    return this.canvas.getContext("webgl2",
      { alpha: true, preserveDrawingBuffer: this.config.canExport }
    ) as WebGL2RenderingContext
  }

  constructor(
    private canvas: HTMLCanvasElement,
    private config: PaxelRendererConfig
  ) {
    this.initWebGlContext();

    const { fragment, vertex } = shaders();
    this.renderPixelProgram = createGraphicProgram(this.gl, {
      vertex,
      fragment
    })

    this.createBuffers();

    this.bindBuffers();

    this._inited = true;
  }

  draw(cells: PaxelParticle[]) {
    const gl = this.gl;

    // Setup viewport e clear
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // typed arrays for gpu

    const posData = new Float32Array(cells.length * 2);
    //TODO: OPTIMZE TO UNSIGNED BYTES STRUCTURE
    const colData = new Float32Array(cells.length * (4 * 4));

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];

      posData[i * 2] = cell.position.x;
      posData[i * 2 + 1] = cell.position.y

      const color = cell.getParsedColor();
      colData[i * 4] = color[0];
      colData[i * 4 + 1] = color[1];
      colData[i * 4 + 2] = color[2];
      colData[i * 4 + 3] = color[3];
    }

    // Aggiorna buffer GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posVBO);
    gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.colVBO);
    gl.bufferData(gl.ARRAY_BUFFER, colData, gl.DYNAMIC_DRAW);

    gl.useProgram(this.renderPixelProgram);
    // set uniforms
    const cellSize = this.getCellSize();
    gl.uniform1f(this.uCellSize, cellSize);
    const orthoMatrix = this.getOrtographicMatrix();
    this.gl.uniformMatrix4fv(this.uProjectionMatrix, false, orthoMatrix);

    // draw all instances
    gl.bindVertexArray(this.vao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, cells.length);
    gl.bindVertexArray(null);
  }

  resize() {
    resizeCanvasToDisplaySize(this.gl.canvas as HTMLCanvasElement);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  private initWebGlContext() {
    if (!this.gl) {
      console.error('Cannot initialize webgl context');
    }

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.resize();
  }

  private getOrtographicMatrix() {
    const { rows } = this.config.grid;
    const cellSize = this.getCellSize();
    const gridSize = cellSize * rows;
    return createOrthoMatrix(
      0, gridSize, gridSize, 0
    )
  }

  private createBuffers() {
    if (!this.renderPixelProgram) {
      return;
    }
    this.vao = this.gl.createVertexArray()!;
    this.quadVBO = this.gl.createBuffer()!;
    this.posVBO = this.gl.createBuffer()!;
    this.colVBO = this.gl.createBuffer()!;

    this.uCellSize = this.gl.getUniformLocation(this.renderPixelProgram, "u_size")!;
    this.uProjectionMatrix = this.gl.getUniformLocation(this.renderPixelProgram, "u_projection")!;

  }

  private bindBuffers() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);

    // Quad base (2D unit square)
    const quadVerts = new Float32Array([
      0, 0, 1, 0, 0, 1,
      1, 0, 1, 1, 0, 1
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Buffer offsets (per istanza)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posVBO);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(1, 1);

    // Buffer colors (per instance)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colVBO);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(2, 1);

    gl.bindVertexArray(null);
  }

  private getCellSize() {
    return Math.floor(this.canvas.width / this.config.grid.rows);
  }
}

export { WebGlCanvasApi }