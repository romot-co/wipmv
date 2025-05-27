import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import '@radix-ui/themes/layout.css'
import './styles/index.css'
import { AppProvider } from './contexts/AppContext'

// 既存のService Workerをクリーンアップ
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      console.log('Unregistering service worker:', registration);
      registration.unregister();
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Theme
      appearance="dark"
      accentColor="blue"
      grayColor="slate"
      scaling="100%"
      radius="medium"
    >
      <AppProvider>
        <App />
      </AppProvider>
    </Theme>
  </React.StrictMode>
);
