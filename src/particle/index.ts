import { MotionVector2 } from "../interfaces/particle";
import { parseColorRGBA } from "../utils/webgl";

class PaxelParticle {
  private _id: string;
  public get id() {
    return this._id;
  }

  private width: number;
  private height: number;
  public get size(): MotionVector2 {
    return {
      x: this.width,
      y: this.height
    }
  }

  private color: string = "#ffffff"

  private _originalPosition: MotionVector2;

  private _freezed: boolean = false;
  public get isFreezed() {
    return this._freezed;
  }

  private _visible: boolean = true;
  public get visible() {
    return this._visible;
  }

  private _position: MotionVector2;
  public get position() {
    return this._position;
  }

  private _velocity: MotionVector2 = {
    x: 0,
    y: 0
  }
  public get velocity() {
    return this._velocity;
  }

  private get canvas() {
    return this.gl.canvas as HTMLCanvasElement;
  }

  constructor(
    private gl: WebGL2RenderingContext,
    private program: WebGLProgram,
    data: {
      position: MotionVector2
      width: number;
      height: number;
      color?: string;
    }
  ) {
    this._id = Date.now().toString();
    this._position = data.position;
    this._originalPosition = data.position;
    this.width = data.width;
    this.height = data.height;
    if (data?.color) {
      this.color = data.color
    }
  }

  setPosition(x: number, y: number) {
    this._position = {
      x, y
    }
  }

  getColor() {
    return this.color
  }

  getParsedColor() {
    return parseColorRGBA(this.color);
  }

  setColor(color: string) {
    this.color = color;
  }

  restoreOriginalPosition(): MotionVector2 {
    this.setPosition(this._originalPosition.x, this._originalPosition.y);
    return { ... this._originalPosition };
  }

  setFreeze(freeze: boolean) {
    this._freezed = freeze;
  }

  setVisible(visible: boolean) {
    this._visible = visible;
  }
}

export type IMotionParticle = InstanceType<typeof PaxelParticle>;

export { PaxelParticle }