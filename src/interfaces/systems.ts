
import { Layer } from "./layers"
import { MotionVector2 } from "./particle"

export interface Collider {
  size: MotionVector2,
  position: MotionVector2
}

export interface IForce {
  name: string,
  intensity: MotionVector2,
}

export interface LayerCollisionOptions {
  colliders?: string[]; // layers colliders
  stopOnBounds?: boolean;
  destroyOnCollision?: boolean;
  loopOnCollision?: boolean;
}

export interface ISystem {
  init: () => void
  registry: Map<string, Layer>
  apply: (layer: Layer, apply: boolean) => void
  toggle: (layer: Layer) => void
  register: (layer: Layer) => void
  unregister: (layer: Layer) => boolean
  update: (time: number) => void
}
