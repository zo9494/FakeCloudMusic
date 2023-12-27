import { BrowserWindow } from 'electron';
export const window = {
  close(id) {
    const win = BrowserWindow.fromId(id);
    win.close();
  },
};
