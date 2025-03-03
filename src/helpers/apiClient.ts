import { LifetimeNotification } from "@decky/ui";
import { sync_cloud_first, sync_local_first } from "./backend";
import * as Defs from "./commonDefs";
import Logger from "./logger";
import Config from "./config";
import SyncTaskQeueue from "./syncTaskQueue";

function getCurrentUserId(): number {
  return Number(BigInt.asUintN(32, BigInt(window.App.m_CurrentUser.strSteamID)));
};

class ApiClient {
  public setupScreenshotNotification(): Unregisterable {
    return SteamClient.GameSessions.RegisterForScreenshotNotification(async (e: ScreenshotNotification) => {
      if (Config.get("screenshot_upload_enable") && e.details && e.strOperation == "written") {
        await SyncTaskQeueue.addScreenshotSyncTask(getCurrentUserId(), e.details.strUrl, e.details.strGameID, e.details.hHandle);
      }
    });
  }

  public setupAppLifetimeNotificationsHandler(): Unregisterable {
    return SteamClient.GameSessions.RegisterForAppLifetimeNotifications(async (e: LifetimeNotification) => {
      if (e.bRunning) {
        Logger.info(`Starting game ${e.unAppID}`);
        await SyncTaskQeueue.addSyncTask(sync_cloud_first, e.unAppID, e.nInstanceID);
        if (Config.get("auto_global_sync")) {
          await SyncTaskQeueue.addSyncTask(sync_local_first, Defs.GLOBAL_SYNC_APP_ID);
        }
      } else {
        Logger.info(`Stopping game ${e.unAppID}`);
        await SyncTaskQeueue.addSyncTask(sync_local_first, e.unAppID);
        if (Config.get("auto_global_sync")) {
          await SyncTaskQeueue.addSyncTask(sync_cloud_first, Defs.GLOBAL_SYNC_APP_ID);
        }
      }
    });
  }
}

const apiClient = new ApiClient();
export default apiClient;
