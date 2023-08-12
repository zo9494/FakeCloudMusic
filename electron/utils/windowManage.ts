import type { BrowserWindow } from 'electron';
export class WindowManage {
  private windows: Map<number, BrowserWindow>;
  constructor() {
    this.windows = new Map();
  }
  add(window: BrowserWindow) {
    const { id } = window;
    this.windows.set(id, window);
  }
}
