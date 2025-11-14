import { GridController } from "../controllers/grid-controller";
import { LoopSystem } from "../systems/loop-system";
import { CollisionSystem } from "../systems/collision-system";
import { ForceSystem } from "../systems/force-system";
import { type PaxelRendererConfig, type PaxelRendererMode } from "../interfaces/renderer";
import { type MotionVector2 } from "../interfaces/particle";
import { LayersController } from "../controllers/layers-controller";
import { GraphicsApi } from "../interfaces/graphics-api";
import { WebGlCanvasApi } from "./graphics-api/webgl-canvas";


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
   * CONTROLLERS
  */
  private gridController: GridController;
  private layersController: LayersController;

  /**
   * GRAPHICS API
  */
  private graphicsApi: GraphicsApi;

  /**
   * SYSTEMS
  */
  private loopSystem = LoopSystem.instance;
  private forceSystem = ForceSystem.instance;
  private collisionSystem = CollisionSystem.instance;

  private mode: PaxelRendererMode = "static";

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

  //#region PUBLIC API 
  //#region INIT
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

    this.graphicsApi = new WebGlCanvasApi(
      this.canvas,
      this.config
    );

    if (this.graphicsApi.inited) {
      this.layersController = new LayersController();
      this.gridController = new GridController({
        width: this.config.grid.rows,
        height: this.config.grid.columns,
        cellSize: this.getCellSize(),
      });

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
      this.render(performance.now());
    }
  }
  //#endregion


  //#region CONFIG
  updateConfig(config: PaxelRendererConfig) {
    //TODO;
  }
  //#endregion


  //#region DRAW
  drawAt(
    x: number,
    y: number,
    color: string
  ) {
    const drawColor = color ?? this.defaultDrawColor;
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
  //#endregion


  //#region PHYSICS 
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

  applyForce(layerName: string, apply: boolean) {
    const layer = this.layersController.getByName(layerName);

    if (!layer) {
      console.error('Cannot apply physics to layer: ', layerName);
      return;
    }

    if (apply) {
      this.forceSystem.register(layer);
    } else {
      this.forceSystem.unregister(layer);
    }
  }

  applyLoop(layerName: string, apply: boolean) {
    const layer = this.layersController.getByName(layerName);

    if (!layer) {
      console.error('Cannot apply loop to layer: ', layerName);
      return;
    }

    if (apply) {
      this.loopSystem.register(layer);
    } else {
      this.loopSystem.unregister(layer);
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
    this.layersController.clear(name);
    if (this.mode !== "motion") {
      this.render(performance.now(), true);
    }
  }

  changeLayerOrder(name: string, index: number) {
    this.layersController.changeOrder(name, index);
  }

  clearAllLayers() {
    this.layersController.clearAll();

    if (this.mode !== "motion") {
      this.render(performance.now(), true);
    }
  }
  //#endregion
  //#endregion

  //#region MOTION
  getMode() {
    return this.mode;
  }

  setMode(mode: PaxelRendererMode) {
    this.mode = mode;
  }

  start() {
    this.setMode('motion');
    this.stepAccumulator = 0;
    this.loopSystem.init();
    this.loopFrameId = requestAnimationFrame(this.render.bind(this));
  }

  reset() {
    this.loopSystem.reset();
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
  //#endregion
  //#endregion

  //#region MAIN LOOP
  private render(now: number, isSingleTick: boolean = false) {
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const maxFrame = 200; // max ms per frame
    const ft = Math.min(deltaTime, maxFrame);

    this.stepAccumulator += ft;

    if (this.mode === "motion") {
      // fixed step => motion simulation update
      if (this.stepAccumulator >= this.step) {
        const layers = this.layersController.getAll();
        for (const layer of layers) {
          const enabledForce = this.forceSystem.isRegistered(layer);
          if (!enabledForce) {
            continue;
          }

          const { particles } = layer;
          this.loopSystem.update(this.stepAccumulator);

          for (const particle of particles) {
            if (particle.isFreezed) {
              continue;
            }

            let updatePos = this.forceSystem.applyForces(deltaTime, particle);

            //TODO: should optimize and revise collision system rules
            if (this.collisionSystem.isRegistered(layer)) {
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
            }

            particle.setPosition(updatePos.x, updatePos.y);
          }

        }

        this.stepAccumulator -= this.step;
      }
    }

    this.graphicsApi.draw(
      this.layersController.getParticles()
    );

    if (!isSingleTick) {
      requestAnimationFrame(this.render.bind(this));
    }
  }
  //#endregion


  //#region UTILS
  private getCellSize() {
    return Math.floor(this.canvas.width / this.config.grid.rows);
  }
  //#endregion
}

export { PaxelRenderer }