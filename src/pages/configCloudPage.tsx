import { ReactNode, useEffect, useState } from "react";
import { ImOnedrive, ImDropbox, ImHome, ImGoogleDrive } from "react-icons/im";
import { BsGearFill, BsPatchQuestionFill } from "react-icons/bs";
import { ButtonItem, Navigation, PanelSection, PanelSectionRow, sleep } from "@decky/ui";
import { spawn, spawn_probe } from "../helpers/backend";
import { confirmPopup } from "../components/popups";
import { get_cloud_type, create_cloud_destination } from "../helpers/backend";
import Container from "../components/container";
import RoutePage from "../components/routePage";
import Config from "../helpers/config";
import { t, tx } from "../i18n";

async function openConfig(cloud: "onedrive" | "drive" | "dropbox") {
  const url = await spawn(cloud);
  (async () => {
    let count = 0; // For timeout in case user forgor 💀
    while ((count++) < 7_200 /* approx 1h */) {
      await sleep(500);
      if (await spawn_probe() !== null) {
        confirmPopup(
          t("cloud.createFolderTitle"),
          <p>
            {tx("cloud.createFolderText1", { folder: <i>{Config.get("sync_destination")}</i> })}<br /><br />
            {t("cloud.createFolderText2")}<br />
            {t("cloud.createFolderText3")}
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
      return t("cloud.other", { type: cloudType });
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
          setProvider(`❌ ${t("cloud.none")} ❌`);
        }
      })
    }, []);

    return (
      <Container title={t("cloud.pageTitle")}>
        <PanelSection>
          <strong>{t("cloud.currentlyUsing", { provider: provider ?? "" })}</strong>
        </PanelSection>
        <PanelSection>
          <small>{t("cloud.chooseProvider")}</small>
          <PanelSectionRow>
            <ButtonItem onClick={() => openConfig("onedrive")} icon={<ImOnedrive />} label="OneDrive">
              <BsGearFill />
            </ButtonItem>
          </PanelSectionRow>
          <PanelSectionRow>
            <ButtonItem
              onClick={() => openConfig("drive")}
              icon={<ImGoogleDrive />}
              label={t("cloud.googleDrive")}
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
                confirmPopup(t("cloud.otherTitle"),
                  <span style={{ whiteSpace: "pre-wrap" }}>
                    {t("cloud.otherText1")}<br />
                    {tx("cloud.otherText2", { link: <a href="https://rclone.org/commands/rclone_config_create/">https://rclone.org/commands/rclone_config_create/</a> })}<br />
                    {t("cloud.otherText3")}
                  </span>
                )}
              icon={<ImHome />}
              label={t("cloud.otherButton")}
            >
              <BsPatchQuestionFill />
            </ButtonItem>
          </PanelSectionRow>
        </PanelSection>
      </Container >
    );
  }
}

const configCloudPage = new ConfigCloudPage();
export default configCloudPage;
