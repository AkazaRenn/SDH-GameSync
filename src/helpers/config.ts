import DefaultConfig from "../json/default_config.json";
import Observable from "../types/observable";
import { get_config, set_config } from "./backend";
import Logger from "./logger";

class Config extends Observable {
  private data: Record<string, any> = {};

  public async load(): Promise<void> {
    this.data = await get_config() as Record<string, any>;
    Logger.debug("Config loaded", this.data);
  }

  public get(key: string) {
    let value = this.data[key];
    if (value === undefined) {
      value = DefaultConfig[key]
      this.set(key, value);
    }

    return this.data[key];
  }

  public set(key: string, value: any) {
    this.data[key] = value;
    set_config(key, value);
    this.emit(key, value);
  }
}

const config = new Config();
await config.load();

export default config;
