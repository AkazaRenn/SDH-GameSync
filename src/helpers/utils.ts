import { GLOBAL_SYNC_APP_ID, SHARED_FILTER_APP_ID } from "./commonDefs";
import { update_rclone } from "./backend";
import * as Toaster from "./toaster";
import Logger from "./logger";
import { t } from "../i18n";

export function getAppName(appId: number): string {
  if (appId == GLOBAL_SYNC_APP_ID) {
    return t("app.global")
  } else if (appId == SHARED_FILTER_APP_ID) {
    return t("app.shared")
  } else {
    return String(window.appStore.GetAppOverviewByAppID(appId)?.display_name);
  }
}

export function reduceSlashes(input: string): string {
  return input.replace(/\/+/g, '/');
}

export function updateRclone(toast: boolean = false) {
  update_rclone()
    .then(() => toast && Toaster.toast(t("toast.rcloneUpdated")))
    .catch(() => Toaster.toast(t("toast.rcloneUpdateFailed")));
}

export function retry(handler: () => void, delayMs: number) {
  try {
    handler();
  } catch (error: any) {
    Logger.warning("Failure, retry in", delayMs, "ms, error:", error);
    setTimeout(() => {
      try {
        handler();
      } catch (error: any) {
        Logger.error("Failure in retry, error:", error)
      }
    }, delayMs);
  }
}
