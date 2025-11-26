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

interface FiltersViewProps {
  title: string;
  description?: ReactNode;
  fullPage: boolean;
  getFiltersFunction: () => Promise<Array<string>>;
  setFiltersFunction: (filters: Array<string>) => Promise<void>;
}

export default function filtersView({ title, description, fullPage = false, getFiltersFunction, setFiltersFunction: setFiltersFunction, children }: PropsWithChildren<FiltersViewProps>) {
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
      title={title}
      description={description}
      fullPage={fullPage}
      titleItem={children}
    >
      <div style={{
        overflowY: "scroll",
        overflowX: "hidden",
      }}>
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
                    onOKActionDescription="Copy"
                    onClick={() => {
                      Clipboard.copy(String(props.entry.label));
                      Toaster.toast("Copied to clipboard");
                    }}
                  />
                  <IconButton
                    icon={FaPen}
                    onOKActionDescription="Edit"
                    onClick={() => textInputPopup("Edit Filter",
                      String(props.entry.label),
                      (value) => filterEntriesEdit(props.entry.position, value)
                    )}
                  />
                </>)}
                <IconButton
                  icon={MdDelete}
                  onOKActionDescription="Remove"
                  onClick={() => filterEntriesRemove(props.entry.position)}
                />
              </Row>
            </div>
          }
        />
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          paddingTop: "8px",
          paddingBottom: "20px",
        }}
        >
          <Row>
            <FilterPickerButton
              text="Add Include Filter"
              onConfirm={(path: string) => filterEntriesAppend(`+ ${path}`)}
            />
            <FilterPickerButton
              text="Add Exclude Filter"
              onConfirm={(path: string) => filterEntriesAppend(`- ${path}`)}
            />
          </Row>
          {showAdvancedOptions && (
            <>
              <Row>
                <DialogButton
                  onClick={() => {
                    Clipboard.copy(filterEntriesToArray().join('\n'));
                    Toaster.toast("Filters copied to clipboard")
                  }}
                >
                  Copy Whole Filter
                </DialogButton>
                <DialogButton
                  onClick={() => {
                    const text = Clipboard.paste().trim();
                    if (text) {
                      filterEntriesAppend(text);
                      Toaster.toast("Filters pasted from clipboard");
                    } else {
                      Toaster.toast("Clipboard is empty");
                    }
                  }}
                >
                  Paste Filter (Append)
                </DialogButton>
                <DialogButton
                  onClick={() => {
                    const text = Clipboard.paste().trim();
                    if (text) {
                      filterEntriesfromString(text);
                      Toaster.toast("Filters pasted from clipboard");
                    } else {
                      Toaster.toast("Clipboard is empty");
                    }
                  }}
                >
                  Paste Filter (Replace)
                </DialogButton>
              </Row>
              <Row>
                <DialogButton
                  onClick={() => textInputPopup(
                    "Add Arbitrary String",
                    "",
                    (value: string) => filterEntriesAppend(`${value}`)
                  )}
                >
                  Add Arbitrary Line
                </DialogButton>
                <DialogButton
                  onClick={() => setFilterEntries([])}
                >
                  Delete All
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
              Save
            </DialogButton>
          </Row>
        </div>
      </div>
    </PageView>
  )
}