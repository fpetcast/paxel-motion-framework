import { IGridController } from "../controllers/grid-controller";
import { IApplyPencilTool, ITool, IToolsKey } from "../interfaces/tools";

class PencilTool implements ITool<IApplyPencilTool> {
  readonly _id: IToolsKey = "pencil";

  constructor(private gridController: IGridController) { }

  execute(params: IApplyPencilTool) {
    const { e, selectedColor } = params
    this.gridController.setCell(e, selectedColor);
  }
}

export { PencilTool }