import { IMotionParticle } from "../particle";

export interface Layer {
  name: string;
  particles: IMotionParticle[];
  lookup: Map<string, number>;
}