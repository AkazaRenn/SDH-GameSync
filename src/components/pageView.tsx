import { CSSProperties, PropsWithChildren, ReactNode } from "react";
import { CSS_MAX_VIEWABLE_HEIGHT } from "../helpers/commonDefs";
import Container from "./container";

interface pageViewProps {
  title: string;
  description?: ReactNode;
  titleItem?: React.ReactNode;
  fullPage: boolean;
}

export default function pageView({ title, description, titleItem, fullPage = true, children }: PropsWithChildren<pageViewProps>) {
  const baseStyles: CSSProperties  = {
    height: "100%",
    maxHeight: CSS_MAX_VIEWABLE_HEIGHT,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  };

  const styles: CSSProperties= fullPage
    ? {
      ...baseStyles,
      margin: "40px 0",
    }
    : {
      ...baseStyles,
      width: "100%",
      marginTop: "-24px",
      marginLeft: "-24px",
      position: "fixed",
    };

  const HeadingTag = fullPage ? 'h1' : 'h2';

  const headingTagStyles: CSSProperties = {
    margin: "0",
    minHeight: "28px",
    alignContent: "center",
  };

  return (
    <div style={styles}>
      <Container
        title={
          <HeadingTag
            style={headingTagStyles}>
            {title}
          </HeadingTag>}
        description={description}
        titleItem={titleItem}
      >
        {children}
      </Container>
    </div>
  );
}
