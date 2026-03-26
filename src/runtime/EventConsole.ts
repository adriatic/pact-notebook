import { EventBus } from "./EventBus";

export class EventConsole {
  constructor(eventBus: EventBus) {
    eventBus.subscribe("execution_started", (event) => {
    });

    eventBus.subscribe("execution_completed", (event) => {
    });

    eventBus.subscribe("signal_detected", (event) => {
    });
  }
}
