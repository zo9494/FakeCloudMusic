import { BrowserWindow } from 'electron';
export class WindowManage {
  private windows: Map<number, BrowserWindow>;
  constructor() {
    this.windows = new Map();
  }
  createWindow(options?: Electron.BrowserWindowConstructorOptions) {
    return new BrowserWindow(options);
  }
  add(window: BrowserWindow) {
    const { id } = window;
    this.windows.set(id, window);
  }
  getWindow(id: number) {
    return BrowserWindow.fromId(id);
  }
}
