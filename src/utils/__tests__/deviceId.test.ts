import { describe, it, expect, beforeEach } from 'vitest';
import { getOrCreateDeviceId } from '../deviceId';

const DEVICE_ID_KEY = 'kaist-device-id';

describe('getOrCreateDeviceId', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('генерирует ID из 16 hex-символов', () => {
    const id = getOrCreateDeviceId();
    expect(id).toMatch(/^[0-9a-f]{16}$/);
  });

  it('возвращает тот же ID при повторном вызове', () => {
    const first = getOrCreateDeviceId();
    const second = getOrCreateDeviceId();
    expect(second).toBe(first);
  });

  it('сохраняет ID в localStorage под ключом kaist-device-id', () => {
    const id = getOrCreateDeviceId();
    expect(localStorage.getItem(DEVICE_ID_KEY)).toBe(id);
  });

  it('перегенерирует ID, если в localStorage лежит мусор', () => {
    localStorage.setItem(DEVICE_ID_KEY, 'not-a-valid-id');
    const id = getOrCreateDeviceId();
    expect(id).toMatch(/^[0-9a-f]{16}$/);
    expect(localStorage.getItem(DEVICE_ID_KEY)).toBe(id);
  });
});