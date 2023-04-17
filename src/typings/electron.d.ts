import * as Electron from 'electron';
import { EVENT } from '../../electron/utils/eventTypes';
/**
 * Should match main/preload.ts for typescript support in renderer
 */
type channelType = keyof typeof EVENT;

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
interface IpcRenderer {
  invoke: (channel: channelType, ...arg: any[]) => void;
  on: (
    channel: channelType,
    listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void,
    ...arg: any[]
  ) => void;
}
export default interface ElectronApi {
  /**
   * @deprecated 将弃用该属性
   */
  window: window;
  ipcRenderer: IpcRenderer;
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
