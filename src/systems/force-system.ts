
import { MotionVector2 } from "../interfaces/particle";
import { PaxelParticle } from "../particle";
import { MotionSystemAbstract } from "./motion-system.abstract";

class ForceSystem extends MotionSystemAbstract {
  private _forces: Map<string, MotionVector2> = new Map();

  init() { }

  update(time: number) { };

  clear() {
    this._forces.clear();
  }

  upsertForce(name: string, force: MotionVector2) {
    this._forces.set(name, force);
  }

  removeForce(name: string) {
    return this._forces.delete(name);
  }

  applyForces(deltaTime: number, particle: PaxelParticle): MotionVector2 {
    let appliedForcePos = { ...particle.position };

    this._forces.forEach((force) => {
      const computedForce = this.computeForce(particle, force);
      appliedForcePos.x += computedForce.x;
      appliedForcePos.y += computedForce.y;
    });

    return appliedForcePos;
  }

  /**
   * Convert force from grid unit to pixels
   * @param particle 
   * @param force vector representing x and y units on grid per step 
   * @returns 
   */
  private computeForce(particle: PaxelParticle, force: MotionVector2): MotionVector2 {
    return {
      x: particle.size.x * force.x,
      y: particle.size.y * force.y
    }
  }

  private constructor() {
    super();
  }

  private static _instance: ForceSystem;
  public static get instance(): ForceSystem {
    if (!ForceSystem._instance) {
      ForceSystem._instance = new ForceSystem();
    }

    return ForceSystem._instance;
  }
}

export { ForceSystem }