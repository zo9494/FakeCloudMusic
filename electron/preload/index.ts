import { contextBridge, ipcRenderer } from 'electron'
import "./Loading"
import { EVENT } from '../utils/eventTypes';

const window = {
  close() {
    return ipcRenderer.invoke(EVENT.WINDOW_CLOSE)
  },
  resizable() {
    return ipcRenderer.invoke(EVENT.WINDOW_RESIZ)
  },
  minimize() {
    return ipcRenderer.invoke(EVENT.WINDOW_MIN)
  }

}
contextBridge.exposeInMainWorld('electron', {
  window
})