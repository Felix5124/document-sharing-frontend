import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/components/Navbar.css';
import { getUserNotifications } from '../services/api';
import logo from '../assets/images/logoweb.png';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const navbarRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Xử lý đóng/mở menu trên mobile
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav ref={navbarRef} className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link className="navbar-logo-item" to="/">
            <img
              src={logo}
              alt="Logo"
              className="navbar-logo-image"
            />
            Document Sharing
          </Link>
        </div>

        <div className='navbar-menu'>
          <button
            className={`menu-toggle ${menuOpen ? 'menu-open' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle navigation"
          >
            <span className="menu-icon"></span>
          </button>
          <div className={`navbar-menu-item ${menuOpen ? 'open' : ''}`}>
            <ul className="navbar-links">
              <li className="navbar-item">
                <Link
                  className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}
                  to="/"
                >
                  Home
                </Link>
              </li>
              <li className="navbar-item">
                <Link
                  className={`navbar-link ${location.pathname === '/posts' ? 'active' : ''}`}
                  to="/posts"
                >
                  Diễn đàn
                </Link>
              </li>
              {user && (
                <>
                  {user.isAdmin ? (
                    <>
                      <li className="navbar-item">
                        <Link
                          className={`navbar-link ${location.pathname === '/profile' ? 'active' : ''}`}
                          to="/profile"
                        >
                          Hồ sơ
                        </Link>
                      </li>
                      <li className="navbar-item">
                        <Link
                          className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}
                          to="/admin"
                        >
                          Quản trị
                        </Link>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="navbar-item">
                        <Link
                          className={`navbar-link ${location.pathname === '/upload' ? 'active' : ''}`}
                          to="/upload"
                        >
                          Tải lên tài liệu
                        </Link>
                      </li>
                      <li className="navbar-item">
                        <Link
                          className={`navbar-link ${location.pathname === '/profile' ? 'active' : ''}`}
                          to="/profile"
                        >
                          Hồ sơ
                        </Link>
                      </li>
                      <li className="navbar-item">
                        <Link
                          className={`navbar-link ${location.pathname === '/notifications' ? 'active' : ''}`}
                          to="/notifications"
                        >
                          Thông báo
                          {unreadCount > 0 && <span className="notification-badge" />}
                        </Link>
                      </li>
                      <li className="navbar-item">
                        <Link
                          className={`navbar-link ${location.pathname === '/follow' ? 'active' : ''}`}
                          to="/follow"
                        >
                          Theo dõi
                        </Link>
                      </li>
                    </>
                  )}
                  <li className="navbar-item">
                    <button className="navbar-link logout-button" onClick={handleLogout}>
                      Đăng xuất
                    </button>
                  </li>
                </>
              )}
              {!user && (
                <>
                  <li className="navbar-item">
                    <Link
                      className={`navbar-link ${location.pathname === '/login' ? 'active' : ''}`}
                      to="/login"
                    >
                      Đăng nhập
                    </Link>
                  </li>
                  <li className="navbar-item">
                    <Link
                      className={`navbar-link ${location.pathname === '/register' ? 'active' : ''}`}
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
      </div>
    </nav>
  );
}

export default Navbar;