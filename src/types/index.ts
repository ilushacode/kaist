export interface GroupScheduleLesson {
  d?: string;
  t?: string;
  s?: string;
  k?: string;
  p?: string;
  a?: string;
  b?: string;
  u?: string;
  ds?: string[];
}

export interface GroupExamRaw {
  dt?: string;
  tm?: string;
  s?: string;
  k?: string;
  p?: string;
  a?: string;
  b?: string;
  l?: string;
  ds?: string | string[];
  subject?: string;
  time?: string;
  room?: string;
  building?: string;
  teacher?: string;
  dates?: string[];
}

export interface ScheduleData {
  groups: Record<string, GroupScheduleLesson[]>;
  contentHash: string | null;
  updatedAt: string | null;
}

export interface ExamsData {
  groups: Record<string, GroupExamRaw[]>;
  contentHash: string | null;
  updatedAt: string | null;
}

export interface AdRaw {
  target?: string;
  caption?: string;
  image?: string;
  link?: string;
  startDate?: string;
  endDate?: string;
}

export interface NormalizedAd {
  id: string;
  target: string;
  caption: string;
  image: string;
  link: string;
  startDate: Date | null;
  endDate: Date | null;
}

export interface AdsData {
  list: AdRaw[];
  contentHash: string | null;
  updatedAt: string | null;
}

export interface Student {
  student_id: number | string;
  student: string;
  group: string;
  leader: boolean;
}

export interface Lesson {
  time: string;
  subject: string;
  type: string;
  building: string;
  room: string;
  teacher: string;
  department: string;
  dates: string[];
}

export interface Exam {
  subject: string;
  time: string;
  room: string;
  building: string;
  teacher: string;
  dates: string[];
}

export interface TeacherEntry {
  teacher: string;
  departments: string[];
  subjects: string[];
}

export type Theme = 'auto' | 'light' | 'dark';

export type Direction = -1 | 0 | 1;