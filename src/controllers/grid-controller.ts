import { Layer } from "../interfaces/layers";
import { PaxelParticle } from "../particle";

class GridController {
  private width: number;
  private height: number;
  private cellSize: number;

  private drawLayer: Layer;

  public get motionParticles() {
    return this.drawLayer.particles;
  }

  public get gridData() {
    return {
      width: this.width,
      height: this.height
    }
  }

  public get numCells() {
    return this.width * this.height;
  }

  public get size() {
    return this.width * this.cellSize;
  }

  constructor(
    private gl: WebGL2RenderingContext,
    private glProgram: WebGLProgram,
    gridOptions: {
      width: number;
      height: number;
      cellSize: number;
    } = {
        width: 32,
        height: 32,
        cellSize: 20,
      }
  ) {
    this.width = gridOptions.width;
    this.height = gridOptions.height;
    this.cellSize = gridOptions.cellSize;
  }

  setLayer(layer: Layer) {
    this.drawLayer = layer;
  }

  getLayer() {
    return this.drawLayer;
  }

  setCell(clientX: number, clinetY: number, color: string) {
    const { row, column, cellIndex } = this.getCellAtPosition(clientX, clinetY);

    if (cellIndex < 0) {
      this.addCell({
        x: column * this.cellSize,
        y: row * this.cellSize,
        color
      });

      return;
    }

    this.updateCell(row, column, {
      color: color
    });
  }

  destroyCell(clientX: number, clientY: number) {
    const { row, column, cellIndex } = this.getCellAtPosition(clientX, clientY);
    const lastIndex = this.drawLayer.particles.length - 1;
    const deleteIndex = cellIndex;

    if (deleteIndex > -1) {
      this.drawLayer.lookup.delete(this.posKey(row, column));

      // delete-swap for performances: last cell in the delete index, deleted cell pop from last index
      if (cellIndex !== lastIndex) {
        const lastCell = this.drawLayer.particles[lastIndex];
        this.drawLayer.particles[deleteIndex] = lastCell;
        this.drawLayer.lookup.set(this.posKey(Math.floor(lastCell.position.y / this.cellSize), Math.floor(lastCell.position.x / this.cellSize)), deleteIndex);
      }

      this.drawLayer.particles.pop();
      return true;
    }

    return false;
  }

  addCell(params: { x: number, y: number, color?: string }) {
    const particle = new PaxelParticle(this.gl, this.glProgram, {
      position: {
        x: params.x,
        y: params.y
      },
      width: this.cellSize,
      height: this.cellSize,
      color: params?.color
    });

    this.drawLayer.particles.push(particle);
    this.drawLayer.lookup.set(this.posKey(Math.floor(params.y / this.cellSize), Math.floor(params.x / this.cellSize)), this.drawLayer.particles.length - 1);

    return particle;
  }

  private posKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  getCellIndex(row: number, column: number) {
    const positionKey = this.posKey(row, column);
    return this.drawLayer.lookup.get(positionKey) ?? -1;
  }

  getCellAtPosition(x: number, y: number): {
    row: number,
    column: number,
    cellIndex: number,
    cell: PaxelParticle | undefined
  } {
    const row = Math.floor(y / this.cellSize);
    const column = Math.floor(x / this.cellSize);
    const cellIndex = this.getCellIndex(row, column);

    return {
      row,
      column,
      cellIndex,
      cell: cellIndex > 0 ? this.drawLayer.particles[cellIndex] : undefined
    }
  }

  updateCell(row: number, col: number, data: {
    color: string
  }
  ) {
    const cellIndex = this.getCellIndex(row, col);
    const cell = this.drawLayer.particles[cellIndex];

    if (!cell) {
      console.error("Cannot find cell at pos: row - col ", row, col);
      return;
    }

    if (cell.getColor() !== data.color) {
      cell.setColor(data.color);
    }
  }
}

export type IGridController = InstanceType<typeof GridController>;

export { GridController };