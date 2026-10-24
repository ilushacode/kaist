import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ModalProvider } from './providers/ModalProvider';
import { HashRouter } from 'react-router-dom';
import { PhoneFrame } from './components/PhoneFrameComponent';
import { registerSW } from 'virtual:pwa-register';
import { Analytics } from '@vercel/analytics/react';
import { UpdateBanner } from './components/UpdateBanner';

let updateSW: (reloadPage?: boolean) => Promise<void>;

function Root() {
  const [needRefresh, setNeedRefresh] = useState(false);

  useState(() => {
    updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
    });
  });

  const handleUpdate = () => {
    if (updateSW) {
      updateSW(true);
    }
  };

  return (
    <PhoneFrame>
      <HashRouter>
        <ModalProvider>
          <App />
          <Analytics />
          {needRefresh && <UpdateBanner onUpdate={handleUpdate} />}
        </ModalProvider>
      </HashRouter>
    </PhoneFrame>
  );
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <Root />
  </StrictMode>
);