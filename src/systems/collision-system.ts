
import { SystemAbstract } from "./system.abstract";
import { Collider, CollisionResponse, LayerCollisionOptions } from "../interfaces/systems";
import { MotionVector2 } from "../interfaces/particle";
import { PaxelParticle } from "../entities/particle";
import { ILayerInstance } from "../entities/layer";


class CollisionSystem extends SystemAbstract {
  private collisionLayers: Map<ILayerInstance, LayerCollisionOptions> = new Map();

  init() { }

  update(time: number) { };

  getLayerCollisionOptions(layer: ILayerInstance) {
    return this.collisionLayers.get(layer);
  }

  getLayerColliders(layer: ILayerInstance) {
    const layerCollisionOptions = this.collisionLayers.get(layer);

    return layerCollisionOptions?.colliders || [];
  }

  setLayerCollisionOptions(layer: ILayerInstance, collisionOptions: LayerCollisionOptions) {
    const layerCollisionOptions = this.collisionLayers.get(layer);

    if (layerCollisionOptions) {
      this.collisionLayers.set(layer, {
        ...layerCollisionOptions,
        ...collisionOptions
      });
    } else {
      this.collisionLayers.set(layer, collisionOptions);
    }
  }

  isColliding(colliderA: Collider, colliderB: Collider) {
    return (
      colliderA.position.x < colliderB.position.x + colliderB.size.x &&
      colliderA.position.x + colliderA.size.x > colliderB.position.x &&
      colliderA.position.y < colliderB.position.y + colliderB.size.y &&
      colliderA.position.y + colliderA.size.y > colliderB.position.y
    );
  }

  isOutOfBounds(collider: Collider, canvas: HTMLCanvasElement) {
    const outLeft = collider.position.x < 0;
    const outRight = collider.position.x >= canvas.width;
    const outTop = collider.position.y < 0;
    const outBottom = collider.position.y >= canvas.height;

    const outOfBoundsResult = {
      out: outLeft || outRight || outTop || outBottom,
      outLeft,
      outBottom,
      outRight,
      outTop
    }

    return outOfBoundsResult;
  }

  checkParticleCollision(
    layer: ILayerInstance,
    colliderA: PaxelParticle,
    colliderAPosition: MotionVector2,
    colliderB: PaxelParticle
  ) {
    const layerCollisionOptions = this.getLayerCollisionOptions(layer);

    const isCollision = this.isColliding(
      { position: colliderAPosition, size: colliderA.size },
      { position: colliderB.position, size: colliderB.size }
    );

    if (isCollision && layerCollisionOptions) {
      this.resolveCollisionResponse(colliderA, layerCollisionOptions);
      return true;
    }

    return false;
  }

  resolveCollisionResponse(particle: PaxelParticle, layerCollisionOptions: LayerCollisionOptions) {
    if (layerCollisionOptions?.destroyOnCollision) {
      this.resolveCollisionByType(particle, "destroy");
    } else if (layerCollisionOptions?.loopOnCollision) {
      this.resolveCollisionByType(particle, "loop");
    } else {
      this.resolveCollisionByType(particle, "freeze");
    }
  }

  resolveCollisionByType(particle: PaxelParticle, collisionResponse: CollisionResponse) {
    switch (collisionResponse) {
      case "destroy":
        particle.setVisible(false);
        particle.setFreeze(true);
        break;
      case "loop":
        particle.restoreOriginalPosition();
        break;
      case "freeze":
        particle.setFreeze(true);
        break;
      default:
        break;
    }
  }

  checkBoundsCollision(canvas: HTMLCanvasElement, layer: ILayerInstance, particle: PaxelParticle, position: MotionVector2) {
    const layerCollisionOptions = this.getLayerCollisionOptions(layer);

    const isOutOfBounds = this.isOutOfBounds({
      position: position,
      size: particle.size
    }, canvas);

    const { outLeft, outRight, outBottom, outTop, out } = isOutOfBounds;

    if (out) {
      if (layerCollisionOptions?.destroyOnCollision) {
        particle.setVisible(false);
        particle.setFreeze(true);
      } else if (layerCollisionOptions?.loopOnCollision) {
        particle.restoreOriginalPosition();
      } else if (layerCollisionOptions?.stopOnBounds) {
        const canvasMeasures = this.getCanvasMeasures(canvas);

        if (outBottom) {
          particle.setPosition(position.x, canvasMeasures.bottom - particle.size.x);
        } else if (outTop) {
          particle.setPosition(position.x, canvasMeasures.top);
        } else if (outLeft) {
          particle.setPosition(canvasMeasures.left, position.y);
        } else if (outRight) {
          particle.setPosition(canvasMeasures.right - particle.size.x, position.y);
        }

        particle.setFreeze(true);
      }


      return true;
    }


    return false;
  }

  private getCanvasMeasures(canvas: HTMLCanvasElement) {
    return {
      top: 0,
      left: 0,
      right: canvas.width,
      bottom: canvas.height,
    }
  }

  private constructor() {
    super();
  }

  private static _instance: CollisionSystem;
  public static get instance(): CollisionSystem {
    if (!CollisionSystem._instance) {
      CollisionSystem._instance = new CollisionSystem();
    }

    return CollisionSystem._instance;
  }
}

export { CollisionSystem }