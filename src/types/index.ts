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

export interface ApiMeta {
  contentHash?: string;
  updatedAt?: string;
  groupsCount?: number;
  itemsCount?: number;
}

export interface ScheduleResponse {
  meta?: ApiMeta;
  groups?: Record<string, GroupScheduleLesson[]>;
}

export interface ExamsResponse {
  meta?: ApiMeta;
  groups?: Record<string, GroupExamRaw[]>;
}

export interface StudentsResponse {
  meta?: ApiMeta;
  students?: Record<string, Student[]>;
}

export interface HashesResponse {
  hashes?: {
    schedule?: string;
    exams?: string;
    students?: string;
    ads?: string;
  };
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

export interface StudentsData {
  groups: Record<string, Student[]>;
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
  /** Необязательно: в новом API студенты сгруппированы по номеру группы. */
  group?: string;
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

/**
 * Преподаватель + кафедры, предметы и группы, в которых он ведёт.
 * `groups` нужен для поиска преподавателя по номеру группы.
 */
export interface TeacherEntry {
  teacher: string;
  departments: string[];
  subjects: string[];
  groups: string[];
}

/** Студент с гарантированно известной группой (для поиска по всем группам). */
export interface StudentEntry {
  student: string;
  group: string;
  leader: boolean;
}

/** Результат поиска: найденный студент + причина совпадения. */
export interface StudentSearchResult {
  student: StudentEntry;
  matchReason: 'name' | 'group';
}

export type Theme = 'auto' | 'light' | 'dark';

export type Direction = -1 | 0 | 1;