
export interface PaxelRendererConfig {
  init: boolean,
  canExport: boolean,
  grid: {
    rows: number,
    columns: number,
  }
  canvas?: {
    width: number,
    height: number
  },
  layers?: {
    default?: string
  },
}

export interface ProgramAttribute {
  location: number,
  name: string,
  buffer: WebGLBuffer
}

export const MOTION_RENDERER_MODES = [
  "static",
  "motion"
] as const;
export type PaxelRendererMode = typeof MOTION_RENDERER_MODES[number];