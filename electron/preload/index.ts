import { contextBridge, ipcRenderer } from 'electron';
import './loading';

function invoke(channel: string, ...args: any) {
  return ipcRenderer.invoke(channel, ...args);
}
function on(
  channel: string,
  listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void,
  ...args: any[]
) {
  return ipcRenderer.on(channel, listener, ...(args as []));
}

contextBridge.exposeInMainWorld('electron', {
  // window,
  ipcRenderer: {
    invoke,
    on,
  },
});
