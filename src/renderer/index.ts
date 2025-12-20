import { GridController } from "../controllers/grid-controller";
import { LoopSystem } from "../systems/loop-system";
import { CollisionSystem } from "../systems/collision-system";
import { ForceSystem } from "../systems/force-system";
import { UpdatePaxelRendererConfig, type PaxelRendererConfig } from "../interfaces/renderer";
import { type MotionVector2 } from "../interfaces/particle";
import { LayersController } from "../controllers/layers-controller";
import { GraphicsApi, GraphicsApiType } from "../interfaces/graphics-api";
import { WebGlCanvasApi } from "./graphics-api/webgl-canvas";
import { GridOptions } from "../interfaces/grid";
import { SystemName } from "../systems/system.abstract";


class PaxelRenderer {
  private inited: boolean = false;

  /**
   * CONTROLLERS
  */
  private gridController: GridController;
  private layersController: LayersController;

  /**
   * GRAPHICS API
  */
  private graphicsApi: GraphicsApi<GraphicsApiType>;

  /**
   * SYSTEMS
  */
  private loopSystem = LoopSystem.instance;
  private forceSystem = ForceSystem.instance;
  private collisionSystem = CollisionSystem.instance;

  /**
 * MOTION
 */
  private lastTime: number = 0;
  private accumulator: number = 0;
  private loopFrameId: number | null;
  private maxFPS: number = 30;
  private get minFrameDuration(): number {
    return 1000 / this.maxFPS;
  }
  private targetFPS: number = 15;
  private get frameDuration(): number {
    return 1000 / this.targetFPS;
  }
  private running: boolean = false;
  private get isRunning(): boolean {
    return this.running;
  }

  private defaultDrawColor = "#000000"

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

  //#region LIBRARY API 
  //#region INIT
  init() {
    if (this.inited) {
      console.warn('Paxel Renderer yet inited!');
      return;
    }

    this.setCanvas();

    this.graphicsApi = new WebGlCanvasApi(
      this.canvas,
      {
        canExport: this.config.canExport
      }
    );

    if (this.graphicsApi.inited) {
      this.layersController = new LayersController();

      const gridOptions: GridOptions = this.getGridOptions();
      this.gridController = new GridController(gridOptions);

      const defaultLayer = this.config.layers?.default ?? "layer-1";
      this.addLayer(defaultLayer);

      if (this.config?.defaultColor) {
        this.defaultDrawColor = this.config.defaultColor;
      }

      this.inited = true;
    }
  }
  //#endregion


  //#region CANVAS
  resize() {
    this.graphicsApi.resize();
    if (this.inited) {
      this.draw();
    }
  }

  setBackgroundColor(color: string) {
    this.graphicsApi.backgroundColor = color;
  }

  private setCanvas() {
    const canvasWidth = this.config.canvas.width;
    const canvasHeight = this.config.canvas.height;

    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;

    const dpr = window.devicePixelRatio || 1;
    const cssW = canvasWidth;
    const cssH = canvasHeight;
    this.canvas.width = cssW * dpr;
    this.canvas.height = cssH * dpr;
  }
  //#endregion


  //#region CONFIG
  updateConfig(config: UpdatePaxelRendererConfig) {
    if (config.canvas !== undefined) {
      this.config.canvas = config.canvas;
      this.setCanvas();
    }

    if (config.grid !== undefined) {
      this.config.grid = config.grid;
      const gridOptions: GridOptions = this.getGridOptions();
      this.gridController.setGridOptions(gridOptions);
    }

    if (config.canExport !== undefined) {
      this.config.canExport = config.canExport;
      this.graphicsApi.canExport = config.canExport;
    }
  }
  //#endregion


  //#region DRAW
  drawAt(
    x: number,
    y: number,
    color?: string
  ) {
    const drawColor = color ?? this.defaultDrawColor;
    this.gridController.setCellAtPosition(x, y, drawColor);
    this.draw();
  }

  removeAt(
    x: number,
    y: number
  ) {
    this.gridController.removeCellAtPosition(x, y);
    this.draw();
  }

  putPixel(
    row: number,
    column: number,
    color?: string
  ) {
    const drawColor = color ?? this.defaultDrawColor;
    this.gridController.setCellInGrid(row, column, drawColor);
    this.draw();
  }

  removePixel(
    row: number,
    column: number
  ) {
    this.gridController.removeCell(row, column);
    this.draw();
  }
  //#endregion


  //#region PHYSICS 
  /**
   * Add force to the motion mode simulation
   * @param name force name
   * @param force vector representing x and y units on grid per step
   */
  setForce(
    name: string,
    force: MotionVector2,
    layers?: string[]
  ) {
    this.forceSystem.upsertForce(name, force);

    if (layers) {
      layers.forEach((layer) => {
        this.applyPhysics([layer], "force", true);
      });
    }
  }

  removeForce(name: string) {
    this.forceSystem.removeForce(name);
  }

  /**
   * Set the loop time before simulation loops in seconds
   * 
   * @param loopTime seconds before loop
   */
  setLoopTime(
    loopTime: number
  ) {
    const loopMs = loopTime * 1000;
    this.loopSystem.setLoopAfter(loopMs);
  }

