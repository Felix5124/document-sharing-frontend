import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useOutletContext, Link } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import DocumentDetail from './pages/DocumentDetail';
// Import AdminLayout và các view con từ AdminDashboard.jsx
// Giả sử AdminDashboard.jsx export AdminDashboard as AdminLayout, và các view con
import { 
    AdminLayout, // Đây là component AdminDashboard đã được đổi tên khi export
    PendingDocumentsView, 
    UsersView, 
    CategoriesView, 
    BadgesView 
} from './pages/AdminDashboard'; 
import Navbar from './components/Navbar';
import { ToastContainer ,toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Đảm bảo đã cài đặt: npm install bootstrap-icons
import ErrorBoundary from './components/ErrorBoundary';
import { AuthContext } from './context/AuthContext';
import UploadDocument from './components/UploadDocument';

// Component PrivateRoute để bảo vệ các route
function PrivateRoute({ children, requireAdmin = false }) {
  const { user, loadingAuth } = useContext(AuthContext);

  if (loadingAuth) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "calc(100vh - 56px)", marginTop: "56px" }}>
        <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}>
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!user) { 
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user.isAdmin) { // Sử dụng user.isAdmin
    toast.warn("Bạn không có quyền truy cập trang này.");
    return <Navigate to="/" replace />; 
  }

  return children;
}

// Wrapper components để truyền context từ Outlet của AdminLayout vào các view con
// Các wrapper này nhận context (dữ liệu đã fetch) từ AdminLayout và truyền xuống view cụ thể
function AdminPendingDocumentsWrapper() {
    const { pendingDocs, handleApprove } = useOutletContext();
    return <PendingDocumentsView docs={pendingDocs} onApprove={handleApprove} />;
}

function AdminUsersWrapper() {
    const { users } = useOutletContext();
    return <UsersView users={users} />;
}

function App() {
  const { user, loadingAuth } = useContext(AuthContext);

  // Component để chuyển hướng người dùng đã đăng nhập ra khỏi trang Login/Register
  const RedirectIfAuthenticated = ({ children }) => {
    if (loadingAuth) return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "calc(100vh - 56px)", marginTop: "56px" }}>
             <div className="spinner-border text-primary" role="status" style={{width: '3rem', height: '3rem'}}><span className="visually-hidden">Đang tải...</span></div>
        </div>
    );
    return user ? <Navigate to="/" replace /> : children;
  };

  return (
      <BrowserRouter>
        <Navbar />
        <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={
                <RedirectIfAuthenticated>
                  <Login />
                </RedirectIfAuthenticated>
              } 
            />
            <Route 
              path="/register" 
              element={
                <RedirectIfAuthenticated>
                  <Register />
                </RedirectIfAuthenticated>
              } 
            />
            <Route path="/document/:id" element={<DocumentDetail />} />
            
            {/* Authenticated User Routes */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <PrivateRoute> 
                  <UploadDocument />
                </PrivateRoute>
              }
            />

            {/* Admin Routes - Nested under AdminLayout */}
            <Route 
              path="/admin" 
              element={
                <PrivateRoute requireAdmin={true}>
                  <AdminLayout /> {/* AdminLayout chứa sidebar và <Outlet /> */}
                </PrivateRoute>
              }
            >
              {/* Trang mặc định khi vào /admin */}
              <Route index element={<AdminPendingDocumentsWrapper />} /> 
              <Route path="pending-documents" element={<AdminPendingDocumentsWrapper />} />
              <Route path="users" element={<AdminUsersWrapper />} />
              {/* CategoriesView và BadgesView tự fetch dữ liệu, không cần wrapper */}
              <Route path="categories" element={<CategoriesView />} />
              <Route path="badges" element={<BadgesView />} />
              {/* Thêm các route con khác cho admin ở đây nếu cần */}
            </Route>

            {/* Fallback Route for 404 Not Found */}
            <Route path="*" element={
              <div className="container text-center mt-5 pt-5">
                <i className="bi bi-exclamation-triangle-fill display-1 text-warning"></i>
                <h2 className="mt-3">404 - Trang không tìm thấy</h2>
                <p>Rất tiếc, chúng tôi không thể tìm thấy trang bạn yêu cầu.</p>
                <Link to="/" className="btn btn-primary">
                  <i className="bi bi-house-door-fill me-2"></i>Về trang chủ
                </Link>
              </div>
            } />
          </Routes>
        </ErrorBoundary>
        <ToastContainer autoClose={3000} hideProgressBar position="bottom-right" theme="colored"/>
      </BrowserRouter>
  );
}
export default App;
