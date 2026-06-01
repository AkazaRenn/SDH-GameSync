import { PropsWithChildren } from "react";
import { CSS_BPM_BOTTOM_BAR_HEIGHT, CSS_BPM_TOP_BAR_HEIGHT } from "../helpers/commonDefs";

interface ContainerProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actionItems?: React.ReactNode;
}

export default function container({ title, description, actionItems, children }: PropsWithChildren<ContainerProps>) {
  return (
    <>
      {title && <h1 style={{
        marginTop: CSS_BPM_TOP_BAR_HEIGHT,
        marginLeft: "8px",
      }}>
        {title}
      </h1>}
      {description && <div style={{
        marginTop: "-6px",
        marginBottom: "10px",
        opacity: "75%",
        fontSize: "0.9em",
      }}>
        {description}
      </div>}
      {children}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        position: "fixed",
        bottom: `calc(${CSS_BPM_BOTTOM_BAR_HEIGHT} + 4px)`,
        right: "4px",
      }}>
        {actionItems}
      </div>
    </>
  )
}
