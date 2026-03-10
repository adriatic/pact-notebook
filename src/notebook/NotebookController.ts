import { Notebook } from "./Notebook";
import { PACTRuntime } from "../runtime/PACTRuntime";
import { Cell } from "../notebook/Cell";

export class NotebookController {

    private notebook: Notebook;
    private runtime: PACTRuntime;

    constructor(runtime: PACTRuntime) {

        this.runtime = runtime;
        this.notebook = new Notebook();
    }

    createCell(prompt: string = ""): Cell {

        return this.notebook.createCell(prompt);
    }

    async runCell(cellId: number): Promise<void> {

        const cell = this.notebook.getCell(cellId);

        if (!cell) {
            console.error("Cell not found:", cellId);
            return;
        }

        await this.runtime.engine.run(cell);
    }

    getCells(): Cell[] {

        return this.notebook.getCells();
    }

}