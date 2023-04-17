import { contextBridge, ipcRenderer } from 'electron';
import './loading';
import { EVENT } from '../utils/eventTypes';
const window = {
  close(value: boolean) {
    return ipcRenderer.invoke(EVENT.WINDOW_CLOSE, value);
  },
  resizable() {
    return ipcRenderer.invoke(EVENT.WINDOW_RESIZ);
  },
  minimize() {
    return ipcRenderer.invoke(EVENT.WINDOW_MIN);
  },
  createLoginWin() {
    return ipcRenderer.invoke(EVENT.LOGIN);
  },
  closeLoginWin() {
    return ipcRenderer.invoke(EVENT.LOGIN_CLOSE);
  },
  minimizeToTray() {
    return ipcRenderer.invoke(EVENT.MINIMIZE_TO_TRAY);
  },
  setTitle(title?: string) {
    return ipcRenderer.invoke(EVENT.SET_TITLE, title);
  },
  beforeClose(cb: () => void) {
    ipcRenderer.on(EVENT.BEFORE_CLOSE, cb);
  },
  show() {
    return ipcRenderer.invoke(EVENT.WINDOW_SHOW);
  },
  maximizeChange(cb: (val: boolean) => void) {
    ipcRenderer.on(EVENT.MAXIMIZE, (e, val) => {
      cb(val);
    });
  },
};

contextBridge.exposeInMainWorld('electron', {
  window,
  ipcRenderer: {
    invoke(channel: string, ...args: any) {
      return ipcRenderer.invoke(channel, ...args);
    },
    on(
      channel: string,
      listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void,
      ...args: any[]
    ) {
      return ipcRenderer.on(channel, listener, ...(args as []));
    },
  },
});
