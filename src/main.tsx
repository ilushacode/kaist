import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './dev/resetApp';
import './index.css';
import App from './App';
import { ModalProvider } from './providers/ModalProvider';
import { HashRouter } from 'react-router-dom';
import { PhoneFrame } from './components/PhoneFrameComponent';
import { registerSW } from 'virtual:pwa-register';
import { Analytics } from '@vercel/analytics/react';

registerSW({ immediate: true });

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <PhoneFrame>
      <HashRouter>
        <ModalProvider>
          <App />
          <Analytics />
        </ModalProvider>
      </HashRouter>
    </PhoneFrame>
  </StrictMode>
);