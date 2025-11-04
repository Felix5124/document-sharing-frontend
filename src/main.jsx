import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './styles/GlobalStyles.css';
import { AuthProvider } from './context/AuthContext.jsx';
import { HomeCacheProvider } from './context/HomeCacheContext.jsx';
// Import file icons để đăng ký các icon Font Awesome
import './utils/icons';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <HomeCacheProvider>
        <App />
      </HomeCacheProvider>
    </AuthProvider>
  </React.StrictMode>
);