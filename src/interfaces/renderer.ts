
export interface PaxelRendererConfig {
  canvas: {
    width: number,
    height: number
  },
  grid: {
    rows: number,
    columns: number,
    cellSize: number,
  }
  layers: {
    default?: string
  },
  init: boolean
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