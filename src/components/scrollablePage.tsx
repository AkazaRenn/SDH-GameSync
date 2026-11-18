import { PropsWithChildren, ReactNode } from "react";
import { CSS_BPM_TOP_BAR_HEIGHT, CSS_BPM_BOTTOM_BAR_HEIGHT } from "../helpers/commonDefs";

interface ScrollablePageProps {
  title: ReactNode;
}

// Full-screen route only. Sidebar pages and the Quick Access panel own their layout.
export default function ScrollablePage({ title, children }: PropsWithChildren<ScrollablePageProps>) {
  return (
    <div style={{
      position: "fixed",
      top: CSS_BPM_TOP_BAR_HEIGHT,
      bottom: CSS_BPM_BOTTOM_BAR_HEIGHT,
      left: 0,
      right: 0,
      display: "flex",
      flexDirection: "column",
      minHeight: 0,
      boxSizing: "border-box",
      padding: "8px 16px",
    }}>
      <h1 style={{
        margin: 0,
        flexShrink: 0,
        paddingBottom: "8px",
        overflowWrap: "anywhere",
      }}>
        {title}
      </h1>
      <div style={{
        flex: "1 1 auto",
        minHeight: 0,
        overflowY: "auto",
        overflowX: "hidden",
        scrollPaddingBlock: "8px",
        paddingBottom: "16px",
      }} onFocusCapture={(event) => {
        // Keep keyboard-focused controls inside this scrollport, not behind Steam's footer.
        event.target.scrollIntoView({ block: "nearest", inline: "nearest" });
      }}>
        {children}
      </div>
    </div>
  );
}
