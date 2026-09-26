import { useStore } from '../hooks/useStore';

interface ResetOptions {
  reload?: boolean;
}

export async function resetApp({ reload = true }: ResetOptions = {}): Promise<void> {
  await useStore.getState().resetAll();
  console.log('%c[dev] App fully reset', 'color:#e11d48;font-weight:bold');
  if (reload) {
    window.location.reload();
  }
}

declare global {
  interface Window {
    __resetApp?: typeof resetApp;
  }
}

if (import.meta.env.DEV) {
  window.__resetApp = resetApp;
}