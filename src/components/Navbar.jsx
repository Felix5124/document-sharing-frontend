import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/components/Navbar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faComments,
  faUpload,
  faUser,
  faBell,
  faHeart,
  faGears,
  faRightFromBracket,
  faRightToBracket,
  faUserPlus,
  faBars
} from '@fortawesome/free-solid-svg-icons';
import { getUserNotifications } from '../services/api';
import logo from '../assets/images/logoweb.png';
import { getFullAvatarUrl } from '../utils/avatarUtils';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const navbarRef = useRef(null);
  const dropdownRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // --- Đóng dropdown khi click ra ngoài ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Lấy thông báo chưa đọc ---
  const fetchUnreadNotifications = async () => {
    if (!user || user.isAdmin) return;
    try {
      const response = await getUserNotifications(user.userId);
      let data = response.data;
      if (data && Array.isArray(data.$values)) {
        data = data.$values;
      } else if (!Array.isArray(data)) {
        console.warn('Dữ liệu thông báo không đúng định dạng mảng:', response.data);
        data = [];
      }
      const unread = data.filter((notification) => !notification.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Fetch unread notifications error:', error);
    }
  };

  // --- Navbar cuộn ---
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

  // --- Fetch lại khi user hoặc path thay đổi ---
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

  // --- Logout ---
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- Toggle menu/dropdown ---
  const toggleMenu = () => setMenuOpen((prev) => !prev);

  return (
    <nav ref={navbarRef} className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link className="navbar-logo-item" to="/">
            <img src={logo} alt="Logo" className="navbar-logo-image" />
            Document Sharing
          </Link>
        </div>

        <div className="navbar-menu">
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
                <Link className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`} to="/">
                  <FontAwesomeIcon icon={faHouse} />
                </Link>
              </li>

              <li className="navbar-item">
                <Link className={`navbar-link ${location.pathname === '/posts' ? 'active' : ''}`} to="/posts">
                  <FontAwesomeIcon icon={faComments} />
                </Link>
              </li>

              {user && (
                <>
                  {!user.isAdmin && (
                    <>
                      <li className="navbar-item">
                        <Link className={`navbar-link ${location.pathname === '/upload' ? 'active' : ''}`} to="/upload">
                          <FontAwesomeIcon icon={faUpload} />
                        </Link>
                      </li>

                      <li className="navbar-item">
                        <Link
                          className={`navbar-link ${location.pathname === '/notifications' ? 'active' : ''}`}
                          to="/notifications"
                        >
                          <FontAwesomeIcon icon={faBell} />
                          {unreadCount > 0 && (
                            <span className="nav-notification-badge">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </Link>
                      </li>

                      <li className="navbar-item">
                        <Link
                          className={`navbar-link ${location.pathname === '/follow' ? 'active' : ''}`}
                          to="/follow"
                        >
                          <FontAwesomeIcon icon={faHeart} />
                        </Link>
                      </li>
                      <li className="navbar-item">
                        <Link
                          className={`navbar-link avatar-link ${user?.isVip ? 'vip' : ''} ${location.pathname === '/profile' ? 'active' : ''
                            }`}
                          to="/profile"
                          onClick={() => setMenuOpen(false)}
                        >
                          <img
                            src={getFullAvatarUrl(user?.avatarUrl || user?.AvatarUrl || null)}
                            alt="User Avatar"
                            className={`navbar-avatar ${user?.isVip ? 'vip-avatar' : ''}`}
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFullAvatarUrl(null); }}
                          />
                          {user?.isVip && <span className="vip-badge">PREMIUM</span>}
                        </Link>
                      </li>


                    </>
                  )}

                  {user.isAdmin && (
                    <>
                      <li className="navbar-item">
                        <Link
                          className={`navbar-link ${location.pathname === '/admin' ? 'active' : ''}`}
                          to="/admin"
                          onClick={() => setMenuOpen(false)}
                          title="Admin Dashboard"
                        >
                          <FontAwesomeIcon icon={faGears} />
                        </Link>
                      </li>
                    </>
                  )}

                  <li className="navbar-item dropdown" ref={dropdownRef}>
                    <button className="navbar-link dropdown-toggle" onClick={toggleMenu}>
                      <FontAwesomeIcon icon={faBars} />
                    </button>

                    {menuOpen && (
                      <ul className="dropdown-menu">
                        {!user.isAdmin ? (
                          <li>
                            <Link
                              className={`drop-menu-btn ${location.pathname === '/upgrade-account' ? 'active' : ''}`}
                              to="/upgrade-account"
                              onClick={() => setMenuOpen(false)}
                            >
                              <FontAwesomeIcon icon={faUser} /> Nâng cấp tài khoản
                            </Link>
                          </li>
                        ) : (
                          <li>
                            <Link
                              className={`drop-menu-btn ${location.pathname === '/admin/payments' ? 'active' : ''}`}
                              to="/admin/payments"
                              onClick={() => setMenuOpen(false)}
                            >
                              <FontAwesomeIcon icon={faUser} /> Quản lý thanh toán
                            </Link>
                          </li>
                        )}
                        <li>
                          <button
                            className="logout-button"
                            onClick={() => {
                              handleLogout();
                              setMenuOpen(false);
                            }}
                          >
                            <FontAwesomeIcon icon={faRightFromBracket} /> Đăng xuất
                          </button>
                        </li>
                      </ul>
                    )}
                  </li>
                </>
              )}

              {!user && (
                <>
                  <li className="navbar-item">
                    <Link className={`navbar-link ${location.pathname === '/login' ? 'active' : ''}`} to="/login">
                      <FontAwesomeIcon icon={faRightToBracket} />
                    </Link>
                  </li>
                  <li className="navbar-item">
                    <Link className={`navbar-link ${location.pathname === '/register' ? 'active' : ''}`} to="/register">
                      <FontAwesomeIcon icon={faUserPlus} />
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
