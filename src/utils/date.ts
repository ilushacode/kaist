const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export const startOfDay = (date: Date | string | number): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const compareDay = (a: Date, b: Date): -1 | 0 | 1 => {
  const ay = a.getFullYear();
  const am = a.getMonth();
  const ad = a.getDate();
  const by = b.getFullYear();
  const bm = b.getMonth();
  const bd = b.getDate();

  if (ay !== by) return ay < by ? -1 : 1;
  if (am !== bm) return am < bm ? -1 : 1;
  if (ad !== bd) return ad < bd ? -1 : 1;
  return 0;
};

export const formatDM = (date: Date | string | number): string => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
};

export const formatISO = (date: Date | string | number): string => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const formatDayMonth = (date: Date | string | number): string => {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}`;
};

export const shiftDate = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getMondayOfWeek = (date: Date): Date => {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

export const parseTimeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

export const addMinutes = (time: string, minutesToAdd = 90): string => {
  const total = parseTimeToMinutes(time) + minutesToAdd;
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
};

export const stripLeadingZero = (time: string): string => {
  const [hours, minutes] = time.split(':');
  return `${Number(hours)}:${minutes}`;
};

export const isLessonNow = (lessonDate: Date, start: string, end: string): boolean => {
  if (!(lessonDate instanceof Date)) return false;
  const now = new Date();
  if (compareDay(lessonDate, now) !== 0) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  return current >= parseTimeToMinutes(start) && current <= parseTimeToMinutes(end);
};

export const isLessonPast = (lessonDate: Date, end: string): boolean => {
  if (!(lessonDate instanceof Date)) return false;
  const now = new Date();
  const cmp = compareDay(lessonDate, now);
  if (cmp < 0) return true;
  if (cmp > 0) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  return current > parseTimeToMinutes(end);
};

export const isPastDay = (value: string): boolean => {
  const now = new Date();
  const [day, month] = value.split('.').map(Number);
  const date = startOfDay(new Date(now.getFullYear(), month - 1, day));
  return compareDay(date, now) < 0;
};

export const isTodayDay = (value: string): boolean => {
  const now = new Date();
  const [day, month] = value.split('.').map(Number);
  const date = startOfDay(new Date(now.getFullYear(), month - 1, day));
  return compareDay(date, now) === 0;
};

export const todayStamp = (): string => formatISO(new Date());