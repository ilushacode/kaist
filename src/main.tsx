import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ModalProvider } from './providers/ModalProvider';
import { HashRouter } from 'react-router-dom';
import { PhoneFrame } from './components/PhoneFrameComponent';
import { initLogger } from './utils/logger';
import { checkAndApplyUpdates } from './utils/swUpdate';
import { handleResetFromUrl } from './utils/resetApp';

initLogger();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

const boot = async () => {
  // 0. Чистим URL от служебных параметров (v, t, _r)
  try {
    const url = new URL(window.location.href);
    let changed = false;

    if (url.searchParams.has('_r')) {
      url.searchParams.delete('_r');
      changed = true;
    }
    if (url.searchParams.has('v')) {
      url.searchParams.delete('v');
      changed = true;
    }
    if (url.searchParams.has('t')) {
      url.searchParams.delete('t');
      changed = true;
    }

    if (changed) {
      window.history.replaceState({}, '', url.toString());
    }
  } catch {
    /* noop */
  }

  // 1. Проверяем URL на предмет принудительного сброса
  const wasReset = await handleResetFromUrl();
  if (wasReset) {
    return;
  }

  // 2. HTML-лоадер
  rootEl.innerHTML = `
    <div class="loader theme_light">
      <p class="loader__title">KAIST</p>
    </div>
  `;

  // 3. Проверка обновлений и рендер
  await checkAndApplyUpdates();

  createRoot(rootEl).render(
    <StrictMode>
      <PhoneFrame>
        <HashRouter>
          <ModalProvider>
            <App />
          </ModalProvider>
        </HashRouter>
      </PhoneFrame>
    </StrictMode>
  );
};

void boot();