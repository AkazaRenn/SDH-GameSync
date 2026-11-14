import { PropsWithChildren, ReactNode, useEffect, useRef, useState } from "react";
import { FaCopy, FaPen } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { DialogButton, ReorderableEntry, ReorderableList } from "@decky/ui";
import { CSS_STEAM_HIGHLIGHT_COLOR } from "../helpers/commonDefs";
import { textInputPopup } from "./popups";
import * as Toaster from "../helpers/toaster";
import * as Clipboard from "../helpers/clipboard";
import PageView from "./pageView";
import FilterPickerButton from "./filePickerButton";
import Config from "../helpers/config";
import Row from "./row";
import IconButton from "./iconButton";
import { t } from "../i18n";

interface FiltersViewProps {
  description?: ReactNode;
  getFiltersFunction: () => Promise<Array<string>>;
  setFiltersFunction: (filters: Array<string>) => Promise<void>;
}

export default function filtersView({ description, getFiltersFunction, setFiltersFunction: setFiltersFunction, children }: PropsWithChildren<FiltersViewProps>) {
  const saveButtonRef = useRef<HTMLDivElement>(null);

  const [filterEntries, setFilterEntries] = useState<Array<ReorderableEntry<void>>>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(Config.get("advanced_mode"));

  useEffect(() => {
    getFiltersFunction().then(filterEntriesFromArray);
    const registrations: Array<Unregisterable> = [];
    registrations.push(Config.on("advanced_mode", setShowAdvancedOptions));
    return () => {
      registrations.forEach(e => e.unregister());
    }
  }, []);

  const filterEntriesToArray = (): Array<string> => {
    return filterEntries
      .sort((a, b) => a.position - b.position)
      .map((e) => String(e.label));
  }

  const filterEntriesfromString = (text: string): void => {
    filterEntriesFromArray(text.split('\n'));
  }

  const filterEntriesFromArray = (arr: Array<string>): void => {
    setFilterEntries(arr.map((value, index) => ({
      label: value,
      position: index,
    })));
  }

  const filterEntriesAppend = (text: string): void => {
    setFilterEntries(filterEntries.concat(
      text.split('\n').map((value, index) => ({
        label: value,
        position: index + filterEntries.length,
      })
      )));
  }

  const filterEntriesRemove = (position: number): void => {
    setFilterEntries(filterEntries
      .filter((entry) => entry.position != position)
      .map((entry) => ({
        ...entry,
        position: entry.position > position ? entry.position - 1 : entry.position
      }))
    );
  }

  const filterEntriesEdit = (position: number, value: string): void => {
    setFilterEntries(filterEntries.map((entry) => {
      if (entry.position == position) {
        return {
          ...entry,
          label: value,
        };
      }
      return entry;
    }));
  }

  return (
    <PageView
      description={description}
      actionItems={children}
    >
      <ReorderableList
        onSave={setFilterEntries}
        entries={filterEntries}
        interactables={(props: { entry: ReorderableEntry<void> }) =>
          <div style={{
            height: "28px",
          }}>
            <Row>
              {showAdvancedOptions && (<>
                <IconButton
                  icon={FaCopy}
                  onOKActionDescription={t("filters.copy")}
                  onClick={() => {
                    Clipboard.copy(String(props.entry.label));
                    Toaster.toast(t("toast.copied"));
                  }}
                />
                <IconButton
                  icon={FaPen}
                  onOKActionDescription={t("filters.edit")}
                  onClick={() => textInputPopup(t("filters.editTitle"), {
                    value: String(props.entry.label),
                    set: (value) => filterEntriesEdit(props.entry.position, value),
                  }
                  )}
                />
              </>)}
              <IconButton
                icon={MdDelete}
                onOKActionDescription={t("filters.remove")}
                onClick={() => filterEntriesRemove(props.entry.position)}
              />
            </Row>
          </div>
        }
      />
      <div style={{
        display: "flex",
        flexDirection: "column",
        paddingTop: "8px",
        paddingBottom: "20px",
        gap: "4px",
      }}>
        <Row>
          <FilterPickerButton
            text={t("filters.addInclude")}
            onConfirm={(path: string) => filterEntriesAppend(`+ ${path}`)}
          />
          <FilterPickerButton
            text={t("filters.addExclude")}
            onConfirm={(path: string) => filterEntriesAppend(`- ${path}`)}
          />
        </Row>
        {showAdvancedOptions && (
          <>
            <Row>
              <DialogButton
                onClick={() => {
                  Clipboard.copy(filterEntriesToArray().join('\n'));
                  Toaster.toast(t("toast.filtersCopied"))
                }}
              >
                {t("filters.copyAll")}
              </DialogButton>
              <DialogButton
                onClick={() => {
                  const text = Clipboard.paste().trim();
                  if (text) {
                    filterEntriesAppend(text);
                    Toaster.toast(t("toast.filtersPasted"));
                  } else {
                    Toaster.toast(t("toast.clipboardEmpty"));
                  }
                }}
              >
                {t("filters.pasteAppend")}
              </DialogButton>
              <DialogButton
                onClick={() => {
                  const text = Clipboard.paste().trim();
                  if (text) {
                    filterEntriesfromString(text);
                    Toaster.toast(t("toast.filtersPasted"));
                  } else {
                    Toaster.toast(t("toast.clipboardEmpty"));
                  }
                }}
              >
                {t("filters.pasteReplace")}
              </DialogButton>
            </Row>
            <Row>
              <DialogButton
                onClick={() => textInputPopup(
                  t("filters.addArbitraryTitle"), {
                    value: "",
                    set: (value: string) => filterEntriesAppend(`${value}`),
                  }
                )}
              >
                {t("filters.addArbitrary")}
              </DialogButton>
              <DialogButton
                onClick={() => setFilterEntries([])}
              >
                {t("filters.deleteAll")}
              </DialogButton>
            </Row>
          </>
        )}
        <Row>
          <DialogButton
            onClick={() => setFiltersFunction(filterEntriesToArray())}
            ref={saveButtonRef}
            style={{ backgroundColor: CSS_STEAM_HIGHLIGHT_COLOR }}
            onGamepadFocus={() => saveButtonRef.current && (saveButtonRef.current.style.backgroundColor = "white")}
            onGamepadBlur={() => saveButtonRef.current && (saveButtonRef.current.style.backgroundColor = CSS_STEAM_HIGHLIGHT_COLOR)}
          >
            {t("filters.save")}
          </DialogButton>
        </Row>
      </div>
    </PageView>
  )
}