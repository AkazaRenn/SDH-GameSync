export default abstract class Registeration {
  private _registered = false;
  get registered(): boolean {
    return this._registered;
  }

  protected abstract _register(): UnregisterFunction;

  register(): Unregisterable {
    if (this._registered) {
      throw new Error(`${this.constructor.name} is already registered`);
    }

    const unregisterFunction = this._register();
    this._registered = true;
    return {
      unregister: unregisterFunction,
    }
  }
}
