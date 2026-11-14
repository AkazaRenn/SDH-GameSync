import { useEffect, useState } from "react";
import { FaArrowCircleUp, FaFileAlt, FaFileUpload, FaSave } from "react-icons/fa";
import { MdStorage } from "react-icons/md";
import { BsFillGearFill } from "react-icons/bs";
import { FaCloudArrowUp, FaCloudArrowDown } from "react-icons/fa6";
import { PanelSection, PanelSectionRow, sleep, ToggleField } from "@decky/ui";
import { GLOBAL_SYNC_APP_ID } from "../helpers/commonDefs";
import { updateRclone } from "../helpers/utils";
import { get_cloud_type, sync_cloud_first, create_cloud_destination } from "../helpers/backend";
import * as Popups from "../components/popups";
import * as Toaster from "../helpers/toaster";
import SyncTargetConfigPage from "./syncTargetConfigPage";
import PluginLogsPage from "./pluginLogsPage";
import ButtonWithIcon from "../components/buttonWithIcon";
import ConfigCloudPage from "./configCloudPage";
import SyncTaskQueue from "../helpers/syncTaskQueue";
import Config from "../helpers/config";
import SyncFilters from "../helpers/syncFilters";
import { t, tx } from "../i18n";

export default function quickAccessMenu() {
  const [showCaptureOptions, setShowCaptureOptions] = useState<boolean>(Config.get("capture_upload"));
  const [showCaptureUploadOnSync, setShowCaptureUploadOnSync] = useState<boolean>(Config.get("capture_delete_after_upload"));
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(Config.get("advanced_mode"));
  const [globalFilterAvailable, setGlobalFilterAvailable] = useState<boolean>(SyncFilters.has(GLOBAL_SYNC_APP_ID));
  const [syncInProgress, setSyncInProgress] = useState<boolean>(SyncTaskQueue.busy);
  const [hasProvider, setHasProvider] = useState<boolean>(true);

  let syncTriggeredManually = false;

  useEffect(() => {
    get_cloud_type().then((e) => setHasProvider(Boolean(e)));
    const registrations: Array<Unregisterable> = [];

    registrations.push(Config.on("capture_upload", setShowCaptureOptions));
    registrations.push(Config.on("capture_delete_after_upload", setShowCaptureUploadOnSync));
    registrations.push(Config.on("advanced_mode", setShowAdvancedOptions));
    registrations.push(SyncFilters.on(SyncFilters.events.UPDATE, () => setGlobalFilterAvailable(SyncFilters.has(GLOBAL_SYNC_APP_ID))));
    registrations.push(SyncTaskQueue.on(SyncTaskQueue.events.BUSY, (busy: boolean) => {
      setSyncInProgress(busy);
      if ((busy == false) && (syncTriggeredManually == true)) {
        Toaster.toast(t("toast.syncFinished"));
        syncTriggeredManually = false;
      }
    }));

    return () => {
      registrations.forEach(e => e.unregister());
    }
  }, []);

  return (<>
    {hasProvider && (<>
      <style>{`
        .cloudSaveForkRotatingIcon {
          animation: cloudSaveForkRotatingIconAnimation 1s infinite cubic-bezier(0.46, 0.03, 0.52, 0.96);
        }
        @keyframes cloudSaveForkRotatingIconAnimation {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}
      </style>
      <PanelSection title={t("qam.sync")}>
        <PanelSectionRow>
          <ButtonWithIcon
            icon={<FaSave className={syncInProgress ? "cloudSaveForkRotatingIcon" : ""} />}
            disabled={syncInProgress || (!globalFilterAvailable)}
            onClick={() => {
              syncTriggeredManually = true;
              SyncTaskQueue.addSyncTask(sync_cloud_first, GLOBAL_SYNC_APP_ID);
            }}
          >
            {t("qam.startGlobalSync")}
          </ButtonWithIcon>
          {(!globalFilterAvailable) && <small>{t("qam.setupGlobalFilterFirst")}</small>}
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={t("qam.syncOnGameStart")}
            checked={Config.get("sync_on_game_start")}
            onChange={(e) => {
              Config.set("sync_on_game_start", e);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={t("qam.syncOnGameStop")}
            checked={Config.get("sync_on_game_stop")}
            onChange={(e) => {
              Config.set("sync_on_game_stop", e);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label={t("qam.syncInOfflineMode")}
            checked={Config.get("sync_in_offline_mode")}
            onChange={(e) => {
              Config.set("sync_in_offline_mode", e);
            }}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title={t("qam.captures")}>
        <PanelSectionRow>
          <ToggleField
            label={t("qam.uploadCaptures")}
            checked={Config.get("capture_upload")}
            onChange={e => Config.set("capture_upload", e)}
          />
        </PanelSectionRow>
        {showCaptureOptions && (<>
          <PanelSectionRow>
            <ToggleField
              label={t("qam.deleteLocalCopy")}
              checked={Config.get("capture_delete_after_upload")}
              onChange={(e) => {
                Config.set("capture_delete_after_upload", e);
              }}
            />
          </PanelSectionRow>
          {showCaptureUploadOnSync && (
            <PanelSectionRow>
              <ToggleField
                label={t("qam.uploadOnGlobalSync")}
                checked={Config.get("capture_upload_on_sync")}
                onChange={(e) => {
                  Config.set("capture_upload_on_sync", e);
                }}
              />
            </PanelSectionRow>
          )}
          <PanelSectionRow>
            <ButtonWithIcon
              icon={<FaFileUpload />}
              onClick={() =>
                Popups.multipleTextInputsPopup(t("qam.uploadDestinationsTitle"),
                  {
                    [t("qam.screenshots")]: {
                      value: Config.get("capture_upload_destination"),
                      set: (e) => Config.set("capture_upload_destination", e),
                    },
                    [t("qam.clips")]: {
                      value: Config.get("capture_upload_destination_video"),
                      set: (e) => Config.set("capture_upload_destination_video", e),
                    },
                  })}
            >
              {t("qam.uploadDestinations")}
            </ButtonWithIcon>
          </PanelSectionRow>
        </>)}
      </PanelSection>
    </>)}
    <PanelSection title={t("qam.configuration")}>
      {hasProvider && (<>
        <PanelSectionRow>
          <ButtonWithIcon
            icon={<BsFillGearFill />}
            onClick={() => SyncTargetConfigPage.enter({ appId: String(GLOBAL_SYNC_APP_ID) })}
          >
            {t("qam.globalSyncFilters")}
          </ButtonWithIcon>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonWithIcon
            icon={<FaFileAlt />}
            onClick={() => PluginLogsPage.enter({})}
          >
            {t("logs.pluginLogs")}
          </ButtonWithIcon>
        </PanelSectionRow>
      </>)}
      <PanelSectionRow>
        <ButtonWithIcon
          icon={<MdStorage />}
          onClick={() => ConfigCloudPage.enter({})}
        >
          {t("qam.cloudProvider")}
        </ButtonWithIcon>
      </PanelSectionRow>
    </PanelSection>

    {hasProvider && (<>
      <PanelSection title={t("qam.advancedMode")}>
        <PanelSectionRow>
          <ToggleField
            label={t("qam.enable")}
            checked={Config.get("advanced_mode")}
            onChange={(e) => {
              if (e) {
                Popups.confirmPopup(t("qam.enableAdvancedModeTitle"),
                  <span>
                    {t("qam.advancedModeText")}<br />
                    <b>{t("qam.advancedModeWarning")}</b><br /><br />
                    {t("common.confirmToContinue")}
                  </span>,
                  () => Config.set("advanced_mode", true));
              } else {
                Config.set("advanced_mode", false);
              }
            }}
          />
        </PanelSectionRow>
        {showAdvancedOptions && (<>
          <PanelSectionRow>
            <ToggleField
              label={t("qam.strictGameSync")}
              checked={Config.get("strict_game_sync")}
              onChange={(e) => {
                if (e) {
                  Popups.confirmPopup(t("qam.enableStrictGameSyncTitle"),
                    <span>
                      {tx("qam.strictGameSyncText", { deleteAnyFiles: <b>{t("qam.deleteAnyFiles")}</b> })}<br /><br />
                      {t("common.confirmToContinue")}
                    </span>,
                    () => Config.set("strict_game_sync", true))
                } else {
                  Config.set("strict_game_sync", false);
                }
              }}
            />
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonWithIcon
              icon={<FaCloudArrowUp />}
              onClick={() =>
                Popups.textInputPopup(t("qam.syncRootTitle"), {
                  value: Config.get("sync_root"),
                  set: (e) => {
                    if (e != Config.get("sync_root")) {
                      if (Config.get("strict_game_sync")) {
                        Popups.confirmPopup(t("qam.modifySyncRootTitle"),
                          <span>
                            {t("qam.modifySyncRootText")}<br />
                            {tx("qam.dataAlignedWarning", { fullyDeleted: <b>{t("qam.fullyDeleted")}</b> })}<br /><br />
                            {t("common.confirmToContinue")}
                          </span>,
                          () => Config.set("sync_root", e)
                        )
                      } else {
                        Config.set("sync_root", e);
                      }
                    }
                  },
                })
              }
            >
              {t("qam.setSyncRoot")}
            </ButtonWithIcon>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonWithIcon
              icon={<FaCloudArrowDown />}
              onClick={() =>
                Popups.textInputPopup(t("qam.syncDestinationTitle"), {
                  value: Config.get("sync_destination"),
                  set: (e) => {
                    if (e != Config.get("sync_destination")) {
                      if (Config.get("strict_game_sync")) {
                        Popups.confirmPopup(t("qam.modifySyncDestinationTitle"),
                          <span>
                            {t("qam.modifySyncDestinationText")}<br />
                            {tx("qam.dataAlignedWarning", { fullyDeleted: <b>{t("qam.fullyDeleted")}</b> })}<br /><br />
                            {t("common.confirmToContinue")}
                          </span>,
                          async () => {
                            Config.set("sync_destination", e);
                            sleep(500).then(create_cloud_destination);
                          }
                        )
                      } else {
                        Config.set("sync_destination", e);
                      }
                    }
                  },
                })
              }
            >
              {t("qam.setSyncDestination")}
            </ButtonWithIcon>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonWithIcon
              icon={<FaArrowCircleUp />}
              onClick={() => updateRclone(true)}
            >
              {t("qam.updateRclone")}
            </ButtonWithIcon>
          </PanelSectionRow>
        </>)}
      </PanelSection>
    </>)}
  </>);
};
