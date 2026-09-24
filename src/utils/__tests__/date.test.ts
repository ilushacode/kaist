import {
  startOfDay,
  compareDay,
  formatDM,
  formatISO,
  formatDayMonth,
  shiftDate,
  getMondayOfWeek,
  parseTimeToMinutes,
  addMinutes,
  stripLeadingZero,
  isLessonNow,
  isLessonPast,
  isPastDay,
  isTodayDay,
  todayStamp,
} from '../date';

describe('startOfDay', () => {
  it('сбрасывает время до 00:00', () => {
    const d = startOfDay(new Date(2025, 5, 15, 14, 30, 45));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });
});

describe('compareDay', () => {
  it('возвращает 0 для одного дня', () => {
    expect(compareDay(new Date(2025, 0, 1), new Date(2025, 0, 1, 23, 59))).toBe(0);
  });
  it('возвращает -1 если первая раньше', () => {
    expect(compareDay(new Date(2025, 0, 1), new Date(2025, 0, 2))).toBe(-1);
  });
  it('возвращает 1 если первая позже', () => {
    expect(compareDay(new Date(2025, 0, 2), new Date(2025, 0, 1))).toBe(1);
  });
});

describe('formatDM', () => {
  it('форматирует с ведущими нулями', () => {
    expect(formatDM(new Date(2025, 0, 5))).toBe('05.01');
  });
});

describe('formatISO', () => {
  it('форматирует в YYYY-MM-DD', () => {
    expect(formatISO(new Date(2025, 8, 5))).toBe('2025-09-05');
  });
});

describe('formatDayMonth', () => {
  it('возвращает день и месяц в родительном падеже', () => {
    expect(formatDayMonth(new Date(2025, 0, 5))).toBe('5 января');
  });
});

describe('shiftDate', () => {
  it('сдвигает на дни вперёд', () => {
    const d = shiftDate(new Date(2025, 0, 1), 5);
    expect(d.getDate()).toBe(6);
  });
  it('сдвигает на дни назад', () => {
    const d = shiftDate(new Date(2025, 0, 10), -3);
    expect(d.getDate()).toBe(7);
  });
  it('сбрасывает время', () => {
    const d = shiftDate(new Date(2025, 0, 1, 12, 30), 1);
    expect(d.getHours()).toBe(0);
  });
});

describe('getMondayOfWeek', () => {
  it('для понедельника возвращает его же', () => {
    // 6 января 2025 — понедельник
    const monday = getMondayOfWeek(new Date(2025, 0, 6));
    expect(formatISO(monday)).toBe('2025-01-06');
  });
  it('для воскресенья возвращает прошедший понедельник', () => {
    const monday = getMondayOfWeek(new Date(2025, 0, 12));
    expect(formatISO(monday)).toBe('2025-01-06');
  });
  it('для среды возвращает понедельник той же недели', () => {
    const monday = getMondayOfWeek(new Date(2025, 0, 8));
    expect(formatISO(monday)).toBe('2025-01-06');
  });
});

describe('parseTimeToMinutes', () => {
  it('парсит время', () => {
    expect(parseTimeToMinutes('09:30')).toBe(570);
    expect(parseTimeToMinutes('00:00')).toBe(0);
  });
});

describe('addMinutes', () => {
  it('добавляет минуты', () => {
    expect(addMinutes('09:00', 90)).toBe('10:30');
  });
  it('по умолчанию 90 минут', () => {
    expect(addMinutes('09:00')).toBe('10:30');
  });
  it('переходит через полночь', () => {
    expect(addMinutes('23:30', 60)).toBe('0:30');
  });
});

describe('stripLeadingZero', () => {
  it('убирает ведущий ноль', () => {
    expect(stripLeadingZero('09:30')).toBe('9:30');
    expect(stripLeadingZero('10:30')).toBe('10:30');
  });
});

describe('isLessonNow', () => {
  it('false если дата не сегодня', () => {
    const past = new Date(2000, 0, 1);
    expect(isLessonNow(past, '00:00', '23:59')).toBe(false);
  });
});

describe('isLessonPast', () => {
  it('true для прошедшей даты', () => {
    expect(isLessonPast(new Date(2000, 0, 1), '10:00')).toBe(true);
  });
  it('false для будущей даты', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(isLessonPast(future, '10:00')).toBe(false);
  });
});

describe('isPastDay', () => {
  it('true для прошедшего дня', () => {
    expect(isPastDay('01.01')).toBe(true);
  });
});

describe('isTodayDay', () => {
  it('true для сегодня', () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    expect(isTodayDay(`${day}.${month}`)).toBe(true);
  });
});

describe('todayStamp', () => {
  it('возвращает YYYY-MM-DD', () => {
    expect(todayStamp()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});