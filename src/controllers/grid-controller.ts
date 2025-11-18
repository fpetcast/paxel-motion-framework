import { GridOptions } from "../interfaces/grid";
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
    gridOptions: GridOptions = {
      rows: 32,
      columns: 32,
      cellSize: 20,
    }
  ) {
    this.setGridOptions(gridOptions);
  }

  setGridOptions(gridOptions: GridOptions) {
    this.width = gridOptions.rows;
    this.height = gridOptions.columns;
    this.cellSize = gridOptions.cellSize;
  }

  setLayer(layer: Layer) {
    this.drawLayer = layer;
  }

  getLayer() {
    return this.drawLayer;
  }

  setCellAtPosition(
    clientX: number,
    clinetY: number,
    color: string
  ) {
    const { row, column } = this.getCellGridPosition(clientX, clinetY);
    this.setCellInGrid(row, column, color);
  }

  setCellInGrid(
    row: number,
    column: number,
    color: string,
  ) {
    const cellIndex = this.getCellIndex(row, column);

    if (cellIndex < 0) {
      this.addCell({
        row,
        column,
        color
      });

      return;
    }

    this.updateCell(row, column, {
      color: color
    });
  }

  removeCellAtPosition(clientX: number, clientY: number) {
    const { row, column } = this.getCellGridPosition(clientX, clientY);
    this.removeCell(row, column);
  }

  removeCell(row: number, column: number) {
    const cellIndex = this.getCellIndex(row, column);
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

  addCell(params: {
    row: number,
    column: number,
    color: string
  }) {
    const x = params.column * this.cellSize;
    const y = params.row * this.cellSize;

    const particle = new PaxelParticle({
      position: {
        x,
        y
      },
      width: this.cellSize,
      height: this.cellSize,
      color: params.color
    });

    this.drawLayer.particles.push(particle);
    this.drawLayer.lookup.set(this.posKey(Math.floor(y / this.cellSize), Math.floor(x / this.cellSize)), this.drawLayer.particles.length - 1);

    return particle;
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

  private getCellIndex(row: number, column: number) {
    const positionKey = this.posKey(row, column);
    return this.drawLayer.lookup.get(positionKey) ?? -1;
  }

  private getCellGridPosition(x: number, y: number): {
    row: number,
    column: number,
  } {
    const row = Math.floor(y / this.cellSize);
    const column = Math.floor(x / this.cellSize);

    return { row, column }
  }

  private posKey(x: number, y: number): string {
    return `${x},${y}`;
  }
}

export type IGridController = InstanceType<typeof GridController>;

export { GridController };