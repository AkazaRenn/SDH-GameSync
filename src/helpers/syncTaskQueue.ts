import fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { copy_capture, pause_process, resume_process, copy_clip } from "./backend";
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
  public readonly events = {
    BUSY: 'busy',
    FAIL_TOAST_CLICK: 'failToastClick',
  }

  private readonly queue: queueAsPromised<any>;

  public constructor() {
    super();
    this.queue = fastq.promise(worker, 1)
    this.queue.drain = () => {
      Logger.debug("All tasks finished")
      this.emit(this.events.BUSY, false);
    };
  }

  public get busy() {
    return (!this.queue.idle());
  }

  public async addSyncTask(syncFunction: (appId: number) => Promise<number>, appId: number, gameRunning?: boolean, pId?: number) {
    if (!SyncFilters.has(appId)) {
      return;
    }

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

    // To avoid uploading the same screenshots repeatedly.
    if ((appId == GLOBAL_SYNC_APP_ID) &&
         Config.get("capture_delete_after_upload") &&
         Config.get("capture_upload_on_sync")) {
      await this.addCapturesSyncTask();
    }
  }

  public async addScreenshotSyncTask(appId: string, screenshotIndex: number) {
    this.pushTask(async () => await copy_capture(await SteamClient.Screenshots.GetLocalScreenshotPath(appId, screenshotIndex)))
      .then((exitCode) => {
        if (exitCode == 0) {
          if (Config.get("capture_delete_after_upload")) {
            SteamClient.Screenshots.DeleteLocalScreenshot(appId, screenshotIndex)
              .then(() =>
                Logger.info(`Screenshot ${appId}:${screenshotIndex} uploaded and deleted locally`))
              .catch(() => {
                Logger.warning(`Failed to delete screenshot ${appId}:${screenshotIndex} locally`);
                Toaster.toast("Failed to delete screenshot");
              })
          }
        } else {
          Logger.error(`Failed to upload screenshot ${appId}:${screenshotIndex}, exit code: ${exitCode}`);
          Toaster.toast(`Failed to upload screenshot`);
        }
      });
  }

  public async addCapturesSyncTask() {
    (await SteamClient.Screenshots.GetAllLocalScreenshots()).forEach(screenshot =>
      this.addScreenshotSyncTask(screenshot.nAppID.toString(), screenshot.hHandle));

    const recordingPath = window.settingsStore.m_ClientSettings.gamerecording_background_path;
    for (const clip of window.g_GRS.m_clips.keys()) {
      this.pushTask(async () => await copy_clip(clip, recordingPath))
        .then((exitCode) => {
        if (exitCode == 0) {
          window.g_GRS.m_clips.delete(clip);
          Logger.info(`Clip ${clip} uploaded and deleted locally`);
        } else {
          Logger.error(`Failed to upload clip ${clip}, exit code: ${exitCode}`);
          Toaster.toast(`Failed to upload clip`);
        }
      });
    }
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
