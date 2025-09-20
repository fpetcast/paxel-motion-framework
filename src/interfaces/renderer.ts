
export interface PaxelRendererConfig {
  canvas: {
    width: number,
    height: number
  },
  grid: {
    rows: number,
    columns: number,
    cellSize: number,
    showHelper?: boolean
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
