import { PropsWithChildren } from "react";
import { CSS_BPM_BOTTOM_BAR_HEIGHT, CSS_BPM_TOP_BAR_HEIGHT } from "../helpers/commonDefs";
import Row from "./row";

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
      <div style={{
        display: "flex",
        gap: "4px",
        position: "absolute",
        top: `calc(${CSS_BPM_TOP_BAR_HEIGHT} + 24px)`,
        right: "32px",
      }}>
        <Row>
          {actionItems}
        </Row>
      </div>
      {children}
    </>
  )
}
