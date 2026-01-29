
import { ILayerInstance } from "../entities/layer";
import { SystemAbstract } from "./system.abstract";

class LoopSystem extends SystemAbstract {
  private loopAfter = 2000;
  private loopTimer = 0;

  init() {
    if (this.loopTimer <= 0) {
      this.reset();
    }
  }

  update(time: number) {
    this.loopTimer -= time;
  };

  checkLoop(): boolean {
    if (this.loopTimer > 0) {
      return false;
    }

    this.registry.forEach((layer) => {
      this.loop(layer);
    })

    this.reset();

    return true;
  }

  reset() {
    this.loopTimer = this.loopAfter;
  }

  setLoopAfter(after: number) {
    this.loopAfter = after;
  }

  private loop(layer: ILayerInstance) {
    const particles = layer.particles;
    particles.forEach((particle) => {
      particle.restoreOriginalPosition();
      particle.setFreeze(false);
      particle.setVisible(true);
    });
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