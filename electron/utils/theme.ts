import { getRegistryValue } from './winreg';
export async function checkThemeChange() {
  try {
    const appsTheme = await getRegistryValue(
      '\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
      'AppsUseLightTheme'
    );
    const systemTheme = await getRegistryValue(
      '\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize',
      'SystemUsesLightTheme'
    );
    console.log('appsTheme', appsTheme);
    console.log('systemTheme', systemTheme);

    return appsTheme === 0 || systemTheme === 0;
  } catch (error) {
    console.error('Error checking theme:', error);
  }
}
