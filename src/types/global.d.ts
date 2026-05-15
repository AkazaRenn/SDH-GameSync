declare global {
  interface Window {
    NotificationStore: any;
  }

  type UnregisterFunction = () => void;

  interface Unregisterable {
    unregister: UnregisterFunction;
  }
}

export {};
