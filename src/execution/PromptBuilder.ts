import { Cell } from "../notebook/Cell";

export class PromptBuilder {
  static build(cell: Cell): string {
    return cell.prompt;
  }
}
