import { ReactNode, useEffect, useState } from "react";
import { ImOnedrive, ImDropbox, ImHome, ImGoogleDrive } from "react-icons/im";
import { BsGearFill, BsPatchQuestionFill } from "react-icons/bs";
import { ButtonItem, Navigation, PanelSection, PanelSectionRow, sleep } from "@decky/ui";
import { spawn, spawn_probe } from "../helpers/backend";
import { confirmPopup } from "../components/popups";
import { get_cloud_type, create_cloud_destination } from "../helpers/backend";
import ScrollablePage from "../components/scrollablePage";
import RoutePage from "../components/routePage";
import Config from "../helpers/config";

async function openConfig(cloud: "onedrive" | "drive" | "dropbox") {
  const url = await spawn(cloud);
  (async () => {
    let count = 0; // For timeout in case user forgor 💀
    while ((count++) < 7_200 /* approx 1h */) {
      await sleep(500);
      if (await spawn_probe() !== null) {
        confirmPopup(
          "Create cloud folder for sync?",
          <p>
            If you have successfully configured the cloud provider, now it's time to create the destination folder <i>{Config.get("sync_destination")}</i> in the cloud for sync.<br /><br />
            To trigger that, click "Confirm".<br />
            If you have other plans, feel free to dismiss it by clicking "Cancel".
          </p>,
          create_cloud_destination
        );
        Navigation.NavigateBack();
        break;
      }
    }
  })();
  Navigation.CloseSideMenus();
  Navigation.NavigateToExternalWeb(url);
}

async function getCloudBackend(): Promise<string> {
  const cloudType = await get_cloud_type();
  switch (cloudType) {
    case "":
      return ""
    case "onedrive":
      return "OneDrive";
    case "drive":
      return "Google Drive";
    case "dropbox":
      return "Dropbox";
    default:
      return "Other: " + cloudType;
  }
}

class ConfigCloudPage extends RoutePage {
  readonly route = "config-cloud";

  render(): ReactNode {
    const [provider, setProvider] = useState<string>();

    useEffect(() => {
      getCloudBackend().then((cloud) => {
        if (cloud) {
          setProvider(`☁️ ${cloud} ☁️`);
        } else {
          setProvider("❌ N/A ❌");
        }
      })
    }, []);

    return (
      <ScrollablePage title="Configure Cloud Storage Provider">
        <PanelSection>
          <strong>Currently using: {provider}</strong>
        </PanelSection>
        <PanelSection>
          <small>Click one of the providers below to configure the backup destination</small>
          <PanelSectionRow>
            <ButtonItem onClick={() => openConfig("onedrive")} icon={<ImOnedrive />} label="OneDrive">
              <BsGearFill />
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              onClick={() => openConfig("drive")}
              icon={<ImGoogleDrive />}
              label="Google Drive (may not work if Google does not trust the Steam Browser)"
            >
              <BsGearFill />
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem onClick={() => openConfig("dropbox")} icon={<ImDropbox />} label="Dropbox">
              <BsGearFill />
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              onClick={() =>
                confirmPopup("Adding Other Providers",
                  <span style={{ whiteSpace: "pre-wrap" }}>
                    In addition to the providers listed above, others can also be configured. Unfortunately, setup for them can only be done in desktop mode.<br />
                    Please refer to rclone config documents (<a href="https://rclone.org/commands/rclone_config_create/">https://rclone.org/commands/rclone_config_create/</a>) for more information.<br />
                    Use "cloud" for remote name if you are doing it.
                  </span>
                )}
              icon={<ImHome />}
              label="Other (Advanced)"
            >
              <BsPatchQuestionFill />
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>
      </ScrollablePage>
    );
  }
}

const configCloudPage = new ConfigCloudPage();
export default configCloudPage;
