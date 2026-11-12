import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import type {
  GroupExamRaw,
  GroupScheduleLesson,
  Student,
  Theme,
  Lesson,
} from '../types';

localforage.config({
  name: 'kaist-app',
  storeName: 'cache',
  description: 'KAIST app cache',
});

const STORAGE_KEY = 'kaist-app-v5';
const SCHEDULE_CACHE_KEY = 'kaist-schedule-cache';
const EXAMS_CACHE_KEY = 'kaist-exams-cache';
const STUDENTS_CACHE_KEY = 'kaist-students-cache';

const INSTALL_BANNER_DISMISS_KEY = 'install-banner-dismissed-until';
const INSTALL_BANNER_INSTALLED_KEY = 'install-banner-installed';

interface ScheduleCache {
  groups: Record<string, GroupScheduleLesson[]>;
  contentHash: string | null;
  updatedAt: string | null;
}

interface ExamsCache {
  groups: Record<string, GroupExamRaw[]>;
  contentHash: string | null;
  updatedAt: string | null;
}

interface StudentsCache {
  groups: Record<string, Student[]>;
  contentHash: string | null;
  updatedAt: string | null;
}

// Счётчик позволяет действию задачи сообщить об ошибке синхронной записи.
let storageWriteFailures = 0;

export interface LessonTask { id: string; text: string }

export const getLessonTaskKey = (lesson: Lesson, date: Date): string =>
  JSON.stringify([
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
    lesson.seriesKey ?? [lesson.subject, lesson.type, lesson.time, lesson.teacher, lesson.room, lesson.building],
  ]);

