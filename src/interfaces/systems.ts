import { IMotionParticle } from "../particle"
import { MotionVector2 } from "./particle"

export interface Collider {
  size: MotionVector2,
  position: MotionVector2
}

export interface MotionSystem {
  init: () => void
  register: (particle: IMotionParticle) => void
  unregister: (particle: IMotionParticle) => boolean
  update: (time: number) => void
}
