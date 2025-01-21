import Registry from 'winreg';
export function getRegistryValue(keyPath, valueName) {
  return new Promise((resolve, reject) => {
    const regKey = new Registry({ hive: Registry.HKCU, key: keyPath });
    regKey.get(valueName, (err, item) => {
      if (err) return reject(err);
      resolve(item && item.value);
    });
  });
}
