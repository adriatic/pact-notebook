import { Cell } from "./Cell";

export class Notebook {
  private cells: Cell[] = [];

  createCell(prompt: string = ""): Cell {
    const id = this.cells.length + 1;

    const cell = new Cell(id, prompt);

    this.cells.push(cell);

    return cell;
  }

  getCell(id: number): Cell | undefined {
    return this.cells.find((c) => c.id === id);
  }

  getCells(): Cell[] {
    return this.cells;
  }
}
