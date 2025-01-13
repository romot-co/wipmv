import React from 'react'
import ReactDOM from 'react-dom/client'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import '@radix-ui/themes/layout.css'
import App from './App'
import './styles/index.css'

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
      scaling="95%"
      radius="medium"
    >
      <App />
    </Theme>
  </React.StrictMode>
);
