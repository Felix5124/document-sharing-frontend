import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './styles/GlobalStyles.css';
import { AuthProvider } from './context/AuthContext.jsx';
// Import file icons để đăng ký các icon Font Awesome
import './utils/icons';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);