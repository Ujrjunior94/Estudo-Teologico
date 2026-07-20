import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './styles/index.css';
import { ThemeProvider } from './contexts/ThemeContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker registrado com sucesso:', reg.scope);
        // Register background sync if supported by browser
        if ('sync' in reg) {
          (reg as any).sync.register('sync-theology-studies')
            .catch((err: any) => console.log('Erro ao registrar background sync:', err));
        }
      })
      .catch(err => console.error('Erro ao registrar Service Worker:', err));
  });
}