  applyPhysics(
    layers: string[] | string,
    systemName: SystemName,
    apply: boolean
  ) {
    const group = Array.isArray(layers) ?
      [...layers] :
      [layers];

    group.forEach((layerName) => {
      const layer = this.layersController.getByName(layerName);

      if (!layer) {
        console.error('Cannot apply physics to layer: ', layerName);
        return;
      }

      const system = this.getSystem(systemName);

      if (apply) {
        system.register(layer);
      } else {
        system.unregister(layer);
      }
    })
  }

  private getSystem(name: SystemName) {
    switch (name) {
      case "force":
        return this.forceSystem;
      case "loop":
        return this.loopSystem;
      case "collision":
        return this.collisionSystem;
    }
  }
  //#endregion


  //#region LAYERS
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

  getActiveLayer() {
    return this.gridController.getLayer()?.name;
  }

  setActiveLayer(name: string) {
    const layer = this.layersController.getByName(name);

    if (layer) {
      this.gridController.setLayer(layer);
    }
  }

  getLayers() {
    return this.layersController.getNames();
  }

  changeLayerOrder(name: string, index: number) {
    this.layersController.changeOrder(name, index);
  }

  clearLayers(layer?: string) {
    if (layer === undefined) {
      this.layersController.clearAll();
    } else {
      this.layersController.clear(layer);
    }

    if (!this.isRunning) {
      this.draw();
    }
  }
  //#endregion


  //#region MOTION
  setFPS(fps: number) {
    if (fps > this.maxFPS) {
      console.warn("The max fps limit is set to", this.maxFPS);
      return;
    }

    this.targetFPS = fps;
  }

  start() {
    if (this.isRunning) {
      return;
    }

    this.running = true;
    this.lastTime = performance.now();

    this.loopSystem.init();
    this.loop();
  }

  reset() {
    this.loopSystem.reset();

    this.layersController.getParticles().forEach(particle => {
      particle.restoreOriginalPosition();
      particle.setFreeze(false);
    });

    if (!this.isRunning) {
      this.draw();
    }
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.running = false;

    if (this.loopFrameId) {
      cancelAnimationFrame(this.loopFrameId);
      this.loopFrameId = null;
    }
  }
  //#endregion
  //#endregion


  //#region MAIN LOOP
  private loop(now?: number) {
    if (!this.isRunning) {
      return;
    }

    const currentTime = now ?? performance.now();

    const deltaTime = currentTime - this.lastTime; //ms
    this.lastTime = currentTime;

    //clamping deltaTime
    const maxFrameTime = 200;
    const ft = Math.min(deltaTime, maxFrameTime); //ms

    this.accumulator += ft;

    // fixed step => motion simulation update
    if (this.accumulator >= this.frameDuration) {
      const layers = this.layersController.getAll();
      for (const layer of layers) {
        const enabledForce = this.forceSystem.isRegistered(layer);
        if (!enabledForce) {
          continue;
        }

        const { particles } = layer;
        this.loopSystem.update(this.accumulator);

        const isLoop = this.loopSystem.checkLoop();
        if (isLoop) {
          continue;
        }

        for (const particle of particles) {
          if (particle.isFreezed) {
            continue;
          }

          let updatePos = this.forceSystem.applyForces(deltaTime, particle);

          //TODO: should optimize and revise collision system rules
          // if (this.collisionSystem.isRegistered(layer)) {
          //   let isColliding = false;

          //   if (
          //     this.collisionSystem.isOutOfBounds({
          //       position: updatePos,
          //       size: particle.size
          //     }, this.canvas)
          //   ) {
          //     particle.setFreeze(true);
          //     continue;
          //   }

          //   if (!isColliding) {
          //     for (const collider of this.layersController.getParticles()) {
          //       if (particle.id === collider.id || !collider.isFreezed) {
          //         continue;
          //       }

          //       if (
          //         this.collisionSystem.isColliding(
          //           { position: updatePos, size: particle.size },
          //           { position: collider.position, size: collider.size }
          //         )
          //       ) {
          //         particle.setFreeze(true);
          //         isColliding = true;
          //         break;
          //       }
          //     }
          //   }

          //   if (isColliding) {
          //     continue;
          //   }
          // }

          particle.setPosition(updatePos.x, updatePos.y);
        }

      }

      this.accumulator -= this.frameDuration;
    }

    this.draw();

    if (this.isRunning) {
      this.loopFrameId = requestAnimationFrame(this.loop.bind(this));
    }
  }

  private draw() {
    this.graphicsApi.draw(
      this.getGridOptions(),
      this.layersController.getParticles()
    );
  }
  //#endregion


  //#region UTILS
  private getCellSize() {
    return Math.floor(this.canvas.width / this.config.grid.rows);
  }

  private getGridOptions() {
    return {
      rows: this.config.grid.rows,
      columns: this.config.grid.columns,
      cellSize: this.getCellSize(),
    }
  }
  //#endregion
}

export { PaxelRenderer }