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
        Toaster.toast("Sync finished");
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
      <PanelSection title="Sync">
        <PanelSectionRow>
          <ButtonWithIcon
            icon={<FaSave className={syncInProgress ? "cloudSaveForkRotatingIcon" : ""} />}
            disabled={syncInProgress || (!globalFilterAvailable)}
            onClick={() => {
              syncTriggeredManually = true;
              SyncTaskQueue.addSyncTask(sync_cloud_first, GLOBAL_SYNC_APP_ID);
            }}
          >
            Start Global Sync
          </ButtonWithIcon>
          {(!globalFilterAvailable) && <small>Please setup the global sync filter via "Global Sync Filters" button first.</small>}
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Sync on game start"
            checked={Config.get("sync_on_game_start")}
            onChange={(e) => {
              Config.set("sync_on_game_start", e);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Sync on game stop"
            checked={Config.get("sync_on_game_stop")}
            onChange={(e) => {
              Config.set("sync_on_game_stop", e);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <ToggleField
            label="Sync in offline mode"
            checked={Config.get("sync_in_offline_mode")}
            onChange={(e) => {
              Config.set("sync_in_offline_mode", e);
            }}
          />
        </PanelSectionRow>
      </PanelSection>

      <PanelSection title="Captures">
        <PanelSectionRow>
          <ToggleField
            label="Upload captures"
            checked={Config.get("capture_upload")}
            onChange={e => Config.set("capture_upload", e)}
          />
        </PanelSectionRow>
        {showCaptureOptions && (<>
          <PanelSectionRow>
            <ToggleField
              label="Delete local copy"
              checked={Config.get("capture_delete_after_upload")}
              onChange={(e) => {
                Config.set("capture_delete_after_upload", e);
              }}
            />
          </PanelSectionRow>
          {showCaptureUploadOnSync && (
            <PanelSectionRow>
              <ToggleField
                label="Upload on global sync"
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
                Popups.multipleTextInputPopup("Captures Upload Destinations",
                  {
                    "Screenshots": {
                      value: Config.get("capture_upload_destination"),
                      set: (e) => Config.set("capture_upload_destination", e),
                    },
                    "Clips": {
                      value: Config.get("capture_upload_destination_video"),
                      set: (e) => Config.set("capture_upload_destination_video", e),
                    },
                  })}
            >
              Upload Destinations
            </ButtonWithIcon>
          </PanelSectionRow>
        </>)}
      </PanelSection>
    </>)}
    <PanelSection title="Configuration">
      {hasProvider && (<>
        <PanelSectionRow>
          <ButtonWithIcon
            icon={<BsFillGearFill />}
            onClick={() => SyncTargetConfigPage.enter({ appId: String(GLOBAL_SYNC_APP_ID) })}
          >
            Global Sync Filters
          </ButtonWithIcon>
        </PanelSectionRow>
        <PanelSectionRow>
          <ButtonWithIcon
            icon={<FaFileAlt />}
            onClick={() => PluginLogsPage.enter({})}
          >
            Plugin Logs
          </ButtonWithIcon>
        </PanelSectionRow>
      </>)}
      <PanelSectionRow>
        <ButtonWithIcon
          icon={<MdStorage />}
          onClick={() => ConfigCloudPage.enter({})}
        >
          Cloud Provider
        </ButtonWithIcon>
      </PanelSectionRow>
    </PanelSection>

    {hasProvider && (<>
      <PanelSection title="Advanced Mode">
        <PanelSectionRow>
          <ToggleField
            label="Enable"
            checked={Config.get("advanced_mode")}
            onChange={(e) => {
              if (e) {
                Popups.confirmPopup("Enable Advanced Mode",
                  <span>
                    Advanced Mode is only for those who understand what they are doing.<br />
                    <b>Using options within without caution may cause unrecoverable data loss!</b><br /><br />
                    Click "Confirm" to continue.
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
              label="Strict Game Sync"
              checked={Config.get("strict_game_sync")}
              onChange={(e) => {
                if (e) {
                  Popups.confirmPopup("Enable Strict Game Sync",
                    <span>
                      This will change rclone to from "COPY" mode to "SYNC" mode when doing game sync, which allows it to <b>DELETE ANY FILES</b> on destination (local/cloud) to make it match the source (cloud/local).<br /><br />
                      Click "Confirm" to continue.
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
                Popups.textInputPopup("Global & Game Sync Root", {
                  value: Config.get("sync_root"),
                  set: (e) => {
                    if (e != Config.get("sync_root")) {
                      if (Config.get("strict_game_sync")) {
                        Popups.confirmPopup("Modify Sync Root",
                          <span>
                            You are modifying the sync root with "Strict Game Sync" enabled.<br />
                            Please make sure all the data are aligned in local and cloud, otherwise data may be lost or even <b>fully deleted</b>!<br /><br />
                            Click "Confirm" to continue.
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
              Set Sync Root
            </ButtonWithIcon>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonWithIcon
              icon={<FaCloudArrowDown />}
              onClick={() =>
                Popups.textInputPopup("Global & Game Sync Destination", {
                  value: Config.get("sync_destination"),
                  set: (e) => {
                    if (e != Config.get("sync_destination")) {
                      if (Config.get("strict_game_sync")) {
                        Popups.confirmPopup("Modify Sync Destination",
                          <span>
                            You are modifying the sync destination with "Strict Game Sync" enabled.<br />
                            Please make sure all the data are aligned in local and cloud, otherwise data may be lost or even <b>fully deleted</b>!<br /><br />
                            Click "Confirm" to continue.
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
              Set Sync Destination
            </ButtonWithIcon>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonWithIcon
              icon={<FaArrowCircleUp />}
              onClick={() => updateRclone(true)}
            >
              Update Rclone
            </ButtonWithIcon>
          </PanelSectionRow>
        </>)}
      </PanelSection>
    </>)}
  </>);
};
