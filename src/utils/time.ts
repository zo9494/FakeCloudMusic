import dayjs from 'dayjs';

export function formatDate(date?: number, separator = '-') {
  return dayjs(date).format(`YYYY${separator}MM${separator}DD`);
}

export function formatDuring(mms?: number) {
  return dayjs(mms).format('mm:ss');
}
