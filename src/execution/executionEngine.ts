import { PromptBuilder } from "./PromptBuilder";
import { Cell } from "../notebook/Cell";

export class ExecutionEngine {
  private eventBus: any;
  private adapter: any;

  constructor(eventBus: any, adapter: any) {
    this.eventBus = eventBus;
    this.adapter = adapter;
  }

  async run(cell: Cell): Promise<void> {
    const prompt = PromptBuilder.build(cell.prompt);

    const response = await this.adapter.invoke(prompt);

    cell.response = response;
    cell.model = "mock-llm";
    cell.timestamp = Date.now();

    if (this.eventBus) {
      this.eventBus.emit({
        type: "cell_updated",
        cell: cell,
      });

      this.eventBus.emit({
        type: "execution_completed",
        cell: cell.id,
      });
    }
  }
}
