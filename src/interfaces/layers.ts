import { IMotionParticle } from "../entities/particle";
export interface ILayer {
  _id: string;
  name: string;
  particles: IMotionParticle[];
  lookup: Map<string, number>;
  visible: boolean;
}

export interface ILayerParams {
  name: string;
  particles: IMotionParticle[];
  visible: boolean;
}

export interface IAddLayerConfig {
  force?: boolean,
  loop?: boolean,
  collision?: boolean,
}