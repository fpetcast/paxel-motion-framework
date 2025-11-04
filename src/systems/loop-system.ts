
import { Layer } from "../interfaces/layers";
import { MotionSystemAbstract } from "./motion-system.abstract";

class LoopSystem extends MotionSystemAbstract {
  private loopAfter = 2000;
  private loopTimer = 0;

  init() {
    if (this.loopTimer <= 0) {
      this.reset();
    }
  }

  update(time: number) {
    if (this.loopTimer > 0) {
      this.loopTimer -= time;
      return;
    }

    this.registry.forEach((layer) => {
      this.loop(layer);
    })

    this.reset();
  };

  loop(layer: Layer) {
    const particles = layer.particles;
    particles.forEach((particle) => {
      particle.restoreOriginalPosition();
      particle.setFreeze(false);
    });
  }

  setLoopAfter(after: number) {
    this.loopAfter = after;
  }

  reset() {
    this.loopTimer = this.loopAfter;
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