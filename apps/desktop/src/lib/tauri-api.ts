import { invoke } from "@tauri-apps/api/core";

export interface AppInfo {
  version: string;
  platform: string;
  appName: string;
}

export const api = {
  system: {
    getAppInfo: () => invoke<AppInfo>("get_app_info"),
  },
};
