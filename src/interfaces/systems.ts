
import { ILayerInstance } from "../entities/layer";
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

export type CollisionResponse = "loop" | "destroy" | "freeze";

export interface ISystem {
  init: () => void
  registry: Map<string, ILayerInstance>
  apply: (layer: ILayerInstance, apply: boolean) => void
  toggle: (layer: ILayerInstance) => void
  register: (layer: ILayerInstance) => void
  unregister: (layer: ILayerInstance) => boolean
  update: (time: number) => void
}
