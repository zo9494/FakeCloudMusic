import { contextBridge, ipcRenderer } from 'electron';
import { EVENT } from '../utils/eventTypes';

contextBridge.exposeInMainWorld('electron', {
  window: {
    createLoginWin() {
      return ipcRenderer.invoke(EVENT.LOGIN);
    },
    closeLoginWin() {
      console.log('close');
      return ipcRenderer.invoke(EVENT.LOGIN_CLOSE);
    },
  },
  reloadUser() {
    return ipcRenderer.invoke(EVENT.RELOAD_USER);
  },
});
