
import { SystemAbstract } from "./system.abstract";
import { Collider, LayerCollisionOptions } from "../interfaces/systems";
import { Layer } from "../interfaces/layers";
import { MotionVector2 } from "../interfaces/particle";
import { PaxelParticle } from "../particle";


class CollisionSystem extends SystemAbstract {
  private collisionLayers: Map<Layer, LayerCollisionOptions> = new Map();

  init() { }

  update(time: number) { };

  getLayerCollisionOptions(layer: Layer) {
    return this.collisionLayers.get(layer);
  }

  getLayerColliders(layer: Layer) {
    const layerCollisionOptions = this.collisionLayers.get(layer);

    return layerCollisionOptions?.colliders || [];
  }

  setLayerCollisionOptions(layer: Layer, collisionOptions: LayerCollisionOptions) {
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
    layer: Layer,
    colliderA: PaxelParticle,
    colliderAPosition: MotionVector2,
    colliderB: PaxelParticle
  ) {
    const layerCollisionOptions = this.getLayerCollisionOptions(layer);

    const isCollision = this.isColliding(
      { position: colliderAPosition, size: colliderA.size },
      { position: colliderB.position, size: colliderB.size }
    );

    if (isCollision) {
      if (layerCollisionOptions?.destroyOnCollision) {
        colliderA.setVisible(false);
        colliderA.setFreeze(true);
      } else if (layerCollisionOptions?.loopOnCollision) {
        colliderA.restoreOriginalPosition();
      } else {
        colliderA.setFreeze(true);
      }

      return true;
    }

    return false;
  }

  checkBoundsCollision(canvas: HTMLCanvasElement, layer: Layer, particle: PaxelParticle, position: MotionVector2) {
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