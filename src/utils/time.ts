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

export function formatDuringMS(ms = 0) {
  ms = Math.ceil(ms);
  let minute: number | string = Math.floor(ms / 60);
  let second: number | string = ms % 60;
  if (minute < 10) {
    minute = `0${minute}`;
  }
  if (second < 10) {
    second = `0${second}`;
  }
  return `${minute}:${second}`;
}
