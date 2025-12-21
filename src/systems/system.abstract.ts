import { Layer } from "../interfaces/layers";
import { ISystem } from "../interfaces/systems";

export const SYSTEMS = ['loop', 'force', 'collision'] as const;
export type SystemName = typeof SYSTEMS[number];

abstract class SystemAbstract implements ISystem {
  registry: Map<string, Layer> = new Map();

  abstract init(): void
  abstract update(time: number): void

  constructor() { }

  apply(layer: Layer, apply: boolean = true) {
    if (apply) {
      this.register(layer);
    } else {
      this.unregister(layer);
    }
  }

  toggle(layer: Layer) {
    if (this.isRegistered(layer)) {
      this.unregister(layer);
    } else {
      this.register(layer);
    }
  }

  register(layer: Layer) {
    if (this.isRegistered(layer)) {
      return;
    }

    this.registry.set(layer.name, layer);
  };

  isRegistered(layer: Layer): boolean {
    return this.registry.get(layer.name) !== undefined;
  };

  unregister(layer: Layer): boolean {
    return this.registry.delete(layer.name);
  }
}

export { SystemAbstract }