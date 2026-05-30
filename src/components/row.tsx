import { Focusable } from "@decky/ui";
import { PropsWithChildren } from "react";

export default function row({ children }: PropsWithChildren) {
  return (
      <Focusable
        style={{
          display: "flex",
        }}
        children={
          <div
            style={{
              display: "flex",
              gap: "4px",
              width: "100%",
            }}>
            {children}
          </div>} />
  )
}
