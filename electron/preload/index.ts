import { contextBridge, ipcRenderer } from 'electron';
import './Loading';
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
    ipcRenderer.on(EVENT.maximize, (e, val) => {
      cb(val);
    });
  },
};
contextBridge.exposeInMainWorld('electron', {
  window,
});
