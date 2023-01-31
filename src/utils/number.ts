export function formatNumber(num?: number) {
  if (num === undefined) {
    return 0;
  }
  const T = 10000;
  if (num < T) {
    return num;
  }
  // 亿
  const K = 100000000;
  if (num >= K) {
    return `${Math.floor(num / K)}亿`;
  } else {
    return `${Math.floor(num / T)}万`;
  }
}
