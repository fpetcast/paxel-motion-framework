import { IGridController } from "../controllers/grid-controller";
import { IApplyEraserTool, ITool } from "../interfaces/tools";

class EraserTool implements ITool<IApplyEraserTool> {
  constructor(private gridController: IGridController) { }

  execute(params: IApplyEraserTool) {
    const { e } = params
    this.gridController.destroyCell(e);
  }
}

export { EraserTool }