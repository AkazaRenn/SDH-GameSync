declare global {
  interface Window {
    NotificationStore: any;
    settingsStore: {
      m_ClientSettings: {
        gamerecording_background_path: string;
      }
    };
    g_GRS: {
      m_clips: Map<string, any>;
    };
  }

  type UnregisterFunction = () => void;

  interface Unregisterable {
    unregister: UnregisterFunction;
  }
}

export {};
