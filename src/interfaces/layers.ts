import { IMotionParticle } from "../particle";

export interface Layer {
  name: string;
  particles: IMotionParticle[];
  lookup: Map<string, number>;
  visible: boolean;
}

export interface AddLayerConfig {
  force?: boolean,
  loop?: boolean,
  collision?: boolean,
}