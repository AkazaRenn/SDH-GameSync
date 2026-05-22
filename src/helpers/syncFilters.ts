import { SHARED_FILTER_APP_ID } from "./commonDefs";
import { get_available_filters, get_target_filters, set_target_filters, get_shared_filters, set_shared_filters } from "./backend";
import Logger from "./logger";
import Observable from "../types/observable";

class SyncFilters extends Observable {
  readonly events = {
    UPDATE: "update",
    SET: "set",
  }

  private appIdSet: Set<number> = new Set();

  async refresh(): Promise<void> {
    let availableSyncFilters = await get_available_filters();
    Logger.debug("Available sync filters:", availableSyncFilters);
    this.appIdSet = new Set(availableSyncFilters);
    this.emit(this.events.UPDATE);
  }

  has(appId: number): boolean {
    return this.appIdSet.has(appId);
  }

  async get(appId: number): Promise<Array<string>> {
    if (appId == SHARED_FILTER_APP_ID) {
      return await get_shared_filters();
    } else {
      return await get_target_filters(appId);
    }
  }

  async set(appId: number, filters: Array<string>): Promise<void> {
    if (appId == SHARED_FILTER_APP_ID) {
      await set_shared_filters(filters);
    } else {
      await set_target_filters(appId, filters);
    }
    this.emit(this.events.SET, appId);
    await this.refresh();
  }
}

const syncFilters = new SyncFilters();
await syncFilters.refresh();
export default syncFilters;
