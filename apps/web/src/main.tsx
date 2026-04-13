import React from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import { App } from './App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
