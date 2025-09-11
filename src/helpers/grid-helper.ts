import { PaxelRendererConfig } from "../interfaces/renderer";

class GridHelper extends HTMLElement {
  private get canvas() {
    return this.querySelector<HTMLCanvasElement>(".grid-helper__canvas") as HTMLCanvasElement;
  }

  private get draw2dContext() {
    return this.canvas.getContext("2d", {
      alpha: true
    }) as CanvasRenderingContext2D;
  }

  constructor(
    private renderingCanvas: HTMLCanvasElement,
    private config: PaxelRendererConfig
  ) {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
      <canvas 
        id="grid-helper"
        class="grid-helper__canvas"
        style="
          visibility: visible;
          position: fixed;
          opacity:.5;
          z-index:-1;
        "
      >
      </ canvas>
    `

    this.setPixelRatio();
    this.onResize();
    this.draw();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.onResize);
  }

  isVisible() {
    return this.canvas.style.visibility === "visible";
  }

  show() {
    this.canvas.style.visibility = "visible";
  }

  hide() {
    this.canvas.style.visibility = "hidden";
  }

  private onResize() {
    const renderingCanvasRect = this.renderingCanvas.getBoundingClientRect()
    this.canvas.style.width = renderingCanvasRect.width + "px";
    this.canvas.style.height = renderingCanvasRect.height + "px";
    this.canvas.style.top = renderingCanvasRect.top + "px";
    this.canvas.style.left = renderingCanvasRect.left + "px";
  }

  private setPixelRatio() {
    const scale = window.devicePixelRatio;
    this.canvas.width = Math.floor(this.config.canvas.width * scale);
    this.canvas.height = Math.floor(this.config.canvas.height * scale);

    // Normalize coordinate system to use CSS pixels.
    this.draw2dContext.scale(scale, scale);
  }

  private draw() {
    for (let y = 0; y < this.config.grid.rows; y++) {
      for (let x = 0; x < this.config.grid.columns; x++) {
        const rectangle = new Path2D();
        rectangle.rect(
          x * this.config.grid.cellSize,
          y * this.config.grid.cellSize,
          this.config.grid.cellSize,
          this.config.grid.cellSize);

        this.draw2dContext.stroke(rectangle);
      }
    }
  }
}

if (!customElements.get("grid-helper")) {
  customElements.define("grid-helper", GridHelper);
}

export { GridHelper };