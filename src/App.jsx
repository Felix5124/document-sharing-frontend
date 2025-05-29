import { useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import DocumentDetail from './pages/DocumentDetail';
import PostCommentDetail from './pages/PostCommentDetail';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';
import Notifications from './components/Notifications';
import NotificationDetail from './components/NotificationDetail';
import Follow from './components/Follow';
import Post from './components/Post';
import RankingsPage from './pages/RankingsPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthContext, AuthProvider } from './context/AuthContext';
import UploadDocument from './components/UploadDocument';
import UpdateDocument from './components/UpdateDocument';
import SearchResultsPage from './pages/SearchResultsPage';

// Component PrivateRoute để bảo vệ các route
function PrivateRoute({ children, requireAdmin = false, allowNonAdmin = false }) {
  const { user, isLoading } = useContext(AuthContext);
  const isAuthenticated = !!user;

  console.log("[PrivateRoute] Status:", {
    isLoading,
    user: user ? { userId: user.userId, isAdmin: user.isAdmin, email: user.email } : null,
    isAuthenticated,
    requireAdmin,
  });

  if (isLoading) {
    return <div>Đang kiểm tra đăng nhập...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user && !user.isAdmin) {
    console.log("[PrivateRoute] Admin access required, but user is not admin. Navigating to /.");
    return <Navigate to="/" />;
  }

  if (allowNonAdmin && user && user.isAdmin) {
    console.log("[PrivateRoute] Non-admin access required, but user IS admin. Navigating to /.");
    return <Navigate to="/" />;
  }

  return children;
}

// Component to handle scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

function App() {
  // Hàm cuộn lên đầu trang
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />
        <Routes>
          <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/document/:id" element={<ErrorBoundary><DocumentDetail /></ErrorBoundary>} />
          <Route path="/postcommentdetail/:id" element={<ErrorBoundary><PostCommentDetail /></ErrorBoundary>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route
            path="/admin"
            element={
              <PrivateRoute requireAdmin={true}>
                <ErrorBoundary>
                  <AdminDashboard />
                </ErrorBoundary>
              </PrivateRoute>
            }
          />
          <Route path="/upload" element={<PrivateRoute allowNonAdmin={true}><UploadDocument /></PrivateRoute>} />
          <Route path="/update/:id" element={<ErrorBoundary><UpdateDocument /></ErrorBoundary>} />
          <Route path="/posts" element={<ErrorBoundary><Post /></ErrorBoundary>} />
          <Route path="/rankings" element={<RankingsPage />} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/notifications/:notificationId" element={<PrivateRoute><NotificationDetail /></PrivateRoute>} />
          <Route path="/follow" element={<PrivateRoute><Follow /></PrivateRoute>} />
<<<<<<< HEAD
          <Route path="/search" element={<SearchResultsPage />} />


          {/* Xóa route cho SchoolDocuments */}
          {/* <Route path="/schools/:schoolId" element={<ErrorBoundary><SchoolDocuments /></ErrorBoundary>} /> */}

          {/* Thêm route cho các trang tĩnh trong footer */}
=======
>>>>>>> 24279eed52de9476b5f1e1d7fc2d719d7dd543ad
          <Route path="/about" element={<ErrorBoundary><div>Giới thiệu</div></ErrorBoundary>} />
          <Route path="/contact" element={<ErrorBoundary><div>Liên hệ</div></ErrorBoundary>} />
          <Route path="/privacy" element={<ErrorBoundary><div>Bảo mật</div></ErrorBoundary>} />
          <Route path="/help" element={<ErrorBoundary><div>Trợ giúp</div></ErrorBoundary>} />
        </Routes>

        {/* Footer */}
        <footer className="bg-dark text-white text-center py-5 mt-5">
          <div className="container">
            <div className="row g-5">
              {/* Cột Công ty */}
              <div className="col-lg-4 col-md-6">
                <h4 className="text-white mb-3">Công ty</h4>
                <ul className="list-unstyled">
                  <li><Link to="/about" className="text-white">Giới thiệu</Link></li>
                  <li><Link to="/contact" className="text-white">Liên hệ</Link></li>
                  <li><Link to="/privacy" className="text-white">Bảo mật</Link></li>
                  <li><Link to="/help" className="text-white">Trợ giúp</Link></li>
                </ul>
              </div>

              {/* Cột Liên hệ */}
              <div className="col-lg-4 col-md-6">
                <h4 className="text-white mb-3">Liên hệ</h4>
                <p className="mb-2"><i className="fas fa-map-marker-alt me-3"></i>Trường Đại Học Hutech</p>
                <p className="mb-2"><i className="fas fa-phone-alt me-3"></i>+012 345 67890</p>
                <p className="mb-2"><i className="fas fa-envelope me-3"></i>hutech@example.com</p>
                <div className="d-flex pt-2 justify-content-center">
                  <a className="btn btn-outline-light btn-social" href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a className="btn btn-outline-light btn-social" href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a className="btn btn-outline-light btn-social" href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-youtube"></i>
                  </a>
                  <a className="btn btn-outline-light btn-social" href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                </div>
              </div>

              {/* Cột Google Map */}
              <div className="col-lg-4 col-md-6">
                <h4 className="text-white mb-3">Bản đồ</h4>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.6142029797343!2d106.80632377421058!3d10.840807489311873!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175274f07046f89%3A0x3a9cb196c5e1a7de!2zSFVURUNIIC0gxJDhuqFpIGjhu41jIEPDtG5nIG5naOG7hyBUUC5IQ00!5e0!3m2!1svi!2s!4v1743307008388!5m2!1svi!2s"
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>

            <div className="mt-4">
              <p>© 2025 - DoAn_Web. Tất cả quyền lợi thuộc về DoAn_Web.</p>
            </div>
          </div>
        </footer>

        <div id="back-to-top">
          <button type="button" className="btn btn-primary" onClick={scrollToTop}>
            <i className="fas fa-arrow-up"></i>
          </button>
        </div>

        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;