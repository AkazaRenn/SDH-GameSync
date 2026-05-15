import { GLOBAL_SYNC_APP_ID, SHARED_FILTER_APP_ID } from "./commonDefs";
import { update_rclone } from "./backend";
import * as Toaster from "./toaster";

export function getAppName(appId: number): string {
  if (appId == GLOBAL_SYNC_APP_ID) {
    return "global"
  } else if (appId == SHARED_FILTER_APP_ID) {
    return "shared"
  } else {
    return String(window.appStore.GetAppOverviewByAppID(appId)?.display_name);
  }
}

export function reduceSlashes(input: string): string {
  return input.replace(/\/+/g, '/');
}

export function updateRclone(toast: boolean = false) {
  update_rclone()
    .then(() => toast && Toaster.toast("Rclone is now the latest"))
    .catch(() => Toaster.toast("Error updating rclone"));
}
