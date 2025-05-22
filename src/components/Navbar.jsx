// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { getUserNotifications } from '../services/api';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadNotifications = async () => {
    if (!user || user.isAdmin) return; 
    try {
      const response = await getUserNotifications(user.userId);
      let data = response.data;
            if (data && Array.isArray(data.$values)) {
        data = data.$values;
      } else if (!Array.isArray(data)) {
        // Nếu data không phải mảng và cũng không phải object có $values, coi như mảng rỗng để tránh lỗi
        console.warn("Dữ liệu thông báo không đúng định dạng mảng:", response.data);
        data = [];
      }
      const unread = data.filter((notification) => !notification.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Fetch unread notifications error:', error);
      // setUnreadCount(0); // Reset nếu có lỗi
    }

  };

  useEffect(() => {
    if (user && !user.isAdmin) {
    fetchUnreadNotifications();

    const interval = setInterval(() => {
      fetchUnreadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  } else {
      setUnreadCount(0); // Reset unread count nếu là admin hoặc không có user
    }
  }, [user]);


  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công!');
    navigate('/login');
  };


  return (
    <nav className="navbar navbar-expand-lg navbar-dark custom-navbar">
      <div className="container">
        <Link className="navbar-brand" to="/">Document Sharing</Link>
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
              <Link className="nav-link" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/posts">Diễn đàn</Link>
            </li>
            {user && (
              <>
                {/* Menu cho admin */}
                {user.isAdmin ? (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/profile">Hồ sơ</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/admin">Quản trị</Link>
                    </li>
                  </>
                ) : (
                  /* Menu cho người dùng thông thường */
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/upload">Tải lên tài liệu</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/profile">Hồ sơ</Link>
                    </li>
                    <li className="nav-item" style={{ position: 'relative' }}>
                      <Link className="nav-link" to="/notifications">
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
                      <Link className="nav-link" to="/follow">Theo dõi</Link>
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
                  <Link className="nav-link" to="/login">Đăng nhập</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Đăng ký</Link>
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