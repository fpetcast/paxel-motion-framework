import { MotionSystem } from "../interfaces/systems";
import { PaxelParticle } from "../particle"

abstract class MotionSystemAbstract implements MotionSystem {
  protected registry: Map<string, PaxelParticle> = new Map();

  abstract init(): void
  abstract update(time: number): void

  constructor() { }

  register(particle: PaxelParticle) {
    if (this.isRegistered(particle)) {
      console.log('is registered yet');
      return;
    }

    this.registry.set(particle.id, particle);
  };

  isRegistered(particle: PaxelParticle): boolean {
    return this.registry.get(particle.id) !== undefined;
  };

  unregister(particle: PaxelParticle): boolean {
    return this.registry.delete(particle.id);
  }
}

export { MotionSystemAbstract }