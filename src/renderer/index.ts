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
import { LayerCollisionOptions } from "../interfaces/systems";
import { IAddLayerConfig } from "../interfaces/layers";

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
      defaultLayer: "layer-1",
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

      const defaultLayer = this.config.defaultLayer;
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
    this.draw();
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
    color?: string,
    targetLayer?: string
  ) {
    if (targetLayer) {
      this.setActiveLayer(targetLayer);
    }

    const drawColor = color ?? this.defaultDrawColor;
    this.gridController.setCellAtPosition(x, y, drawColor);
    this.draw();
  }

  removeAt(
    x: number,
    y: number,
    targetLayer?: string
  ) {
    if (targetLayer) {
      this.setActiveLayer(targetLayer);
    }

    this.gridController.removeCellAtPosition(x, y);
    this.draw();
  }

  putPixel(
    row: number,
    column: number,
    color?: string,
    targetLayer?: string
  ) {
    if (targetLayer) {
      this.setActiveLayer(targetLayer);
    }

    const drawColor = color ?? this.defaultDrawColor;
    this.gridController.setCellInGrid(row, column, drawColor);
    this.draw();
  }

  removePixel(
    row: number,
    column: number,
    targetLayer?: string
  ) {
    if (targetLayer) {
      this.setActiveLayer(targetLayer);
    }

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
  createForce(
    name: string,
    forceVector: MotionVector2,
  ) {
    this.forceSystem.upsertForce(name, forceVector);
  }

  removeForce(name: string) {
    this.forceSystem.removeForce(name);
  }

  applyForce(layerName: string, apply: boolean = true) {
    const layer = this.layersController.getByName(layerName);

    if (!layer) {
      console.error('Cannot apply force to layer: ', layerName);
      return;
    }

    this.forceSystem.apply(layer, apply);
  }

  setForceOnLayer(layerName: string, forceName: string) {
    const layer = this.layersController.getByName(layerName);

    if (layer) {
      this.forceSystem.addForceToLayer(layer, forceName);
    }
  }

  removeForceFromLayer(layerName: string, forceName: string) {
    const layer = this.layersController.getByName(layerName);

    if (layer) {
      this.forceSystem.removeForceFromLayer(layer, forceName);
    }
  }

  /**
   * Set the time duration before simulation loops in seconds
   * 
   * @param loopTime seconds before loop
   */
  setLoopDuration(
    loopTime: number
  ) {
    const loopMs = loopTime * 1000;
    this.loopSystem.setLoopAfter(loopMs);
  }

  applyLoop(layerName: string, apply: boolean = true) {
    const layer = this.layersController.getByName(layerName);

    if (!layer) {
      console.error('Cannot apply loop to layer: ', layerName);
      return;
    }

    this.loopSystem.apply(layer, apply);
  }

  applyCollision(layerName: string, apply: boolean = true) {
    const layer = this.layersController.getByName(layerName);

    if (!layer) {
      console.error('Cannot apply loop to layer: ', layerName);
      return;
    }

    this.collisionSystem.apply(layer, apply);
  }
  //#endregion


  //#region LAYERS
  addLayer(name: string, addLayerConfig: IAddLayerConfig = {
    force: true,
    loop: true,
    collision: true,
  }) {
    if (!name) {
      console.warn("Cannot add layer with invalid name: ", name);
      return;
    }

    const existingLayer = this.layersController.getByName(name);
    if (!!existingLayer) {
      console.warn("Cannot add layer with name of existing layer: ", name);
      return;
    }

    const layer = this.layersController.create(name);

    if (this.gridController.getLayer() === undefined) {
      const layer = this.layersController.getByIndex(0);
      this.gridController.setLayer(layer);
    }

    const { force, loop, collision } = addLayerConfig;

    if (force !== undefined) {
      this.applyForce(layer.name, force);
    }

    if (loop !== undefined) {
      this.applyLoop(layer.name, loop);
    }

    if (collision !== undefined) {
      this.applyCollision(layer.name, collision);
    }

    return name;
  }

  removeLayerByName(name: string) {
    const removed = this.layersController.drop(name);

    if (removed >= 0) {
      this.draw();
    }

    return removed;
  }

  getActiveLayer() {
    const activeLayer = this.gridController.getLayer();
    return activeLayer.name;
  }

  setActiveLayer(name: string) {
    const layer = this.layersController.getByName(name);

    if (layer) {
      this.gridController.setLayer(layer);
    }
  }

  setLayerVisibility(name: string, visible: boolean) {
    this.layersController.setVisible(name, visible);
    this.draw();
  }

  setLayerCollision(name: string, collisionOptions: LayerCollisionOptions) {
    const layer = this.layersController.getByName(name);

    if (layer) {
      this.collisionSystem.setLayerCollisionOptions(layer, collisionOptions);
    }
  }

  getLayers() {
    return this.layersController.list();
  }

  changeLayerOrder(name: string, index: number) {
    this.layersController.changeOrder(name, index);
  }

  clearLayer(name: string) {
    this.layersController.clear(name);
    this.draw();
  }

  clearAllLayers() {
    this.layersController.clearAll();
    this.draw();
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
      this.loopSystem.update(this.accumulator);

      for (const layer of layers) {
        if (!layer.visible) {
          continue;
        }

        const { particles } = layer;

        const isForceEnabled = this.forceSystem.isRegistered(layer);
        const isCollisionEnabled = this.collisionSystem.isRegistered(layer);

        for (const particle of particles) {
          if (particle.isFreezed) {
            continue;
          }

          let updatePos: MotionVector2 = { ...particle.position };

          if (isForceEnabled) {
            const totalLayerForce = this.forceSystem.getLayerForcesResult(layer);
            updatePos = this.forceSystem.applyForceToParticle(totalLayerForce, particle);
          }

          if (isCollisionEnabled) {
            const collisionOptions = this.collisionSystem.getLayerCollisionOptions(layer);

            if (collisionOptions?.stopOnBounds) {
              const checkBoundsCollision = this.collisionSystem.checkBoundsCollision(
                this.canvas,
                layer,
                particle,
                updatePos
              );

              if (checkBoundsCollision) {
                this.collisionSystem.resolveCollisionResponse(particle, collisionOptions);
                continue;
              }
            }

            let isParticleCollision = false;

            const collidersLayers = this.collisionSystem.getLayerColliders(layer);
            const collidersParticles = this.layersController.getParticles({
              includeLayers: collidersLayers,
            });

            for (const colliderParticle of collidersParticles) {
              if (particle.id === colliderParticle.id) {
                continue;
              }

              isParticleCollision = this.collisionSystem.checkParticleCollision(
                layer,
                particle,
                updatePos,
                colliderParticle
              );

              if (isParticleCollision) {
                break;
              }
            }

            if (isParticleCollision) {
              continue;
            }
          }

          particle.setPosition(updatePos.x, updatePos.y);
        }
      }

      this.loopSystem.checkLoop();
      this.accumulator = 0;
    }

    this.draw();

    if (this.isRunning) {
      this.loopFrameId = requestAnimationFrame(this.loop.bind(this));
    }
  }

  draw() {
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