interface ShowParams {
  x: number;
  y: number;
  items?: any[];
  onSelect?: (item: any, index: number) => void;
}
export class ContextMenu {
  private static instance: ContextMenu | null = null;
  private menu: HTMLElement;
  private items: any[] = [];
  private onSelect: (item: any, index: number) => void = () => {};
  private root: HTMLElement;
  private shadow: ShadowRoot;
  private cachedItemsString: string = ''; // 缓存序列化的菜单项

  private constructor() {
    this.root = document.createElement('div');
    this.shadow = this.root.attachShadow({ mode: 'open' });

    // 创建样式
    const style = document.createElement('style');
    style.textContent = `
 .context-menu {
  position: absolute;
  background-color: var(--bg-color);
  border: 1px solid var(--player-border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 5px 0;
  min-width: 160px;
  z-index: 9999;
  display: none;
  font-family: Arial, sans-serif;
  font-size: 14px;
  box-sizing: border-box;
}
.divider {
  height: 1px;
  background-color: var(--bg-color);
  margin: 5px 0;
}
.context-menu-item {
  padding: 8px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}
.context-menu-item:hover {
  background-color: var(--playlist-item-hover-color);
}
    `;
    this.shadow.appendChild(style);

    // 创建菜单容器
    this.menu = document.createElement('div');
    this.menu.className = 'context-menu';
    this.shadow.appendChild(this.menu);
    document.body.appendChild(this.root);

    this.bindEvents();
  }

  static getInstance(): ContextMenu {
    if (!ContextMenu.instance) {
      ContextMenu.instance = new ContextMenu();
    }
    return ContextMenu.instance;
  }

  private bindEvents() {
    // 点击其他地方隐藏菜单
    document.addEventListener(
      'click',
      () => {
        this.hide();
      },
      { capture: true }
    );

    // 窗口大小改变时隐藏菜单
    window.addEventListener('resize', () => {
      this.hide();
    });

    // 阻止菜单内部点击事件冒泡
    this.menu.addEventListener('click', e => {
      e.stopPropagation();
    });
  }

  private adjustPosition(x: number, y: number): { x: number; y: number } {
    // 确保菜单渲染以获取实际尺寸
    this.menu.style.visibility = 'hidden';
    this.menu.style.display = 'block';

    // 获取菜单实际尺寸
    const menuRect = this.menu.getBoundingClientRect();
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;

    // 获取视窗尺寸
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 获取滚动位置
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // 计算调整后的位置
    let adjustedX = x;
    let adjustedY = y;

    // 右边界检查
    if (x + menuWidth > viewportWidth + scrollX) {
      adjustedX = viewportWidth + scrollX - menuWidth - 5; // 5px 边距
    }

    // 下边界检查
    if (y + menuHeight > viewportHeight + scrollY) {
      adjustedY = viewportHeight + scrollY - menuHeight - 5; // 5px 边距
    }

    // 左边界检查（确保不超出左侧）
    if (adjustedX < scrollX) {
      adjustedX = scrollX + 5; // 5px 边距
    }

    // 上边界检查（确保不超出顶部）
    if (adjustedY < scrollY) {
      adjustedY = scrollY + 5; // 5px 边距
    }

    // 恢复显示状态
    this.menu.style.visibility = 'visible';

    return { x: adjustedX, y: adjustedY };
  }

  show({ x, y, items, onSelect }: ShowParams) {
    if (items) {
      this.setItems(items);
    }
    if (onSelect) {
      this.onSelect = onSelect;
    }

    // 调整位置确保不超出边界
    const adjustedPosition = this.adjustPosition(x, y);

    this.menu.style.left = adjustedPosition.x + 'px';
    this.menu.style.top = adjustedPosition.y + 'px';
    this.menu.style.display = 'block';
  }

  hide() {
    this.menu.style.display = 'none';
  }

  private renderItems() {
    // 清空菜单
    this.menu.innerHTML = '';

    // 渲染新项目
    const fragment = document.createDocumentFragment();
    this.items.forEach((item, index) => {
      if (item.type === 'divider') {
        const divider = document.createElement('div');
        divider.classList.add('divider');
        fragment.appendChild(divider);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.textContent = item.label;

        menuItem.addEventListener('click', e => {
          e.stopPropagation();
          this.hide();
          if (item.action) {
            item.action();
          }
          this.onSelect(item, index);
        });

        fragment.appendChild(menuItem);
      }
    });
    this.menu.appendChild(fragment);
  }

  setItems(items: any[]) {
    // 序列化新项目以进行比较
    const newItemsString = JSON.stringify(items);

    // 只有当菜单项真正发生变化时才重新渲染
    if (newItemsString !== this.cachedItemsString) {
      this.items = items;
      this.cachedItemsString = newItemsString;
      this.renderItems();
    } else {
      // 即使项目没有变化，也要更新引用（以防外部修改了数组内容）
      this.items = items;
    }
  }

  setOnSelect(callback: (item: any, index: number) => void) {
    this.onSelect = callback;
  }

  // 获取菜单尺寸（用于外部计算）
  getMenuSize(): { width: number; height: number } {
    this.menu.style.visibility = 'hidden';
    this.menu.style.display = 'block';
    const rect = this.menu.getBoundingClientRect();
    this.menu.style.display = 'none';
    this.menu.style.visibility = 'visible';
    return {
      width: rect.width,
      height: rect.height,
    };
  }

  // 销毁实例（可选）
  destroy() {
    if (this.root.parentNode) {
      this.root.parentNode.removeChild(this.root);
    }
    ContextMenu.instance = null;
  }

  // 获取当前菜单项
  getItems(): any[] {
    return this.items;
  }

  // 检查菜单项是否为空
  isEmpty(): boolean {
    return this.items.length === 0;
  }
}
