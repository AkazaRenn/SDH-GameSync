import { PropsWithChildren, ReactNode } from "react";
import Container from "./container";

interface pageViewProps {
  title?: string;
  description?: ReactNode;
  actionItems?: React.ReactNode;
}

export default function pageView({ title, description, actionItems, children }: PropsWithChildren<pageViewProps>) {
  return (
    <Container
      title={title}
      description={description}
      actionItems={actionItems}
    >
      {children}
    </Container>
  );
}
