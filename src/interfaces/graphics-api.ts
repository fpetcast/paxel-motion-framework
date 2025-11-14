import { PaxelParticle } from "../particle";

export interface GraphicsApi {
  inited: boolean,
  draw: (cells: PaxelParticle[]) => void,
  resize: () => void,
}

export interface ProgramAttribute {
  location: number,
  name: string,
  buffer: WebGLBuffer
}