import { PaxelParticle } from "../particle";
import { GridOptions } from "./grid";

export type GraphicsApiType = "webgl"
export interface GraphicsApi<T extends GraphicsApiType> {
  type: T,
  inited: boolean,
  canExport: boolean,
  backgroundColor: string,
  draw: (
    gridOptions: GridOptions,
    cells: PaxelParticle[]
  ) => void,
  resize: () => void,
}

export interface GraphicsApiOptions {
  canExport: boolean,
  backgroundColor?: string,
}

export interface ProgramAttribute {
  location: number,
  name: string,
  buffer: WebGLBuffer
}