const localStorageAdapter: StateStorage = {
  getItem: (name) => {
    try {
      const value = localStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch (e) {
      storageWriteFailures += 1;
      console.warn('localStorage setItem failed:', e);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* noop */
    }
  },
};

const indexedDBAdapter = {
  getItem: async <T>(name: string): Promise<T | null> => {
    try {
      const value = await localforage.getItem<T>(name);
      return value ?? null;
    } catch {
      return null;
    }
  },
  setItem: async <T>(name: string, value: T): Promise<void> => {
    try {
      await localforage.setItem(name, value);
    } catch (e) {
      console.warn('IndexedDB setItem failed:', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await localforage.removeItem(name);
    } catch {
      /* noop */
    }
  },
};

const sanitizeGroup = (raw: unknown): string =>
  String(raw ?? '').replace(/\D/g, '').slice(0, 4);

export interface StoreState {
  hiddenLessons: Record<string, Record<string, true>>;
  toggleLessonHidden: (group: string, seriesKey: string) => void;
  lessonTasks: Record<string, Record<string, LessonTask[]>>;
  setLessonTasks: (group: string, key: string, tasks: LessonTask[]) => boolean;
  groups: string[];
  selectedGroup: string | null;

  scheduleGroups: Record<string, GroupScheduleLesson[]>;
  scheduleHash: string | null;
  scheduleUpdatedAt: string | null;
  scheduleLoading: boolean;
  scheduleError: boolean;

  examsGroups: Record<string, GroupExamRaw[]>;
  examsHash: string | null;
  examsUpdatedAt: string | null;
  examsLoading: boolean;
  examsError: boolean;

  studentsGroups: Record<string, Student[]>;
  studentsHash: string | null;
  studentsUpdatedAt: string | null;
  studentsLoading: boolean;
  studentsError: boolean;

  bootstrapRetry: number;
  theme: Theme;
  _hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  addGroup: (number: string, options?: { requireKnown?: boolean }) => void;
  removeGroup: (number: string) => void;
  selectGroup: (number: string) => void;
  setSingleGroup: (number: string) => void;

  setScheduleCache: (payload: ScheduleCache) => void;
  setExamsCache: (payload: ExamsCache) => void;
  setStudentsCache: (payload: StudentsCache) => void;

  loadHeavyCache: () => Promise<void>;

  setScheduleLoading: (value: boolean) => void;
  setScheduleError: (value: boolean) => void;
  setExamsLoading: (value: boolean) => void;
  setExamsError: (value: boolean) => void;
  setStudentsLoading: (value: boolean) => void;
  setStudentsError: (value: boolean) => void;

  retryBootstrap: () => void;
  setTheme: (theme: Theme) => void;
  resetAll: () => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      hiddenLessons: {},
      toggleLessonHidden: (group, seriesKey) => {
        if (!/^\d{4}$/.test(group) || !seriesKey) return;
        set((state) => {
          const hiddenLessons = { ...state.hiddenLessons };
          const entries = { ...hiddenLessons[group] };
          if (entries[seriesKey]) delete entries[seriesKey];
          else entries[seriesKey] = true;
          if (Object.keys(entries).length) hiddenLessons[group] = entries;
          else delete hiddenLessons[group];
          return { hiddenLessons };
        });
      },
      lessonTasks: {},
      setLessonTasks: (group, key, tasks) => {
        if (!/^\d{4}$/.test(group) || !key) return false;
        const lessonTasks = { ...get().lessonTasks };
        const entries = { ...lessonTasks[group] };
        if (tasks.length) entries[key] = tasks;
        else delete entries[key];
        if (Object.keys(entries).length) lessonTasks[group] = entries;
        else delete lessonTasks[group];
        const failuresBefore = storageWriteFailures;
        set({ lessonTasks });
        return failuresBefore === storageWriteFailures;
      },
      groups: [],
      selectedGroup: null,

      scheduleGroups: {},
      scheduleHash: null,
      scheduleUpdatedAt: null,
      scheduleLoading: false,
      scheduleError: false,

      examsGroups: {},
      examsHash: null,
      examsUpdatedAt: null,
      examsLoading: false,
      examsError: false,

      studentsGroups: {},
      studentsHash: null,
      studentsUpdatedAt: null,
      studentsLoading: false,
      studentsError: false,

      bootstrapRetry: 0,

      theme: 'auto',

      _hasHydrated: false,
      setHasHydrated: (value) => set({ _hasHydrated: value }),

      addGroup: (number, { requireKnown = true } = {}) => {
        const normalized = sanitizeGroup(number);
        if (normalized.length !== 4) return;

        const { groups, selectedGroup, scheduleGroups } = get();
        if (requireKnown) {
          const known = Object.keys(scheduleGroups ?? {});
          if (!known.includes(normalized)) return;
        }
        if (groups.includes(normalized)) return;

        set({
          groups: [...groups, normalized],
          selectedGroup: selectedGroup ?? normalized,
        });
      },

      removeGroup: (number) => {
        const { groups, selectedGroup } = get();
        const newGroups = groups.filter((g) => g !== number);
        set({
          groups: newGroups,
          selectedGroup:
            selectedGroup === number ? newGroups[0] ?? null : selectedGroup,
        });
      },

      selectGroup: (number) => set({ selectedGroup: number }),

      setSingleGroup: (number) => {
        const normalized = sanitizeGroup(number);
        if (normalized.length !== 4) return;
        set({ groups: [normalized], selectedGroup: normalized });
      },

      setScheduleCache: ({ groups, contentHash, updatedAt }) => {
        set({
          scheduleGroups: groups ?? {},
          scheduleHash: contentHash ?? null,
          scheduleUpdatedAt: updatedAt ?? null,
          scheduleError: false,
          scheduleLoading: false,
        });
        void indexedDBAdapter.setItem(SCHEDULE_CACHE_KEY, {
          groups: groups ?? {},
          contentHash: contentHash ?? null,
          updatedAt: updatedAt ?? null,
        });
      },

      setExamsCache: ({ groups, contentHash, updatedAt }) => {
        set({
          examsGroups: groups ?? {},
          examsHash: contentHash ?? null,
          examsUpdatedAt: updatedAt ?? null,
          examsError: false,
          examsLoading: false,
        });
        void indexedDBAdapter.setItem(EXAMS_CACHE_KEY, {
          groups: groups ?? {},
          contentHash: contentHash ?? null,
          updatedAt: updatedAt ?? null,
        });
      },

      setStudentsCache: ({ groups, contentHash, updatedAt }) => {
        set({
          studentsGroups: groups ?? {},
          studentsHash: contentHash ?? null,
          studentsUpdatedAt: updatedAt ?? null,
          studentsError: false,
          studentsLoading: false,
        });
        void indexedDBAdapter.setItem(STUDENTS_CACHE_KEY, {
          groups: groups ?? {},
          contentHash: contentHash ?? null,
          updatedAt: updatedAt ?? null,
        });
      },

      loadHeavyCache: async () => {
        const [schedule, exams, students] = await Promise.all([
          indexedDBAdapter.getItem<ScheduleCache>(SCHEDULE_CACHE_KEY),
          indexedDBAdapter.getItem<ExamsCache>(EXAMS_CACHE_KEY),
          indexedDBAdapter.getItem<StudentsCache>(STUDENTS_CACHE_KEY),
        ]);

        set((state) => ({
          scheduleGroups: schedule?.groups ?? state.scheduleGroups,
          scheduleHash: schedule?.contentHash ?? state.scheduleHash,
          scheduleUpdatedAt: schedule?.updatedAt ?? state.scheduleUpdatedAt,
          examsGroups: exams?.groups ?? state.examsGroups,
          examsHash: exams?.contentHash ?? state.examsHash,
          examsUpdatedAt: exams?.updatedAt ?? state.examsUpdatedAt,
          studentsGroups: students?.groups ?? state.studentsGroups,
          studentsHash: students?.contentHash ?? state.studentsHash,
          studentsUpdatedAt: students?.updatedAt ?? state.studentsUpdatedAt,
        }));
      },

      setScheduleLoading: (scheduleLoading) =>
        set({ scheduleLoading: Boolean(scheduleLoading) }),
      setScheduleError: (scheduleError) =>
        set({ scheduleError: Boolean(scheduleError) }),
      setExamsLoading: (examsLoading) =>
        set({ examsLoading: Boolean(examsLoading) }),
      setExamsError: (examsError) => set({ examsError: Boolean(examsError) }),
      setStudentsLoading: (studentsLoading) =>
        set({ studentsLoading: Boolean(studentsLoading) }),
      setStudentsError: (studentsError) =>
        set({ studentsError: Boolean(studentsError) }),

      retryBootstrap: () => set({ bootstrapRetry: get().bootstrapRetry + 1 }),

      setTheme: (theme) => {
        set({ theme });
        try {
          localStorage.setItem('theme', theme);
        } catch {
          /* noop */
        }
      },

      resetAll: async () => {
        set({
          hiddenLessons: {},
          lessonTasks: {},
          groups: [],
          selectedGroup: null,
          scheduleGroups: {},
          scheduleHash: null,
          scheduleUpdatedAt: null,
          scheduleLoading: false,
          scheduleError: false,
          examsGroups: {},
          examsHash: null,
          examsUpdatedAt: null,
          examsLoading: false,
          examsError: false,
          studentsGroups: {},
          studentsHash: null,
          studentsUpdatedAt: null,
          studentsLoading: false,
          studentsError: false,
          bootstrapRetry: 0,
          theme: 'auto',
        });

        await Promise.all([
          indexedDBAdapter.removeItem(SCHEDULE_CACHE_KEY),
          indexedDBAdapter.removeItem(EXAMS_CACHE_KEY),
          indexedDBAdapter.removeItem(STUDENTS_CACHE_KEY),
          indexedDBAdapter.removeItem(STORAGE_KEY),
        ]);

        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem('theme');
          localStorage.removeItem(INSTALL_BANNER_DISMISS_KEY);
          localStorage.removeItem(INSTALL_BANNER_INSTALLED_KEY);
        } catch {
          /* noop */
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorageAdapter),
      version: 12,
      partialize: (s) => ({
        hiddenLessons: s.hiddenLessons,
        lessonTasks: s.lessonTasks,
        groups: s.groups,
        selectedGroup: s.selectedGroup,
        theme: s.theme,
      }) as Partial<StoreState>,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      migrate: (persisted, version) => {
        const p = persisted as Partial<StoreState> & {
          scheduleCache?: unknown;
          lastFetchedAt?: unknown;
        };
        if (version < 11 && p) p.hiddenLessons = {};
        // v12: задачи относятся к конкретной дате пары, старые заметки удаляются.
        if (version < 12 && p) {
          p.lessonTasks = {};
          delete (p as { subjectNotes?: unknown }).subjectNotes;
        }
        if (version < 2 && p?.groups) {
          p.groups = p.groups.map((g: unknown) =>
            typeof g === 'string' ? g : (g as { number?: string })?.number ?? ''
          );
        }
        if (version < 3 && p) {
          delete p.scheduleCache;
          delete p.lastFetchedAt;
        }
        if (version < 5 && p) {
          delete (p as { scheduleGroups?: unknown }).scheduleGroups;
          delete (p as { scheduleHash?: unknown }).scheduleHash;
          delete (p as { scheduleUpdatedAt?: unknown }).scheduleUpdatedAt;
          delete (p as { examsGroups?: unknown }).examsGroups;
          delete (p as { examsHash?: unknown }).examsHash;
          delete (p as { examsUpdatedAt?: unknown }).examsUpdatedAt;
        }
        if (version < 6 && p?.groups) {
          p.groups = p.groups
            .map((g: unknown) => String(g).replace(/\D/g, '').slice(0, 4))
            .filter((g: string) => g.length === 4);
          if (p.selectedGroup && !p.groups.includes(p.selectedGroup)) {
            p.selectedGroup = p.groups[0] ?? null;
          }
        }
        if (version < 8 && p) {
          delete (p as { scheduleGroups?: unknown }).scheduleGroups;
          delete (p as { scheduleHash?: unknown }).scheduleHash;
          delete (p as { scheduleUpdatedAt?: unknown }).scheduleUpdatedAt;
          delete (p as { examsGroups?: unknown }).examsGroups;
          delete (p as { examsHash?: unknown }).examsHash;
          delete (p as { examsUpdatedAt?: unknown }).examsUpdatedAt;
          delete (p as { studentsGroups?: unknown }).studentsGroups;
          delete (p as { studentsHash?: unknown }).studentsHash;
          delete (p as { studentsUpdatedAt?: unknown }).studentsUpdatedAt;
          delete (p as { adsRaw?: unknown }).adsRaw;
          delete (p as { adsHash?: unknown }).adsHash;
          delete (p as { adsUpdatedAt?: unknown }).adsUpdatedAt;
        }
        // v9: реклама переехала на AdFox, локальный кэш объявлений больше не нужен.
        if (p) {
          delete (p as { adsRaw?: unknown }).adsRaw;
          delete (p as { adsHash?: unknown }).adsHash;
          delete (p as { adsUpdatedAt?: unknown }).adsUpdatedAt;
        }
        return p as StoreState;
      },
    }
  )
);
