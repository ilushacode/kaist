import { API_BASE } from '../config';
import { fetchGzipJson } from './client';
import type {
  ExamsResponse,
  GroupExamRaw,
  GroupScheduleLesson,
  ScheduleResponse,
  Student,
  StudentsResponse,
} from '../types';

const SCHEDULE_PATH = '/data/schedule';
const EXAMS_PATH = '/data/exams';
const STUDENTS_PATH = '/data/students';

interface FetchOptions {
  signal?: AbortSignal;
  timeout?: number;
}

export interface DataResult<TGroups> {
  groups: TGroups;
  contentHash: string | null;
  updatedAt: string | null;
}

export const fetchSchedule = async (
  options: FetchOptions = {}
): Promise<DataResult<Record<string, GroupScheduleLesson[]>>> => {
  const data = await fetchGzipJson<ScheduleResponse>(
    `${API_BASE}${SCHEDULE_PATH}`,
    options
  );
  return {
    groups: data?.groups ?? {},
    contentHash: data?.meta?.contentHash ?? null,
    updatedAt: data?.meta?.updatedAt ?? null,
  };
};

export const fetchExams = async (
  options: FetchOptions = {}
): Promise<DataResult<Record<string, GroupExamRaw[]>>> => {
  const data = await fetchGzipJson<ExamsResponse>(
    `${API_BASE}${EXAMS_PATH}`,
    options
  );
  return {
    groups: data?.groups ?? {},
    contentHash: data?.meta?.contentHash ?? null,
    updatedAt: data?.meta?.updatedAt ?? null,
  };
};

export const fetchStudents = async (
  options: FetchOptions = {}
): Promise<DataResult<Record<string, Student[]>>> => {
  const data = await fetchGzipJson<StudentsResponse>(
    `${API_BASE}${STUDENTS_PATH}`,
    options
  );
  return {
    groups: data?.students ?? {},
    contentHash: data?.meta?.contentHash ?? null,
    updatedAt: data?.meta?.updatedAt ?? null,
  };
};