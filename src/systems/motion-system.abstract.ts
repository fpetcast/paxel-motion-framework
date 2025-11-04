import { Layer } from "../interfaces/layers";
import { MotionSystem } from "../interfaces/systems";

abstract class MotionSystemAbstract implements MotionSystem {
  registry: Map<string, Layer> = new Map();

  abstract init(): void
  abstract update(time: number): void

  constructor() { }

  register(layer: Layer) {
    if (this.isRegistered(layer)) {
      console.log('is registered yet');
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

export { MotionSystemAbstract }