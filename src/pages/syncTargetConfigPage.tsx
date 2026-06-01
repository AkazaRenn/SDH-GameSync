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
      Toaster.toast("Invalid appId for sync target config page");
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
            "Filter Saved",
            <span>
              Since you have enabled Strict Game Sync, modifying the filter may cause the next download sync (on game start) to delete some data. To avoid that, it is highly recommended to trigger an upload sync (on game stop) right now to get data into sync.<br /><br />
              Do you want to trigger an upload sync right now?
            </span>,
            () => SyncTaskQueue.addSyncTask(sync_local_first, appId),
            "Sync Now",
            "Skip"
          )
        } else {
          Toaster.toast("Filter Saved");
        }
      }))

      return () => registrations.forEach(e => e.unregister());
    }, []);

    return <SidebarNavigation
      pages={[
        {
          title: "Sync Logs",
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
                    onOKActionDescription="Delete Lock Files"
                    disabled={syncInProgress}
                    onClick={() => confirmPopup(
                      "Delete Lock Files",
                      <span>
                        Delete lock files when the prior sync is interrupted without proper cleanup.<br /><br />
                        Click "Confirm" to continue.
                      </span>,
                      () => {
                        delete_lock_files().then(() => {
                          Toaster.toast("Lock files deleted");
                        }).catch((e) => {
                          Logger.error(`Failed to delete lock files: ${e}`);
                          Toaster.toast("Failed to delete lock files");
                        });
                      }
                    )}>
                  </IconButton>
                  <IconButton
                    icon={IoArrowUpCircle}
                    onOKActionDescription="Resync (Local First)"
                    disabled={syncInProgress}
                    onClick={() => confirmPopup(
                      "Resync (Local First)",
                      <span>
                        Starting resync, this may take some time.<br /><br />
                        Click "Confirm" to continue.
                      </span>,
                      () => SyncTaskQueue.addSyncTask(_ => resync_local_first(), GLOBAL_SYNC_APP_ID)
                    )}>
                  </IconButton>
                  <IconButton
                    icon={IoArrowDownCircle}
                    onOKActionDescription="Resync (Cloud First)"
                    disabled={syncInProgress}
                    onClick={() => confirmPopup(
                      "Resync (Cloud First)",
                      <span>
                        Starting resync, this may take some time.<br /><br />
                        Click "Confirm" to continue.
                      </span>,
                      () => SyncTaskQueue.addSyncTask(_ => resync_cloud_first(), GLOBAL_SYNC_APP_ID)
                    )}>
                  </IconButton>
                </>)}
            </LogsView>
        },
        "separator",
        {
          title: "Target Filter",
          visible: true,
          content:
            <FiltersView
              description={<>Filters specific for <i>{appName}</i> sync. It will be used together with the shared filter, but has a lower priority.</>}
              getFiltersFunction={() => SyncFilters.get(appId)}
              setFiltersFunction={(filters) => SyncFilters.set(appId, filters)}
            >
              <IconButton
                icon={FaCloudArrowUp}
                onOKActionDescription={`Sync Now (${(appId == GLOBAL_SYNC_APP_ID) ? "Local First" : "Upload to Cloud"})`}
                disabled={syncInProgress}
                onClick={() => SyncTaskQueue.addSyncTask(sync_local_first, appId)}>
              </IconButton>
              <IconButton
                icon={FaCloudArrowDown}
                onOKActionDescription={`Sync Now (${(appId == GLOBAL_SYNC_APP_ID) ? "Cloud First" : "Download to Local"})`}
                disabled={syncInProgress}
                onClick={() => SyncTaskQueue.addSyncTask(sync_cloud_first, appId)}>
              </IconButton>
            </FiltersView>
        },
        {
          title: "Shared Filter",
          visible: true,
          content:
            <SharedFiltersView
              description="Filters that's shared among all syncs. It will be used together with the target filter, but has a higher priority."
            />
        },
      ]}
    />
  }
}

const syncTargetConfigPage = new SyncTargetConfigPage();
export default syncTargetConfigPage;
