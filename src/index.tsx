import { LuArrowDownUp } from "react-icons/lu";
import { definePlugin } from "@decky/api";
import { PLUGIN_NAME } from "./helpers/commonDefs";
import { updateRclone, retry } from "./helpers/utils";
import * as ApiClient from "./helpers/apiClient";
import * as Clipboard from "./helpers/clipboard";
import PluginLogsPage from "./pages/pluginLogsPage";
import ConfigCloudPage from "./pages/configCloudPage";
import SyncTargetConfigPage from "./pages/syncTargetConfigPage";
import ContextMenuPatch from "./helpers/contextMenuPatch";
import QuickAccessMenu from "./pages/quickAccessMenu";

export default definePlugin(() => {
  const retryDelayMs = 5000;
  const registrations: Array<Unregisterable> = [];

  retry(() => registrations.push(ApiClient.setupAppLifetimeNotifications()), retryDelayMs);
  retry(() => registrations.push(ApiClient.setupScreenshotNotification()), retryDelayMs);
  retry(() => registrations.push(ApiClient.patchClipsMap()), retryDelayMs);

  retry(() => registrations.push(PluginLogsPage.register()), retryDelayMs);
  retry(() => registrations.push(ConfigCloudPage.register()), retryDelayMs);
  retry(() => registrations.push(SyncTargetConfigPage.register()), retryDelayMs);

  retry(() => registrations.push(ContextMenuPatch.register()), retryDelayMs);

  updateRclone();

  return {
    name: PLUGIN_NAME,
    content: <QuickAccessMenu />,
    icon: <LuArrowDownUp />,
    onDismount() {
      registrations.forEach(registration => registration.unregister());
      Clipboard.clear();
    }
  }
});
