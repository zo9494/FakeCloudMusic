import { contextBridge, ipcRenderer } from 'electron';
import { EVENT } from '../utils/eventTypes';
const window = {
  createLoginWin() {
    return ipcRenderer.invoke(EVENT.LOGIN);
  },
  closeLoginWin() {
    console.log('close');
    return ipcRenderer.invoke(EVENT.LOGIN_CLOSE);
  },
};
contextBridge.exposeInMainWorld('electron', {
  window,
});
