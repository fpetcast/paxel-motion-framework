import { ILayerInstance } from "../entities/layer";
import { ISystem } from "../interfaces/systems";

export const SYSTEMS = ['loop', 'force', 'collision'] as const;
export type SystemName = typeof SYSTEMS[number];

abstract class SystemAbstract implements ISystem {
  registry: Map<string, ILayerInstance> = new Map();

  abstract init(): void
  abstract update(time: number): void

  constructor() { }

  apply(layer: ILayerInstance, apply: boolean = true) {
    if (apply) {
      this.register(layer);
    } else {
      this.unregister(layer);
    }
  }

  toggle(layer: ILayerInstance) {
    if (this.isRegistered(layer)) {
      this.unregister(layer);
    } else {
      this.register(layer);
    }
  }

  register(layer: ILayerInstance) {
    if (this.isRegistered(layer)) {
      return;
    }

    this.registry.set(layer.name, layer);
  };

  isRegistered(layer: ILayerInstance): boolean {
    return this.registry.get(layer.name) !== undefined;
  };

  unregister(layer: ILayerInstance): boolean {
    return this.registry.delete(layer.name);
  }
}

export { SystemAbstract }