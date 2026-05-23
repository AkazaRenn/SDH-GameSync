import { EResult } from "@decky/ui";

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
      DeleteClip(clip_id: string): Promise<EResult>;
      ExportClip(
        clip_id: string,
        export_mp4_path: string,
        settings: {}, // unused
        use_unique_filename: boolean,
      ): Promise<EResult>;
    };
  }

  type UnregisterFunction = () => void;

  interface Unregisterable {
    unregister: UnregisterFunction;
  }
}

export {};
