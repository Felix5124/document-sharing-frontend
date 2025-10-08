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
import ErrorBoundary from './components/ErrorBoundary';
import { AuthContext, AuthProvider } from './context/AuthContext';
import UploadDocument from './components/UploadDocument';
import UpdateDocument from './components/UpdateDocument';
import SearchResultsPage from './pages/SearchResultsPage';
import Chatbot from './components/Chatbot'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faComment } from '@fortawesome/free-solid-svg-icons';


// Component PrivateRoute để bảo vệ các route
function PrivateRoute({ children, requireAdmin = false, allowNonAdmin = false }) {
  const { user, isLoading } = useContext(AuthContext);
  const isAuthenticated = !!user;


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
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/about" element={<ErrorBoundary><div>Giới thiệu</div></ErrorBoundary>} />
          <Route path="/contact" element={<ErrorBoundary><div>Liên hệ</div></ErrorBoundary>} />
          <Route path="/privacy" element={<ErrorBoundary><div>Bảo mật</div></ErrorBoundary>} />
          <Route path="/help" element={<ErrorBoundary><div>Trợ giúp</div></ErrorBoundary>} />
        </Routes>
        {/* Icon Chatbox */}
        <div
          className="fixed-buttons"
        >

          <Chatbot />
          {/* Nút Back to Top */}
          <button
            className="back-to-top-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Quay lại đầu trang"
          >
            <FontAwesomeIcon icon={faArrowUp} />
          </button>


        </div>
        <footer className="footer">
          <div className="footer-container">
            <div className="footer-row">

              {/* Cột Công ty */}
              <div className="footer-column">
                <h4 className="footer-title">Công ty</h4>
                <ul className="footer-links">
                  <li><Link to="/about">Giới thiệu</Link></li>
                  <li><Link to="/contact">Liên hệ</Link></li>
                  <li><Link to="/privacy">Bảo mật</Link></li>
                  <li><Link to="/help">Trợ giúp</Link></li>
                </ul>
              </div>

              {/* Cột Liên hệ */}
              <div className="footer-column">
                <h4 className="footer-title">Liên hệ</h4>
                <p><i className="fas fa-map-marker-alt"></i> Trường Đại Học Hutech</p>
                <p><i className="fas fa-phone-alt"></i> +012 345 67890</p>
                <p><i className="fas fa-envelope"></i> hutech@example.com</p>
                <div className="footer-socials">
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter"></i></a>
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook-f"></i></a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-youtube"></i></a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin-in"></i></a>
                </div>
              </div>

              {/* Cột Bản đồ */}
              <div className="footer-column">
                <h4 className="footer-title">Bản đồ</h4>
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

            <div className="footer-bottom">
              <p>© 2025 - DoAn_Web. Tất cả quyền lợi thuộc về DoAn_Web.</p>
            </div>
          </div>
        </footer>


        <ToastContainer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;