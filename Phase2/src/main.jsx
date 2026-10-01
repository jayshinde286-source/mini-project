import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import './index.css';

// Global error handlers to silently trap unhandled promise rejections and window errors
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.warn('🛡️ Trapped unhandled promise rejection gracefully:', event.reason);
    event.preventDefault();
  });
  window.addEventListener('error', (event) => {
    console.warn('🛡️ Trapped window error gracefully:', event.message);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
