import { EventBus } from "../../runtime/EventBus";

import { ExecutionEngine } from "../../execution/executionEngine";

import { LLMAdapter } from "../../adapters/LLMAdapter";

export class PACTRuntime {
  public eventBus: EventBus;
  public engine: ExecutionEngine;

  constructor() {
    this.eventBus = new EventBus();

    const adapter = new LLMAdapter();

    this.engine = new ExecutionEngine(this.eventBus, adapter);
  }
}
