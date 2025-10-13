import { createGraphicProgram, createOrthoMatrix, resizeCanvasToDisplaySize } from "../utils/webgl";
import { GridController } from "../controllers/grid-controller";
import { shaders } from "../shaders/instanced-pixels";
import { LoopSystem } from "../systems/loop-system";
import { CollisionSystem } from "../systems/collision-system";
import { ForceSystem } from "../systems/force-system";
import { PaxelRendererConfig, PaxelRendererMode } from "../interfaces/renderer";
import { MotionVector2 } from "../interfaces";
import { LayersController } from "../controllers/layers-controller";


class PaxelRenderer {
  private inited: boolean = false;

  /**
   * ANIMATION
   */
  //fixed time step logic
  private step: number = 200;
  private stepAccumulator: number = 0;
  private lastFrameTime: number = performance.now();
  private loopFrameId: number | null;

  /**
   * GRID
  */
  private gridController: GridController;
  private layersController: LayersController;

  /**
   * WEBGL
  */
  private renderPixelProgram: WebGLProgram | null;
  private vao: WebGLVertexArrayObject;
  private quadVBO: WebGLBuffer;
  private posVBO: WebGLBuffer;
  private colVBO: WebGLBuffer;
  private uCellSize: WebGLUniformLocation;
  private uProjectionMatrix: WebGLUniformLocation;

  /**
   * SYSTEMS
  */
  private loopSystem = LoopSystem.instance;
  private forceSystem = ForceSystem.instance;
  private collisionSystem = CollisionSystem.instance;

  private mode: PaxelRendererMode = "static";

  private _selectedColor = "#000000"
  private get selectedColor() {
    return this._selectedColor;
  }

  public get gl() {
    return this.canvas.getContext("webgl2",
      { alpha: true, preserveDrawingBuffer: this.config.canExport }
    ) as WebGL2RenderingContext
  }

  constructor(
    private canvas: HTMLCanvasElement,
    private config: PaxelRendererConfig = {
      canvas: {
        width: 640,
        height: 640,
      },
      grid: {
        rows: 32,
        columns: 32,
      },
      layers: {
        default: "layer-1"
      },
      init: true,
      canExport: true,
    }
  ) {
    if (this.config.init) {
      this.init();
    }
  }

  init() {
    if (this.inited) {
      console.warn('Paxel Renderer yet inited!');
      return;
    }

    const canvasWidth = this.config.canvas?.width ?? this.canvas.offsetWidth;
    const canvasHeight = this.config.canvas?.height ?? this.canvas.offsetHeight;

    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvasWidth;
    const cssH = canvasHeight;
    this.canvas.width = cssW * dpr;
    this.canvas.height = cssH * dpr;

    this.initWebGlContext();

    const { fragment, vertex } = shaders();
    this.renderPixelProgram = createGraphicProgram(this.gl, {
      vertex,
      fragment
    })


    if (this.renderPixelProgram) {
      this.vao = this.gl.createVertexArray()!;
      this.quadVBO = this.gl.createBuffer()!;
      this.posVBO = this.gl.createBuffer()!;
      this.colVBO = this.gl.createBuffer()!;

      this.uCellSize = this.gl.getUniformLocation(this.renderPixelProgram, "u_size")!;
      this.uProjectionMatrix = this.gl.getUniformLocation(this.renderPixelProgram, "u_projection")!;

      this.initBuffers();

      this.layersController = new LayersController();
      this.gridController = new GridController(this.gl, this.renderPixelProgram, {
        width: this.config.grid.rows,
        height: this.config.grid.columns,
        cellSize: this.getCellSize(),
      });

      const defaultLayer = this.config.layers?.default ?? "layer-1";
      this.addLayer(defaultLayer);

      this.inited = true;
    }
  }

  drawAt(
    x: number,
    y: number,
    color?: string
  ) {
    const drawColor = color ?? this._selectedColor;
    this.gridController.setCell(x, y, drawColor);
    this.render(performance.now(), true);
  }

  removeAt(
    x: number,
    y: number
  ) {
    this.gridController.destroyCell(x, y);
    this.render(performance.now(), true);
  }

  putPixel(
    row: number,
    col: number
  ) {
    throw new Error("Put Pixel Not Implemented!");
  }

  removePixel(
    row: number,
    col: number
  ) {
    throw new Error("Remove Pixel Not Implemented!");
  }

  /**
   * Add force to the motion mode simulation
   * @param name force name
   * @param force vector representing x and y units on grid per step
   */
  addForce(name: string, force: MotionVector2) {
    this.forceSystem.upsertForce(name, force);
  }

  updateForce(name: string, force: MotionVector2) {
    this.forceSystem.upsertForce(name, force);
  }

  removeForce(name: string) {
    this.forceSystem.removeForce(name);
  }

  getMode() {
    return this.mode;
  }

