import { PromptBuilder } from "./PromptBuilder";
import { SignalInspector } from "./SignalInspector";
import { Cell } from "../notebook/Cell";
import { EventBus } from "../runtime/EventBus";
import { LLMAdapter } from "../adapters/LLMAdapter";

export class ExecutionEngine {
  private eventBus: EventBus;
  private adapter: LLMAdapter;

  constructor(eventBus: EventBus, adapter: LLMAdapter) {
    this.eventBus = eventBus;
    this.adapter = adapter;
  }

  async run(cell: Cell): Promise<void> {
    cell.status = "running";

    this.eventBus.emit({
      type: "execution_started",
      cell: cell.id,
    });

    const signal = SignalInspector.inspect(cell);

    if (signal) {
      return;
    }

    const prompt = PromptBuilder.build(cell);

    const response = await this.adapter.invoke(prompt);

    cell.response = response;
    cell.model = "mock-llm";
    cell.timestamp = Date.now();
    cell.status = "completed";

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
