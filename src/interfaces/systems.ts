
import { Layer } from "./layers"
import { MotionVector2 } from "./particle"

export interface Collider {
  size: MotionVector2,
  position: MotionVector2
}

export interface ISystem {
  init: () => void
  registry: Map<string, Layer>
  register: (layer: Layer) => void
  unregister: (layer: Layer) => boolean
  update: (time: number) => void
}
