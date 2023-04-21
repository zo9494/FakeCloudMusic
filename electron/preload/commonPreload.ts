import { ipcRenderer } from 'electron';

export function invoke(channel: string, ...args: any) {
  return ipcRenderer.invoke(channel, ...args);
}

export function on(
  channel: string,
  listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void,
  ...args: any[]
) {
  return ipcRenderer.on(channel, listener, ...(args as []));
}
