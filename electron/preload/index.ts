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
};
contextBridge.exposeInMainWorld('electron', {
  window,
});
