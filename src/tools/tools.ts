import { IGridController } from "../controllers/grid-controller";
import { EraserTool } from "./eraser-tool";
import { PencilTool } from "./pencil-tool";
import { IApplyTool, ITool, IToolsKey, PaxelTools } from "../interfaces/tools";

class Tools {
  private commands: { [key in IToolsKey]?: ITool<any> } = {}

  constructor(
    private gridController: IGridController
  ) {
    this.init();
  }

  private init() {
    PaxelTools.forEach(tool => {
      let instanceTool;
      switch (tool) {
        case "eraser":
          instanceTool = new EraserTool(this.gridController);
          break;
        case "pencil":
          instanceTool = new PencilTool(this.gridController);
          break;
      }
      this.commands[tool] = instanceTool;
    })
  }

  invoke<T extends IToolsKey>(tool: T, params: IApplyTool[T]) {
    if (!this.commands[tool]) {
      console.error("tools not instanced", tool);
      return;
    }

    this.commands[tool].execute(params);
  }
}

export { Tools };