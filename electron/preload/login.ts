import { contextBridge, ipcRenderer } from 'electron';
import { EVENT } from '../utils/eventTypes';
import { on, invoke } from './commonPreload';

contextBridge.exposeInMainWorld('electron', {
  // window: {
  //   createLoginWin() {
  //     return ipcRenderer.invoke(EVENT.LOGIN);
  //   },
  //   closeLoginWin() {
  //     console.log('close');
  //     return ipcRenderer.invoke(EVENT.LOGIN_CLOSE);
  //   },
  // },
  ipcRenderer: {
    invoke,
    on,
  },
  reloadUser() {
    return ipcRenderer.invoke(EVENT.RELOAD_USER);
  },
});
