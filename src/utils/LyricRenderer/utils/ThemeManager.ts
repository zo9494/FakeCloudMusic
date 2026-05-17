import type { FontStyle } from '../interface';

export const darkModeStyle: FontStyle = {
  fontSize: 28,
  fontWeight: 'bold',
  normal: {
    color: 0xffffff,
    alpha: 0.5,
  },
  highlight: {
    color: 0xffffff,
    alpha: 1,
  },
};

export const lightModeStyle: FontStyle = {
  fontSize: 28,
  fontWeight: 'bold',
  normal: {
    color: 0x000000,
    alpha: 0.5,
  },
  highlight: {
    color: 0x000000,
    alpha: 1,
  },
};

/**
 * 创建系统主题监听，回调传入 `isDark` 布尔值
 * @returns 取消监听的函数
 */
export function createThemeListener(
  callback: (isDark: boolean) => void,
): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches);
  };

  callback(mediaQuery.matches);
  mediaQuery.addEventListener('change', handleChange);

  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}

/**
 * 根据是否为暗色模式返回对应字体样式
 */
export function getStyleForTheme(isDark: boolean): FontStyle {
  return isDark ? darkModeStyle : lightModeStyle;
}