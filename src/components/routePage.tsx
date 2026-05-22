import { ReactNode } from "react";
import { routerHook } from "@decky/api";
import { Navigation } from "@decky/ui";
import { PLUGIN_NAME_AS_PATH } from "../helpers/commonDefs";
import Logger from "../helpers/logger";
import Registeration from "../types/registeration";

export default abstract class RoutePage<T extends { [K in keyof T]: string } = Record<string, string>> extends Registeration {
  private readonly routePrefix: string = PLUGIN_NAME_AS_PATH;
  protected abstract readonly route: string;
  protected readonly params: Array<string> = [];

  private get baseRoute(): string {
    return `/${this.routePrefix}/${this.route}`;
  }

  private get fullRoute(): string {
    return this.baseRoute + this.params.map((param) => `/:${param}`).join("");
  }

  protected _register(): UnregisterFunction {
    const route = this.fullRoute;
    Logger.debug(`Registering route ${route}`);
    routerHook.addRoute(route, this.render, { exact: true });
    return () => routerHook.removeRoute(route);
  }

  enter = (params: T): void => {
    const route = this.baseRoute + this.params.map((param) => `/${params[param as keyof T]}`).join("");
    Logger.debug(`Navigating to ${route}`)
    Navigation.Navigate(route);
    Navigation.CloseSideMenus();
  }

  abstract render(): ReactNode;
}
