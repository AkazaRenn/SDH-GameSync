import fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { copy_capture, pause_process, resume_process, copy_clip, delete_clip_locally } from "./backend";
import * as Toaster from "./toaster";
import * as SyncStateTracker from "./syncStateTracker";
import Observable from "../types/observable";
import Logger from "./logger"
import Config from "./config";
import SyncFilters from "./syncFilters";
import { GLOBAL_SYNC_APP_ID } from "./commonDefs";

async function worker(fn: () => Promise<number>): Promise<number | undefined> {
  try {
    return await fn();
  } catch (error) {
    Logger.error('Error processing task:', error);
  }

  return undefined;
}

class SyncTaskQueue extends Observable {
  readonly events = {
    BUSY: 'busy',
    FAIL_TOAST_CLICK: 'failToastClick',
  }

  private readonly queue: queueAsPromised<any>;

  constructor() {
    super();
    this.queue = fastq.promise(worker, 1)
    this.queue.drain = () => {
      Logger.debug("All tasks finished")
      this.emit(this.events.BUSY, false);
    };
  }

  get busy() {
    return (!this.queue.idle());
  }

  async addSyncTask(syncFunction: (appId: number) => Promise<number>, appId: number, gameRunning?: boolean, pId?: number) {
    if (SyncFilters.has(appId)) {
      if (pId) {
        await pause_process(pId);
      }

      if ((!gameRunning) || SyncStateTracker.getInSync(appId)) {
        this.pushTask(async () => syncFunction(appId))
          .then((exitCode) => {
            if (exitCode == 0 || exitCode == 6) {
              Logger.info(`Sync for "${appId}" finished`);
            } else {
              Logger.error(`Sync for for ${appId} failed with exit code ${exitCode}`);
              Toaster.toast(`Sync failed, click to see the errors`, 5000, () => {
                this.emit(this.events.FAIL_TOAST_CLICK, appId)
              });
            }
          })
          .finally(() => {
            if (pId) {
              resume_process(pId);
            }
            if (gameRunning != undefined) {
              // in sync only when game is not running
              SyncStateTracker.setInSync(appId, !gameRunning);
            }
          });
      } else {
        if (pId) {
          resume_process(pId);
        }
        Logger.warning(`Skipping download sync for ${appId} due to missing upload sync`);
        Toaster.toast("Skipping download sync");
      }
    }

    // To avoid uploading the same screenshots repeatedly.
    if ((appId == GLOBAL_SYNC_APP_ID) &&
         Config.get("capture_delete_after_upload") &&
         Config.get("capture_upload_on_sync")) {
      await this.addCapturesSyncTask();
    }
  }

  async addScreenshotSyncTask(appId: string, screenshotIndex: number) {
    this.pushTask(async () => {
      let exitCode = await copy_capture(await SteamClient.Screenshots.GetLocalScreenshotPath(appId, screenshotIndex));
      if (exitCode == 0) {
        if (Config.get("capture_delete_after_upload")) {
          try {
            await SteamClient.Screenshots.DeleteLocalScreenshot(appId, screenshotIndex);
            Logger.info(`Screenshot ${appId}:${screenshotIndex} uploaded and deleted locally`);
          } catch {
            Logger.warning(`Failed to delete screenshot ${appId}:${screenshotIndex} locally`);
            Toaster.toast("Failed to delete screenshot");
            return -1;
          }
        }
      } else {
        Logger.error(`Failed to upload screenshot ${appId}:${screenshotIndex}, exit code: ${exitCode}`);
        Toaster.toast(`Failed to upload screenshot`);
      }

      return exitCode;
    });
  }

  async addClipSyncTask(clip: string) {
    const recordingsPath = window.settingsStore.m_ClientSettings.gamerecording_background_path;
    this.pushTask(async () => {
      // Avoid duplication caused by clipping in Media page
      if (!window.g_GRS.m_clips.has(clip)) {
        return 0;
      }

      let exitCode = await copy_clip(clip, recordingsPath);
      if (exitCode == 0) {
        if (Config.get("capture_delete_after_upload")) {
          try {
            await delete_clip_locally(clip, recordingsPath);
            window.g_GRS.m_clips.delete(clip);
            Logger.info(`Clip ${clip} uploaded and deleted locally`);
          } catch {
            Logger.warning(`Failed to delete clip ${clip} locally`);
            Toaster.toast("Failed to delete clip");
            return -1;
          }
        }
      } else {
        Logger.error(`Failed to upload clip ${clip}, exit code: ${exitCode}`);
        Toaster.toast(`Failed to upload clip`);
      }

      return exitCode;
    });
  }

  async addCapturesSyncTask() {
    // Use pushTask here to make sure the captures list are up-to-date
    this.pushTask(async () => {
      (await SteamClient.Screenshots.GetAllLocalScreenshots()).forEach(screenshot =>
        this.addScreenshotSyncTask(screenshot.nAppID.toString(), screenshot.hHandle));

      for (const [key, value] of window.g_GRS.m_clips) {
        if (value.temporary === false) {
          await this.addClipSyncTask(key);
        }
      }

      return 0;
    });
  }

  private async pushTask(fn: () => Promise<number>): Promise<number | undefined> {
    if (this.queue.idle()) {
      Logger.debug("Starting task");
      this.emit(this.events.BUSY, true);
    }
    return await this.queue.push(fn);
  }
}

const syncTaskQueue = new SyncTaskQueue();
export default syncTaskQueue;
