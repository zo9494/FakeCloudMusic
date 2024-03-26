import * as Electron from 'electron';
import { EVENT } from '../../electron/utils/eventTypes';
import type { MessageProviderInst } from 'naive-ui';
type channelType = `${EVENT}`;

interface IpcRenderer {
  invoke: <T>(channel: channelType, ...arg: any[]) => Promise<T>;
  on: (
    channel: channelType,
    listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void,
    ...arg: any[]
  ) => void;
}
export default interface ElectronApi {
  ipcRenderer: IpcRenderer;
}

declare global {
  interface Window {
    $message: MessageProviderInst;
    electron: ElectronApi;
    loadUser: () => void;
    [propName: any]: any;
  }
}
