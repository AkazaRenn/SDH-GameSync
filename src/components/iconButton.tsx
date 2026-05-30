import { IconType } from "react-icons";
import { DialogButton } from "@decky/ui";

interface IconButtonProps {
  icon: IconType;
  onOKActionDescription?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export default function iconButton({ icon: Icon, onOKActionDescription, disabled, onClick }: IconButtonProps) {
  return (
    <DialogButton
      disabled={disabled}
      onOKActionDescription={onOKActionDescription}
      onClick={onClick}
      style={{
        height: "28px",
        width: "28px",
        minWidth: 0,
        padding: "10px 6px",
      }}
    >
      <Icon style={{
        marginTop: "-4px",
        display: "block",
      }} />
    </DialogButton>
  );
}
