import { EventBus } from "./EventBus";

export class EventConsole {
  constructor(eventBus: EventBus) {
    eventBus.subscribe("execution_started", (event) => {
      console.log("PACT:", "execution_started cell=" + event.cell);
    });

    eventBus.subscribe("execution_completed", (event) => {
      console.log("PACT:", "execution_completed cell=" + event.cell);
    });

    eventBus.subscribe("signal_detected", (event) => {
      console.log("PACT:", "signal_detected", event.signal);
    });
  }
}
