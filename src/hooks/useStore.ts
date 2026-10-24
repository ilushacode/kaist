import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import localforage from 'localforage';
import type {
  AdRaw,
  GroupExamRaw,
  GroupScheduleLesson,
  Student,
  Theme,
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
const ADS_CACHE_KEY = 'kaist-ads-cache';

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

interface AdsCache {
  list: AdRaw[];
  contentHash: string | null;
  updatedAt: string | null;
}

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

  adsRaw: AdRaw[];
  adsHash: string | null;
  adsUpdatedAt: string | null;

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
  setAdsCache: (payload: AdsCache) => void;

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

      adsRaw: [],
      adsHash: null,
      adsUpdatedAt: null,

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

      setAdsCache: ({ list, contentHash, updatedAt }) => {
        set({
          adsRaw: Array.isArray(list) ? list : [],
          adsHash: contentHash ?? null,
          adsUpdatedAt: updatedAt ?? null,
        });
        void indexedDBAdapter.setItem(ADS_CACHE_KEY, {
          list: Array.isArray(list) ? list : [],
          contentHash: contentHash ?? null,
          updatedAt: updatedAt ?? null,
        });
      },

      loadHeavyCache: async () => {
        const [schedule, exams, students, ads] = await Promise.all([
          indexedDBAdapter.getItem<ScheduleCache>(SCHEDULE_CACHE_KEY),
          indexedDBAdapter.getItem<ExamsCache>(EXAMS_CACHE_KEY),
          indexedDBAdapter.getItem<StudentsCache>(STUDENTS_CACHE_KEY),
          indexedDBAdapter.getItem<AdsCache>(ADS_CACHE_KEY),
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
          adsRaw: ads?.list ?? state.adsRaw,
          adsHash: ads?.contentHash ?? state.adsHash,
          adsUpdatedAt: ads?.updatedAt ?? state.adsUpdatedAt,
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
          adsRaw: [],
          adsHash: null,
          adsUpdatedAt: null,
          bootstrapRetry: 0,
          theme: 'auto',
        });

        await Promise.all([
          indexedDBAdapter.removeItem(SCHEDULE_CACHE_KEY),
          indexedDBAdapter.removeItem(EXAMS_CACHE_KEY),
          indexedDBAdapter.removeItem(STUDENTS_CACHE_KEY),
          indexedDBAdapter.removeItem(ADS_CACHE_KEY),
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
      version: 8,
      partialize: (s) => ({
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
        return p as StoreState;
      },
    }
  )
);