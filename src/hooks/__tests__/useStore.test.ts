import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../useStore';

beforeEach(async () => {
  await useStore.getState().resetAll();
});

describe('useStore', () => {
  describe('addGroup', () => {
    it('добавляет группу, если она есть в кэше', () => {
      useStore.setState({ scheduleGroups: { '3439': [] } });
      useStore.getState().addGroup('3439');
      expect(useStore.getState().groups).toContain('3439');
      expect(useStore.getState().selectedGroup).toBe('3439');
    });

    it('не добавляет группу не из кэша при requireKnown=true', () => {
      useStore.getState().addGroup('9999');
      expect(useStore.getState().groups).toEqual([]);
    });

    it('добавляет группу не из кэша при requireKnown=false', () => {
      useStore.getState().addGroup('9999', { requireKnown: false });
      expect(useStore.getState().groups).toContain('9999');
    });

    it('не добавляет короткую группу', () => {
      useStore.getState().addGroup('123', { requireKnown: false });
      expect(useStore.getState().groups).toEqual([]);
    });

    it('не дублирует группу', () => {
      useStore.setState({ scheduleGroups: { '3439': [] } });
      useStore.getState().addGroup('3439');
      useStore.getState().addGroup('3439');
      expect(useStore.getState().groups).toEqual(['3439']);
    });
  });

  describe('removeGroup', () => {
    it('удаляет группу', () => {
      useStore.setState({
        groups: ['3439', '4191'],
        selectedGroup: '3439',
        scheduleGroups: { '3439': [], '4191': [] },
      });
      useStore.getState().removeGroup('3439');
      expect(useStore.getState().groups).toEqual(['4191']);
      expect(useStore.getState().selectedGroup).toBe('4191');
    });
  });

  describe('selectGroup', () => {
    it('устанавливает выбранную группу', () => {
      useStore.getState().selectGroup('3439');
      expect(useStore.getState().selectedGroup).toBe('3439');
    });
  });

  describe('setSingleGroup', () => {
    it('устанавливает одну группу', () => {
      useStore.getState().setSingleGroup('3439');
      expect(useStore.getState().groups).toEqual(['3439']);
      expect(useStore.getState().selectedGroup).toBe('3439');
    });
    it('игнорирует короткий номер', () => {
      useStore.getState().setSingleGroup('12');
      expect(useStore.getState().groups).toEqual([]);
    });
  });

  describe('setScheduleCache', () => {
    it('устанавливает кэш расписания и снимает флаги', () => {
      useStore.setState({ scheduleLoading: true, scheduleError: true });
      useStore.getState().setScheduleCache({
        groups: { '3439': [] },
        contentHash: 'abc',
        updatedAt: '2025-01-01',
      });
      const state = useStore.getState();
      expect(state.scheduleGroups).toEqual({ '3439': [] });
      expect(state.scheduleHash).toBe('abc');
      expect(state.scheduleLoading).toBe(false);
      expect(state.scheduleError).toBe(false);
    });
  });

  describe('setExamsCache', () => {
    it('устанавливает кэш экзаменов и снимает флаги', () => {
      useStore.setState({ examsLoading: true, examsError: true });
      useStore.getState().setExamsCache({
        groups: { '3439': [] },
        contentHash: 'h1',
        updatedAt: '2026-10-24T00:00:00Z',
      });
      const state = useStore.getState();
      expect(state.examsGroups).toEqual({ '3439': [] });
      expect(state.examsHash).toBe('h1');
      expect(state.examsLoading).toBe(false);
      expect(state.examsError).toBe(false);
    });
  });

  describe('setStudentsCache', () => {
    it('устанавливает кэш студентов и снимает флаги', () => {
      useStore.setState({ studentsLoading: true, studentsError: true });
      useStore.getState().setStudentsCache({
        groups: {
          '3439': [{ student_id: 1, student: 'Иванов Иван', leader: false }],
        },
        contentHash: 'h2',
        updatedAt: '2026-10-24T00:00:00Z',
      });
      const state = useStore.getState();
      expect(Object.keys(state.studentsGroups)).toEqual(['3439']);
      expect(state.studentsHash).toBe('h2');
      expect(state.studentsLoading).toBe(false);
      expect(state.studentsError).toBe(false);
    });
  });

  describe('setTheme', () => {
    it('устанавливает тему', () => {
      useStore.getState().setTheme('dark');
      expect(useStore.getState().theme).toBe('dark');
    });
  });

  describe('retryBootstrap', () => {
    it('инкрементирует счётчик', () => {
      const before = useStore.getState().bootstrapRetry;
      useStore.getState().retryBootstrap();
      expect(useStore.getState().bootstrapRetry).toBe(before + 1);
    });
  });

  describe('resetAll', () => {
    it('чистит состояние и install-banner ключи', async () => {
      localStorage.setItem('install-banner-dismissed-until', '123');
      localStorage.setItem('install-banner-installed', '1');
      useStore.setState({
        groups: ['3439'],
        selectedGroup: '3439',
        scheduleGroups: { '3439': [] },
      });

      await useStore.getState().resetAll();

      expect(useStore.getState().groups).toEqual([]);
      expect(useStore.getState().selectedGroup).toBeNull();
      expect(useStore.getState().scheduleGroups).toEqual({});
      expect(localStorage.getItem('install-banner-dismissed-until')).toBeNull();
      expect(localStorage.getItem('install-banner-installed')).toBeNull();
    });
  });
});