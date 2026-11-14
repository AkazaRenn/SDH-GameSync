import { ReactNode } from "react";
import RoutePage from "../components/routePage";
import LogsView from "../components/logsView";
import { get_plugin_log } from "../helpers/backend";
import { t } from "../i18n";

class PluginLogsPage extends RoutePage {
  readonly route = "plugin-logs";

  render(): ReactNode {
    return <LogsView
      title={t("logs.pluginLogs")}
      getLog={get_plugin_log}
    />;
  }
}

const pluginLogsPage = new PluginLogsPage();
export default pluginLogsPage;
