import { ILayer, ILayerParams } from "../../interfaces/layers";
import { PaxelParticle } from "../../entities/particle";

class Layer implements ILayer {
  _id: string;

  name: string;
  particles: PaxelParticle[] = [];

  lookup: Map<string, number> = new Map();
  visible: boolean = true;

  constructor(params: ILayerParams) {
    this._id = this.getUuid();
    this.name = params.name;
    this.visible = params.visible;
    this.particles = params.particles;
  }

  private getUuid() {
    return `${Date.now().toString(36) + Math.random().toString(36).slice(2, 7)}`;
  }
}

export type ILayerInstance = InstanceType<typeof Layer>;

export { Layer };