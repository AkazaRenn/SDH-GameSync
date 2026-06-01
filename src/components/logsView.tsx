import { useEffect, useState, useRef, PropsWithChildren } from "react";
import { IoMdRefresh } from "react-icons/io";
import PageView from "./pageView";
import IconButton from "./iconButton";

interface LogsViewProps {
  title?: string;
  getLog: () => Promise<string>;
}

export default function LogsView({ title, getLog, children }: PropsWithChildren<LogsViewProps>) {
  const [logContent, setLogContent] = useState('');
  const logPreRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    getLog().then(setLogContent);
  }, []);

  useEffect(() => {
    logPreRef.current?.scrollTo({
      top: logPreRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [logContent]);

  return (
    <PageView
      title={title}
      actionItems={<>
        {children}
        <IconButton
          icon={IoMdRefresh}
          onOKActionDescription="Refresh logs"
          onClick={() => getLog().then(e => setLogContent(e))}
        />
      </>}
    >
      <pre
        ref={logPreRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1em',
          overflowY: 'scroll',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: "smaller",
          lineHeight: "1.2em",
          maxHeight: "75vh",
          margin: "0",
          paddingLeft: "8px",
          paddingRight: "8px",
        }}>
        {logContent}
      </pre>
    </PageView>
  );
}
