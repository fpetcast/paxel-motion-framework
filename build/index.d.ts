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
//#region src/systems/system.abstract.d.ts
declare const SYSTEMS: readonly ["loop", "force", "collision"];
type SystemName = typeof SYSTEMS[number];
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
  drawAt(x: number, y: number, color?: string): void;
  removeAt(x: number, y: number): void;
  putPixel(row: number, column: number, color?: string): void;
  removePixel(row: number, column: number): void;
  /**
   * Add force to the motion mode simulation
   * @param name force name
   * @param force vector representing x and y units on grid per step
   */
  setForce(name: string, force: MotionVector2, layers?: string[]): void;
  removeForce(name: string): void;
  /**
   * Set the loop time before simulation loops in seconds
   *
   * @param loopTime seconds before loop
   */
  setLoopTime(loopTime: number): void;
  applyPhysics(layers: string[] | string, systemName: SystemName, apply: boolean): void;
  private getSystem;
  addLayer(name?: string): void;
  removeLayer(name: string): number;
  getActiveLayer(): string;
  setActiveLayer(name: string): void;
  getLayers(): string[];
  changeLayerOrder(name: string, index: number): void;
  clearLayers(layer?: string): void;
  setFPS(fps: number): void;
  setMaxFPS(maxFPS: number): void;
  start(): void;
  reset(): void;
  stop(): void;
  private loop;
  private draw;
  private getCellSize;
  private getGridOptions;
}
//#endregion
export { PaxelRenderer, PaxelRendererConfig, PaxelRendererMode, UpdatePaxelRendererConfig };