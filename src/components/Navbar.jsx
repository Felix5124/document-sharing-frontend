import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { getUserNotifications } from '../services/api';
import logo from '../assets/images/logoweb.png'; // Import ảnh logo

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const navbarRef = useRef(null);

  // Hàm lấy số thông báo chưa đọc
  const fetchUnreadNotifications = async () => {
    if (!user || user.isAdmin) return;
    try {
      const response = await getUserNotifications(user.userId);
      let data = response.data;
      if (data && Array.isArray(data.$values)) {
        data = data.$values;
      } else if (!Array.isArray(data)) {
        console.warn("Dữ liệu thông báo không đúng định dạng mảng:", response.data);
        data = [];
      }
      const unread = data.filter((notification) => !notification.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Fetch unread notifications error:', error);
    }
  };

  // Lắng nghe sự kiện cuộn để thu nhỏ navbar
  useEffect(() => {
    const handleScroll = () => {
      if (navbarRef.current) {
        if (window.scrollY > 50) {
          navbarRef.current.classList.add('scrolled');
        } else {
          navbarRef.current.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lấy thông báo khi user hoặc đường dẫn thay đổi
  useEffect(() => {
    if (user && !user.isAdmin) {
      fetchUnreadNotifications();
      const interval = setInterval(() => {
        fetchUnreadNotifications();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [user, location.pathname]);

  // Xử lý đăng xuất
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav ref={navbarRef} className="navbar navbar-expand-lg navbar-dark custom-navbar">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src={logo}
            alt="Logo"
            style={{ height: '60px', marginRight: '10px' }} // Kích thước và khoảng cách logo
          />
          Document Sharing
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                to="/"
              >
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${location.pathname === '/posts' ? 'active' : ''}`}
                to="/posts"
              >
                Diễn đàn
              </Link>
            </li>
            {user && (
              <>
                {user.isAdmin ? (
                  <>
                    <li className="nav-item">
                      <Link
                        className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                        to="/profile"
                      >
                        Hồ sơ
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                        to="/admin"
                      >
                        Quản trị
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="nav-item">
                      <Link
                        className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}
                        to="/upload"
                      >
                        Tải lên tài liệu
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                        to="/profile"
                      >
                        Hồ sơ
                      </Link>
                    </li>
                    <li className="nav-item" style={{ position: 'relative' }}>
                      <Link
                        className={`nav-link ${location.pathname === '/notifications' ? 'active' : ''}`}
                        to="/notifications"
                      >
                        Thông báo
                        {unreadCount > 0 && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '-2px',
                              right: '0px',
                              width: '12px',
                              height: '12px',
                              backgroundColor: '#dc3545',
                              borderRadius: '50%',
                              border: '2px solid #1f2937',
                            }}
                          />
                        )}
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link
                        className={`nav-link ${location.pathname === '/follow' ? 'active' : ''}`}
                        to="/follow"
                      >
                        Theo dõi
                      </Link>
                    </li>
                  </>
                )}
                <li className="nav-item">
                  <button className="nav-link btn btn-logout" onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </li>
              </>
            )}
            {!user && (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                    to="/login"
                  >
                    Đăng nhập
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
                    to="/register"
                  >
                    Đăng ký
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;