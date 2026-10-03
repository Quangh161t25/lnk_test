import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { DataProvider } from './context/DataContext';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>
);
