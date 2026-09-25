import { useStore } from '../useStore';

beforeEach(async () => {
  await useStore.getState().resetAll();
});

describe('useStore', () => {
  describe('addGroup', () => {
    it('добавляет группу, если она есть в кэше', () => {
      useStore.setState({
        scheduleGroups: { '3439': [] },
      });
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
    it('устанавливает кэш расписания', () => {
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
});