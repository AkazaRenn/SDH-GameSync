export default class Observable {
  readonly eventTarget = new EventTarget();

  on(eventType: string, handler: (arg: any) => void): Unregisterable {
    const eventListener = ((event: CustomEvent) => handler(event.detail)) as EventListener;
    this.eventTarget.addEventListener(eventType, eventListener);

    return {
      unregister: () => this.eventTarget.removeEventListener(eventType, eventListener)
    };
  }

  protected emit(eventType: string, data?: any): void {
    this.eventTarget.dispatchEvent(new CustomEvent(eventType, { detail: data }));
  }
}
