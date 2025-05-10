import { useContext, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import DocumentDetail from './pages/DocumentDetail';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthContext, AuthProvider } from './context/AuthContext';
import UploadDocument from './components/UploadDocument';

// Component PrivateRoute để bảo vệ các route
function PrivateRoute({ children, requireAdmin = false, allowNonAdmin = false }) {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem('token');
  const isAuthenticated = !!user && !!token && typeof token === 'string';

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !user.checkAdmin) {
    return <Navigate to="/" />;
  }

  if (allowNonAdmin && user.checkAdmin) {
    return <Navigate to="/" />; // Chuyển hướng admin về trang chủ
  }

  return children;
}

function App() {
  const { user } = useContext(AuthContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && typeof token === 'string' && user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [user]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <Home />
              </ErrorBoundary>
            }
          />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" /> : <Login />}
          />
          <Route path="/register" element={<Register />} />
          <Route
            path="/document/:id"
            element={
              <ErrorBoundary>
                <DocumentDetail />
              </ErrorBoundary>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute requireAdmin={true}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <PrivateRoute allowNonAdmin={true}>
                <UploadDocument />
              </PrivateRoute>
            }
          />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;