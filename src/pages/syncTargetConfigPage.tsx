import { ReactNode, useEffect, useState } from "react";
import { IoMdUnlock } from "react-icons/io";
import { IoArrowUpCircle, IoArrowDownCircle } from "react-icons/io5";
import { FaCloudArrowUp, FaCloudArrowDown } from "react-icons/fa6";
import { Navigation, SidebarNavigation, useParams } from "@decky/ui";
import { GLOBAL_SYNC_APP_ID } from "../helpers/commonDefs";
import { getAppName } from "../helpers/utils";
import { get_last_sync_log, sync_local_first, sync_cloud_first, resync_local_first, resync_cloud_first, delete_lock_files } from "../helpers/backend";
import { confirmPopup } from "../components/popups";
import * as Toaster from "../helpers/toaster";
import RoutePage from "../components/routePage";
import LogsView from "../components/logsView";
import FiltersView from "../components/filtersView";
import SharedFiltersView from "../components/sharedFiltersView";
import Logger from "../helpers/logger";
import SyncTaskQueue from "../helpers/syncTaskQueue";
import IconButton from "../components/iconButton";
import SyncFilters from "../helpers/syncFilters";
import Config from "../helpers/config";
import { t, tx } from "../i18n";

interface SyncTargetConfigPageParams {
  appId: string;
}

class SyncTargetConfigPage extends RoutePage<SyncTargetConfigPageParams> {
  readonly route = "sync-target";
  readonly params = ["appId"];

  protected _register(): UnregisterFunction {
    const registrations: Array<Unregisterable> = [];

    registrations.push({ unregister: super._register() });
    registrations.push(SyncTaskQueue.on(SyncTaskQueue.events.FAIL_TOAST_CLICK, (appId) => this.enter({ appId: appId })));

    return () => registrations.forEach(e => e.unregister());
  }

  render(): ReactNode {
    const appId = Number(useParams<SyncTargetConfigPageParams>().appId);
    if (isNaN(appId)) {
      Logger.error(`Invalid appId for sync target config page: ${useParams<SyncTargetConfigPageParams>().appId}`);
      Toaster.toast(t("toast.invalidAppId"));
      Navigation.NavigateBack();
      return;
    }

    const appName = getAppName(appId);

    const [syncInProgress, setSyncInProgress] = useState<boolean>(SyncTaskQueue.busy);
    useEffect(() => {
      const registrations: Array<Unregisterable> = [];

      registrations.push(SyncTaskQueue.on(SyncTaskQueue.events.BUSY, setSyncInProgress));
      registrations.push(SyncFilters.on(SyncFilters.events.SET, (appId: number) => {
        if ((appId > GLOBAL_SYNC_APP_ID) && Config.get("strict_game_sync")) {
          confirmPopup(
            t("toast.filterSaved"),
            <span>
              {t("target.strictFilterSavedText")}<br /><br />
              {t("target.strictFilterSavedQuestion")}
            </span>,
            () => SyncTaskQueue.addSyncTask(sync_local_first, appId),
            t("target.syncNow"),
            t("target.skip")
          )
        } else {
          Toaster.toast(t("toast.filterSaved"));
        }
      }))

      return () => registrations.forEach(e => e.unregister());
    }, []);

    return <SidebarNavigation
      pages={[
        {
          title: t("target.syncLogs"),
          // icon: <FaFileAlt />,
          visible: true,
          content:
            <LogsView
              getLog={async () => await get_last_sync_log(appId)}
            >
              {(appId == GLOBAL_SYNC_APP_ID) && (
                <>
                  <IconButton
                    icon={IoMdUnlock}
                    onOKActionDescription={t("target.deleteLockFiles")}
                    disabled={syncInProgress}
                    onClick={() => confirmPopup(
                      t("target.deleteLockFiles"),
                      <span>
                        {t("target.deleteLockFilesText")}<br /><br />
                        {t("common.confirmToContinue")}
                      </span>,
                      () => {
                        delete_lock_files().then(() => {
                          Toaster.toast(t("toast.lockFilesDeleted"));
                        }).catch((e) => {
                          Logger.error(`Failed to delete lock files: ${e}`);
                          Toaster.toast(t("toast.lockFilesDeleteFailed"));
                        });
                      }
                    )}>
                  </IconButton>
                  <IconButton
                    icon={IoArrowUpCircle}
                    onOKActionDescription={t("target.resyncLocalFirst")}
                    disabled={syncInProgress}
                    onClick={() => confirmPopup(
                      t("target.resyncLocalFirst"),
                      <span>
                        {t("target.resyncText")}<br /><br />
                        {t("common.confirmToContinue")}
                      </span>,
                      () => SyncTaskQueue.addSyncTask(_ => resync_local_first(), GLOBAL_SYNC_APP_ID)
                    )}>
                  </IconButton>
                  <IconButton
                    icon={IoArrowDownCircle}
                    onOKActionDescription={t("target.resyncCloudFirst")}
                    disabled={syncInProgress}
                    onClick={() => confirmPopup(
                      t("target.resyncCloudFirst"),
                      <span>
                        {t("target.resyncText")}<br /><br />
                        {t("common.confirmToContinue")}
                      </span>,
                      () => SyncTaskQueue.addSyncTask(_ => resync_cloud_first(), GLOBAL_SYNC_APP_ID)
                    )}>
                  </IconButton>
                </>)}
            </LogsView>
        },
        "separator",
        {
          title: t("target.targetFilter"),
          visible: true,
          content:
            <FiltersView
              description={tx((appId == GLOBAL_SYNC_APP_ID) ? "target.globalFilterDescription" : "target.targetFilterDescription", { app: <i>{appName}</i> })}
              getFiltersFunction={() => SyncFilters.get(appId)}
              setFiltersFunction={(filters) => SyncFilters.set(appId, filters)}
            >
              <IconButton
                icon={FaCloudArrowUp}
                onOKActionDescription={t((appId == GLOBAL_SYNC_APP_ID) ? "target.syncNowLocalFirst" : "target.syncNowUpload")}
                disabled={syncInProgress}
                onClick={() => SyncTaskQueue.addSyncTask(sync_local_first, appId)}>
              </IconButton>
              <IconButton
                icon={FaCloudArrowDown}
                onOKActionDescription={t((appId == GLOBAL_SYNC_APP_ID) ? "target.syncNowCloudFirst" : "target.syncNowDownload")}
                disabled={syncInProgress}
                onClick={() => SyncTaskQueue.addSyncTask(sync_cloud_first, appId)}>
              </IconButton>
            </FiltersView>
        },
        {
          title: t("target.sharedFilter"),
          visible: true,
          content:
            <SharedFiltersView
              description={t("target.sharedFilterDescription")}
            />
        },
      ]}
    />
  }
}

const syncTargetConfigPage = new SyncTargetConfigPage();
export default syncTargetConfigPage;
