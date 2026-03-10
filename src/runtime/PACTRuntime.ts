import { EventBus } from "./EventBus";
import { ExecutionEngine } from "../execution/executionEngine";

import { LLMAdapter } from "../adapters/LLMAdapter";
import { EventConsole } from "./EventConsole";
export class PACTRuntime {
  public eventBus: EventBus;
  public engine: ExecutionEngine;

  constructor() {
    this.eventBus = new EventBus();

    new EventConsole(this.eventBus);

    const adapter = new LLMAdapter();

    this.engine = new ExecutionEngine(this.eventBus, adapter);
  }
}
