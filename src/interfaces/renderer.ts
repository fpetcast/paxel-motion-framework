
export type UpdatePaxelRendererConfig = Partial<Pick<PaxelRendererConfig, "canvas" | "grid" | "canExport">>;

export interface PaxelRendererConfig {
  init: boolean,
  canExport: boolean,
  grid: {
    rows: number,
    columns: number,
  }
  canvas: {
    width: number,
    height: number
  },
  layers?: {
    default?: string
  },
  defaultColor?: string;
}

const MOTION_RENDERER_MODES = [
  "static",
  "motion"
] as const;
export type PaxelRendererMode = typeof MOTION_RENDERER_MODES[number];