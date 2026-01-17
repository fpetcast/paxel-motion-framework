
import { Layer } from "../interfaces/layers";
import { MotionVector2 } from "../interfaces/particle";
import { IForce } from "../interfaces/systems";
import { PaxelParticle } from "../particle";
import { SystemAbstract } from "./system.abstract";

class ForceSystem extends SystemAbstract {
  private forces: IForce[] = [];
  private forcesOnLayers: Map<Layer, IForce[]> = new Map();

  init() { }

  update(time: number) { };

  clear() {
    this.forces = [];
  }

  addForceToLayer(layer: Layer, forceName: string) {
    const force = this.getForceByName(forceName);

    if (force) {
      const layerForces = this.getForcesOnLayer(layer);
      this.forcesOnLayers.set(layer, Array.from(new Set([...layerForces, force])));
    }
  }

  removeForceFromLayer(layer: Layer, forceName: string) {
    const layerForces = this.getForcesOnLayer(layer);
    const forceIndex = layerForces.findIndex((f) => f.name === forceName);

    if (forceIndex >= 0) {
      layerForces.splice(forceIndex, 1);
      this.forcesOnLayers.set(layer, layerForces);
    }
  }

  getForcesOnLayer(layer: Layer) {
    return this.forcesOnLayers.get(layer) || [];
  }

  getLayerForcesResult(layer: Layer): MotionVector2 {
    const forces = this.getForcesOnLayer(layer);

    const zeroForce = {
      x: 0,
      y: 0
    }

    return forces?.reduce<MotionVector2>((result, force) => {
      result.x += force.intensity.x;
      result.y += force.intensity.y;

      return result;
    }, zeroForce) ?? zeroForce;
  }


  getForceByName(forceName: string): IForce | undefined {
    const searched = this.forces.find((f) => f.name === forceName);

    if (!searched) {
      console.warn("Cannot find force with name:", searched);
    }

    return searched
  }

  upsertForce(name: string, intensity: MotionVector2) {
    this.forces.push({
      name,
      intensity
    });
  }

  removeForce(name: string) {
    const removeIndex = this.forces.findIndex((f) => f.name === name);

    if (removeIndex >= 0) {
      this.forces.splice(removeIndex, 1);
      return removeIndex;
    }

    return -1;
  }

  applyForceToParticle(forceIntensity: MotionVector2, particle: PaxelParticle): MotionVector2 {
    const appliedForce = this.computeForce(particle, forceIntensity);

    return {
      x: particle.position.x + appliedForce.x,
      y: particle.position.y + appliedForce.y
    };
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