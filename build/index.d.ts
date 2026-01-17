//#region src/interfaces/renderer.d.ts
type UpdatePaxelRendererConfig = Partial<Pick<PaxelRendererConfig, "canvas" | "grid" | "canExport">>;
interface PaxelRendererConfig {
  init: boolean;
  canExport: boolean;
  grid: {
    rows: number;
    columns: number;
  };
  canvas: {
    width: number;
    height: number;
  };
  layers?: {
    default?: string;
  };
  defaultColor?: string;
}
declare const MOTION_RENDERER_MODES: readonly ["static", "motion"];
type PaxelRendererMode = typeof MOTION_RENDERER_MODES[number];
//#endregion
//#region src/interfaces/particle.d.ts
interface MotionVector2 {
  x: number;
  y: number;
}
//#endregion
//#region src/interfaces/layers.d.ts
interface AddLayerConfig {
  force?: boolean;
  loop?: boolean;
  collision?: boolean;
}
//#endregion
//#region src/interfaces/systems.d.ts
interface LayerCollisionOptions {
  colliders?: string[];
  stopOnBounds?: boolean;
  destroyOnCollision?: boolean;
  loopOnCollision?: boolean;
}
//#endregion
//#region src/renderer/index.d.ts
declare class PaxelRenderer {
  private canvas;
  private config;
  private inited;
  /**
   * CONTROLLERS
  */
  private gridController;
  private layersController;
  /**
   * GRAPHICS API
  */
  private graphicsApi;
  /**
   * SYSTEMS
  */
  private loopSystem;
  private forceSystem;
  private collisionSystem;
  /**
  * MOTION
  */
  private lastTime;
  private accumulator;
  private loopFrameId;
  private maxFPS;
  private get minFrameDuration();
  private targetFPS;
  private get frameDuration();
  private running;
  private get isRunning();
  private defaultDrawColor;
  constructor(canvas: HTMLCanvasElement, config?: PaxelRendererConfig);
  init(): void;
  resize(): void;
  setBackgroundColor(color: string): void;
  private setCanvas;
  updateConfig(config: UpdatePaxelRendererConfig): void;
  drawAt(x: number, y: number, color?: string, targetLayer?: string): void;
  removeAt(x: number, y: number, targetLayer?: string): void;
  putPixel(row: number, column: number, color?: string, targetLayer?: string): void;
  removePixel(row: number, column: number, targetLayer?: string): void;
  /**
   * Add force to the motion mode simulation
   * @param name force name
   * @param force vector representing x and y units on grid per step
   */
  createForce(name: string, forceVector: MotionVector2): void;
  removeForce(name: string): void;
  applyForce(layerName: string, apply?: boolean): void;
  setForceOnLayer(layerName: string, forceName: string): void;
  removeForceFromLayer(layerName: string, forceName: string): void;
  /**
   * Set the time duration before simulation loops in seconds
   *
   * @param loopTime seconds before loop
   */
  setLoopDuration(loopTime: number): void;
  applyLoop(layerName: string, apply?: boolean): void;
  applyCollision(layerName: string, apply?: boolean): void;
  addLayer(name?: string, addLayerConfig?: AddLayerConfig): void;
  removeLayer(name: string): number;
  getActiveLayer(): string;
  setActiveLayer(name: string): void;
  setLayerVisibility(name: string, visible: boolean): void;
  setLayerCollision(name: string, collisionOptions: LayerCollisionOptions): void;
  getLayers(): string[];
  changeLayerOrder(name: string, index: number): void;
  clearLayer(layer: string): void;
  clearAllLayers(): void;
  setFPS(fps: number): void;
  start(): void;
  reset(): void;
  stop(): void;
  private loop;
  draw(): void;
  private getCellSize;
  private getGridOptions;
}
//#endregion
export { PaxelRenderer, PaxelRendererConfig, PaxelRendererMode, UpdatePaxelRendererConfig };