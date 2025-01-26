import { ref } from 'vue';
import { diffusionAnimation } from './animate';

export function useDarkMode(dark = false) {
  let isDark = ref(dark);
  async function toggleTheme(e: MouseEvent) {
    diffusionAnimation(e, async () => {
      isDark.value = await window.electron.ipcRenderer.invoke<boolean>(
        'APP:DARK_MODE_TOGGLE'
      );
    });
  }

  window.electron.ipcRenderer.invoke<boolean>('APP:IS_DARK').then(val => {
    isDark.value = val;
  });
  return { value: isDark, toggleTheme };
}

export const darkMode = useDarkMode();
