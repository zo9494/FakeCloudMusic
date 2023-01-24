import * as Electron from 'electron';

/**
 * Should match main/preload.ts for typescript support in renderer
 */

interface window {
  close: () => void;
  resizable: () => Promise<boolean>;
  minimize: () => void;
  createLoginWin: () => void;
  closeLoginWin: () => void;
}

export default interface ElectronApi {
  ipcRenderer: Electron.IpcRenderer;
  window: window;
}

declare global {
  interface Window {
    electron: ElectronApi;
  }
}
