
import { SystemAbstract } from "./system.abstract";
import { Collider } from "../interfaces/systems";


class CollisionSystem extends SystemAbstract {
  init() { }

  update(time: number) { };

  isColliding(colliderA: Collider, colliderB: Collider) {
    return (
      colliderA.position.x < colliderB.position.x + colliderB.size.x &&
      colliderA.position.x + colliderA.size.x > colliderB.position.x &&
      colliderA.position.y < colliderB.position.y + colliderB.size.y &&
      colliderA.position.y + colliderA.size.y > colliderB.position.y
    );
  }

  isOutOfBounds(collider: Collider, canvas: HTMLCanvasElement) {
    return collider.position.x < 0 ||
      collider.position.x >= canvas.width ||
      collider.position.y < 0 ||
      (collider.position.y) >= canvas.height
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