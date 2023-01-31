import dayjs from 'dayjs';

export function formatDate(date?: number, separator = '-') {
  if (date === undefined) {
    return;
  }
  debugger;

  return dayjs(date).format(`YYYY${separator}MM${separator}DD`);
}

export function formatDuring(mms?: number) {
  if (mms === undefined) {
    return;
  }
  return dayjs(mms).format('mm:ss');
}