  setMode(mode: PaxelRendererMode) {
    this.mode = mode;
  }

  addLayer(name?: string) {
    let layerName = name ?? ""

    if (!layerName) {
      layerName = `layer-${this.layersController.getAll().length + 1}`;
    }

    this.layersController.create(layerName);

    if (this.gridController.getLayer() === undefined) {
      const layer = this.layersController.getByIndex(0);
      this.gridController.setLayer(layer);
    }
  }

  removeLayer(name: string) {
    return this.layersController.drop(name);
  }

  switchLayer(name: string) {
    const layer = this.layersController.getByName(name);

    if (layer) {
      this.gridController.setLayer(layer);
    }
  }

  getActiveDrawLayer() {
    return this.gridController.getLayer()?.name;
  }

  getLayers() {
    return this.layersController.getNames();
  }

  clearLayer(name: string) {
    if (this.mode === "motion") {
      return;
    }

    this.layersController.clear(name);
    this.render(performance.now(), true);
  }

  changeLayerOrder(name: string, index: number) {
    this.layersController.changeOrder(name, index);
  }

  setDrawColor(color: string) {
    this._selectedColor = color;
  }

  clearAllLayers() {
    if (this.mode === "motion") {
      return;
    }

    this.layersController.clearAll();
    this.render(performance.now(), true);
  }

  start() {
    this.setMode('motion');
    this.stepAccumulator = 0;
    this.loopFrameId = requestAnimationFrame(this.render.bind(this));
  }

  reset() {
    this.layersController.getParticles().forEach(particle => {
      particle.restoreOriginalPosition();
      particle.setFreeze(false);
    });

    if (this.mode === "static") {
      this.render(performance.now(), true);
    }
  }

  stop() {
    if (!this.loopFrameId) {
      return;
    }

    this.setMode('static');
    cancelAnimationFrame(this.loopFrameId);
    this.loopFrameId = null;
  }

  private render(now: number, isSingleTick: boolean = false) {
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    const elapsedSeconds = deltaTime / 1000;

    const maxFrame = 200; // max ms per frame
    const ft = Math.min(deltaTime, maxFrame);

    this.stepAccumulator += ft;

    if (this.mode === "motion") {
      // fixed step => motion simulation update
      if (this.stepAccumulator >= this.step) {
        const layers = this.layersController.getAll();
        for (const layer of layers) {
          const { particles } = layer;

          for (const particle of particles) {
            if (particle.isFreezed) {
              continue;
            }

            let updatePos = this.forceSystem.applyForces(deltaTime, particle);

            let isColliding = false;

            if (
              this.collisionSystem.isOutOfBounds({
                position: updatePos,
                size: particle.size
              }, this.canvas)
            ) {
              particle.setFreeze(true);
              continue;
            }

            //TODO: should optimize collision by area??
            if (!isColliding) {
              for (const collider of this.layersController.getParticles()) {
                if (particle.id === collider.id || !collider.isFreezed) {
                  continue;
                }

                if (
                  this.collisionSystem.isColliding(
                    { position: updatePos, size: particle.size },
                    { position: collider.position, size: collider.size }
                  )
                ) {
                  particle.setFreeze(true);
                  isColliding = true;
                  break;
                }
              }
            }

            if (isColliding) {
              continue;
            }

            particle.setPosition(updatePos.x, updatePos.y);
          }

        }

        this.stepAccumulator -= this.step;
      }
    }

    this.draw();

    if (!isSingleTick) {
      requestAnimationFrame(this.render.bind(this));
    }
  }

  private initWebGlContext() {
    if (!this.gl) {
      console.error('Cannot initialize webgl context');
    }

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.resizeWebGlCanvas();
  }

  private resizeWebGlCanvas() {
    resizeCanvasToDisplaySize(this.gl.canvas as HTMLCanvasElement);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
  }

  private getCanvasSize() {
    const canvasWidth = this.config.canvas?.width ?? this.canvas.offsetWidth;
    const canvasHeight = this.config.canvas?.height ?? this.canvas.offsetHeight;

    return {
      width: canvasWidth,
      height: canvasHeight
    }
  }

  private getCellSize() {
    const { width } = this.getCanvasSize();
    return Math.floor(width / this.config.grid.rows);
  }

  //INSTANCED RENDERING METHODS
  // Matrix Transform [0..W]×[0..H] → NDC [-1..1]
  private getOrtographicMatrix() {
    const { rows } = this.config.grid;
    const cellSize = this.getCellSize();
    const gridSize = cellSize * rows;
    return createOrthoMatrix(
      0, gridSize, gridSize, 0
    )
  }

  private initBuffers() {
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

  private draw() {
    const gl = this.gl;

    // Setup viewport e clear
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // typed arrays for gpu
    const cells = this.layersController.getParticles();
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
}

export { PaxelRenderer }