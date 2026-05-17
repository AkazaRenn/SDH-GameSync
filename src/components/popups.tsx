import { ReactNode } from "react";
import { ConfirmModal, showModal, TextField } from "@decky/ui";

type textInputData = {
  value: string;
  set: (value: string) => void;
};

export function textInputPopup(title: ReactNode, data: textInputData) {
  let draft = data.value;

  showModal(
    <ConfirmModal
      strTitle={title}
      onOK={() => data.set(draft)}>
      <TextField
        defaultValue={draft}
        onBlur={(e) => {
          draft = e.target.value;
        }} />
    </ConfirmModal>
  );
}

export function multipleTextInputsPopup(title: ReactNode, data: Record<string, textInputData>) {
  const draft: Record<string, string> = Object.fromEntries(
    Object.entries(data).map(([label, textData]) => [label, textData.value])
  );

  showModal(
    <ConfirmModal
      strTitle={title}
      onOK={() => {
        for (const [label, text] of Object.entries(draft)) {
          data[label]?.set(text);
        }
      }}>
      {Object.keys(data).map((label) => (
        <TextField
          label={label}
          defaultValue={draft[label]}
          onBlur={(e: any) => {
            draft[label] = e.target.value;
          }}
        />
      ))}
    </ConfirmModal>
  );
}

export function confirmPopup(title: ReactNode, text: ReactNode, onOK?: () => void, okText?: string, cancelText?: string) {
  showModal(
    <ConfirmModal
      strTitle={title}
      strDescription={text}
      onOK={onOK}
      strOKButtonText={okText}
      strCancelButtonText={cancelText}
    />)
}