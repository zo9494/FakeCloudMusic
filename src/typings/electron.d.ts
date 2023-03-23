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
  beforeClose: (cb: () => void) => void;
  minimizeToTray: () => void;
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
