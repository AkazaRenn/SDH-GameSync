import { DialogButton, showContextMenu, Menu, MenuItem } from "@decky/ui";
import { openFilePicker, FileSelectionType } from "@decky/api";
import { confirmPopup } from "./popups";
import { test_syncpath } from "../helpers/backend";
import { reduceSlashes } from "../helpers/utils";
import * as Toaster from "../helpers/toaster";
import Config from "../helpers/config";
import { t, tx } from "../i18n";

const enum PathPostfix {
  FILE = "",
  FOLDER = "/**",
  FOLDER_NORECURSE = "/*",
}

interface FilterPickerButtonProps {
  text: string;
  onConfirm: (path: string) => void;
}

export default function filterPickerButton({ text, onConfirm }: FilterPickerButtonProps) {
  const onFilePicked = (path: string, postfix: PathPostfix) => {
    const fullPath = path + postfix;

    if (!path.startsWith(Config.get("sync_root"))) {
      Toaster.toast(t("toast.pathNotInSyncRoot"));
    } else if (path === "/") {
      confirmPopup(
        <b>{t("filePicker.rootTitle")}</b>,
        <span>
          {tx("filePicker.rootText", { warning: <b>{t("filePicker.rootWarning")}</b> })}<br /><br />
          {t("filePicker.rootConfirm")}
        </span>,
        () => onConfirm(fullPath)
      );
    } else {
      test_syncpath(fullPath).then(e => confirmPopup(
        text,
        <span>
          {tx("filePicker.matches", { path: <i>{fullPath}</i>, count: <b>{e >= 0 ? e : t("filePicker.tooMany")}</b> })}<br /><br />
          {t("common.confirmToContinue")}
        </span>,
        () => onConfirm("/" + reduceSlashes(fullPath.slice(Config.get("sync_root").length)))
      ))
    }
  };

  return (
    <DialogButton
      onClick={() => showContextMenu(
        <Menu label={t("filePicker.filterType")}>
          <MenuItem
            onSelected={() =>
              openFilePicker(FileSelectionType.FILE, Config.get("sync_root"), true)
                .then(e => onFilePicked(e.path, PathPostfix.FILE))
            }
          >
            {t("filePicker.file")}
          </MenuItem>
          <MenuItem
            onSelected={() =>
              openFilePicker(FileSelectionType.FOLDER, Config.get("sync_root"), false)
                .then((e) => onFilePicked(e.path, PathPostfix.FOLDER))
            }
          >
            {t("filePicker.folder")}
          </MenuItem>
          <MenuItem
            onSelected={() =>
              openFilePicker(FileSelectionType.FOLDER, Config.get("sync_root"), false)
                .then((e) => onFilePicked(e.path, PathPostfix.FOLDER_NORECURSE))
            }
          >
            {t("filePicker.folderNoRecurse")}
          </MenuItem>
        </Menu>
      )}
    >
      {text}
    </DialogButton>
  );
}
