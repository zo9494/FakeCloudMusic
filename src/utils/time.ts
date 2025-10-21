import dayjs from 'dayjs';

export function formatDate(date?: number, separator = '-') {
  if (date === undefined) {
    return;
  }
  return dayjs(date).format(`YYYY${separator}MM${separator}DD`);
}

export function formatDuring(mms?: number) {
  if (mms === undefined) {
    return;
  }
  return dayjs(mms).format('mm:ss');
}

/**
 * 将毫秒数转换为 MM:SS 形式
 * @param milliseconds 毫秒
 *
 */
export function formatMillisecondsToMMSS(milliseconds = 0): string {
  // 将毫秒转换为秒，并向下取整得到总秒数
  const totalSeconds = Math.floor(milliseconds / 1000);

  // 计算分钟数（向下取整）
  const minutes = Math.floor(totalSeconds / 60);
  // 计算剩余的秒数
  const seconds = totalSeconds % 60;

  // 使用 padStart 方法确保分钟和秒数都是两位数，不足两位前面补 '0'
  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

/**
 * 将秒数转换为 MM:SS 格式
 * @param seconds 秒
 *
 */
export function formatSecondsToMMSS(seconds = 0): string {
  // 确保输入的秒数是整数（向下取整）
  const totalSeconds = Math.floor(seconds);

  // 计算分钟数（向下取整）
  const minutes = Math.floor(totalSeconds / 60);
  // 计算剩余的秒数
  const remainingSeconds = totalSeconds % 60;

  // 使用 padStart 方法确保分钟和秒数都是两位数，不足两位前面补 '0'
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}
