export const API_BASE = 'https://api.kaist.pro';

export const REQUEST_TIMEOUT_MS = 15000;
export const BOOTSTRAP_TIMEOUT_MS = 30000;
export const MIN_LOADER_MS = 1000;

export const TRACK_TIMEOUT_MS = 5000;

export const TELEGRAM_CHANNEL = 'kaist_app';

// Автоматическая версия, генерируется при сборке
export const APP_VERSION = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev';