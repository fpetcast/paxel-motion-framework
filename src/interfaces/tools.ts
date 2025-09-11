export const PaxelTools = ["pencil", "eraser"] as const;
export type IToolsKey = typeof PaxelTools[number];

export type IApplyPencilTool = {
  e: PointerEvent;
  selectedColor: string;
}

export type IApplyEraserTool = {
  e: PointerEvent;
}

export type IApplyTool = {
  "pencil": IApplyPencilTool,
  "eraser": IApplyEraserTool
}

// command pattern
export interface ITool<T extends IApplyTool[IToolsKey]> {
  execute: (params: T) => void;
}