
import { PaxelParticle } from "../particle";
import { MotionSystemAbstract } from "./motion-system.abstract";

class LoopSystem extends MotionSystemAbstract {
  init() { }

  update(time: number) {
    this.registry.forEach((particle) => {
      this.loop(particle);
    })
  };

  loop(particle: PaxelParticle) {
    particle.restoreOriginalPosition();
  }

  private constructor() {
    super();
  }

  private static _instance: LoopSystem;
  public static get instance(): LoopSystem {
    if (!LoopSystem._instance) {
      LoopSystem._instance = new LoopSystem();
    }

    return LoopSystem._instance;
  }
}

export { LoopSystem }