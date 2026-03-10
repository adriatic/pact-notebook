type Listener = (event: any) => void;

export class EventBus {
  private listeners: Record<string, Listener[]> = {};

  subscribe(type: string, listener: Listener): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }

    this.listeners[type].push(listener);
  }

  emit(event: any): void {
    const handlers = this.listeners[event.type] || [];

    for (const h of handlers) {
      h(event);
    }
  }
}
