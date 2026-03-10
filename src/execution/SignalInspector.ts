import { Cell } from "../notebook/Cell";

export class SignalInspector {
  static inspect(cell: Cell): string | null {
    if (!cell.prompt) {
      return null;
    }

    if (cell.prompt.startsWith("PACT_SIGNAL")) {
      return "signal";
    }

    return null;
  }
}
