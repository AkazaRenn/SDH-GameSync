import { AppLifetimeNotification, ScreenshotNotification } from "@decky/ui/dist/globals/steam-client/GameSessions";
import { afterPatch } from "@decky/ui";
import { sync_cloud_first, sync_local_first } from "./backend";
import { GLOBAL_SYNC_APP_ID } from "./commonDefs";
import Logger from "./logger";
import Config from "./config";
import SyncTaskQeueue from "./syncTaskQueue";

export function setupScreenshotNotification(): Unregisterable {
  return SteamClient.GameSessions.RegisterForScreenshotNotification(async (e: ScreenshotNotification) => {
    if (Config.get("capture_upload") && e.details && e.strOperation == "written") {
      if ((!Config.get("sync_in_offline_mode")) && window.App.m_CurrentUser.bIsOfflineMode) {
        Logger.info("Skip uploading screenshot in offline mode");
      } else {
        await SyncTaskQeueue.addScreenshotSyncTask(e.unAppID.toString(), e.hScreenshot);
      }
    }
  });
}

export function patchClipsMap(): Unregisterable {
  let patch = afterPatch(window.g_GRS.m_clips, "set", async (args: any[]) => {
    if (Config.get("capture_upload") &&
        (args != null) && (args.length > 1) &&
        (typeof args[0] === "string") &&
        (args[1].temporary === false)) {
      if ((!Config.get("sync_in_offline_mode")) && window.App.m_CurrentUser.bIsOfflineMode) {
        Logger.info("Skip uploading clip in offline mode");
      } else {
        await SyncTaskQeueue.addClipSyncTask(args[0]);
      }
    }
  });

  return {
    unregister: () => {
      patch.unpatch();
    }
  };
}

export function setupAppLifetimeNotifications(): Unregisterable {
  return SteamClient.GameSessions.RegisterForAppLifetimeNotifications(async (e: AppLifetimeNotification) => {
    if ((!Config.get("sync_in_offline_mode")) && window.App.m_CurrentUser.bIsOfflineMode) {
      Logger.info("Skip syncing in offline mode");
      return;
    }

    if (e.bRunning) {
      if (Config.get("sync_on_game_start")) {
        Logger.info(`Syncing on game ${e.unAppID} start`);
        await SyncTaskQeueue.addSyncTask(sync_cloud_first, e.unAppID, e.bRunning, e.nInstanceID);
        await SyncTaskQeueue.addSyncTask(sync_local_first, GLOBAL_SYNC_APP_ID, e.bRunning);
      }
    } else {
      if (Config.get("sync_on_game_stop")) {
        Logger.info(`Syncing on game ${e.unAppID} stop`);
        await SyncTaskQeueue.addSyncTask(sync_local_first, e.unAppID, e.bRunning);
        await SyncTaskQeueue.addSyncTask(sync_cloud_first, GLOBAL_SYNC_APP_ID, e.bRunning);
      }
    }
  });
}
