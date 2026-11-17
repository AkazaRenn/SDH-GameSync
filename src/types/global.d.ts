declare global {
  type UnregisterFunction = () => void;

  interface Unregisterable {
    unregister: UnregisterFunction;
  }
}

export {};
