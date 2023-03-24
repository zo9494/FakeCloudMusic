import * as Electron from 'electron';

/**
 * Should match main/preload.ts for typescript support in renderer
 */

interface window {
  close: (value?: boolean) => Promise<any>;
  resizable: () => Promise<boolean>;
  minimize: () => Promise<any>;
  createLoginWin: () => Promise<any>;
  closeLoginWin: () => Promise<any>;
  minimizeToTray: () => void;
  setTitle: (title: string) => void;
  beforeClose: (cb: () => void) => void;
  show: () => void;
  maximizeChange: (cb: (val: boolean) => void) => void;
}

export default interface ElectronApi {
  // ipcRenderer: Electron.IpcRenderer;
  window: window;
  reloadUser: () => void;
}

declare global {
  interface Window {
    electron: ElectronApi;
    loadUser: () => void;
    getCookie: () => string | null;
    [propName: any]: any;
  }
}
