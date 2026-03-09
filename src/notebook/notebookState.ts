export class NotebookState {
  private activeNotebook: string | null = null;
  private currentCell: number = 1;
  private totalCells: number = 1;

  setActiveNotebook(id: string) {
    this.activeNotebook = id;
    this.currentCell = 1;
  }

  getActiveNotebook(): string | null {
    return this.activeNotebook;
  }

  setCurrentCell(cell: number) {
    this.currentCell = cell;
  }

  getCurrentCell(): number {
    return this.currentCell;
  }

  setTotalCells(total: number) {
    this.totalCells = total;
  }

  getTotalCells(): number {
    return this.totalCells;
  }

  getState() {
    return {
      notebook: this.activeNotebook,
      cell: this.currentCell,
      totalCells: this.totalCells,
    };
  }
}
