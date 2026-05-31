import { DialogFooter, DialogBodyText } from "@decky/ui";
import { PropsWithChildren } from "react";
import Row from "./row";

interface ContainerProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  titleItem?: React.ReactNode;
}

export default function container({ title, description, titleItem, children }: PropsWithChildren<ContainerProps>) {
  return (
    <>
      <div style={{
        display: "flex",
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          paddingBottom: "16px",
        }}>
          <DialogFooter>
            {title}
          </DialogFooter>
          {description && <DialogBodyText>
            {description}
          </DialogBodyText>}
        </div>
        <Row>
          {titleItem}
        </Row>
      </div>
      <div style={{
        overflowY: "auto",
      }}>
        {children}
      </div>
    </>
  )
}
