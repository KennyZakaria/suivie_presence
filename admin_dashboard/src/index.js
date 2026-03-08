import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { Toaster } from 'react-hot-toast';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: '10px',
          background: '#1e1b4b',
          color: '#fff',
          fontSize: '14px',
        },
        success: {
          style: {
            background: '#065f46',
          },
          iconTheme: {
            primary: '#34d399',
            secondary: '#fff',
          },
        },
        error: {
          style: {
            background: '#7f1d1d',
          },
          iconTheme: {
            primary: '#f87171',
            secondary: '#fff',
          },
        },
      }}
    />
  </React.StrictMode>
);
