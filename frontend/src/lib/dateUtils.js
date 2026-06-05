export function parseDate(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();

  const dmY = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (dmY) {
    const date = new Date(
      Number(dmY[3]),
      Number(dmY[2]) - 1,
      Number(dmY[1]),
      Number(dmY[4] || 0),
      Number(dmY[5] || 0),
    );
    return isNaN(date.getTime()) ? null : date;
  }

  const ymd = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const date = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
    return isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(text);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value, fallback = '-') {
  const date = parseDate(value);
  if (!date) return fallback;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export function formatDateTime(value, fallback = '-') {
  const date = parseDate(value);
  if (!date) return fallback;

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${formatDate(date)} ${hours}:${minutes}`;
}

export function formatTimelineDate(value, fallback = '-') {
  const date = parseDate(value);
  if (!date) return fallback;

  if (date.getHours() === 0 && date.getMinutes() === 0) {
    return formatDate(date);
  }

  return formatDateTime(date);
}

export function toIsoDate(value) {
  const date = parseDate(value);
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatMonthLabel(isoDate) {
  const date = parseDate(isoDate);
  if (!date) return isoDate;

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${month}/${year}`;
}
