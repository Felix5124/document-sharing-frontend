import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công!');
    navigate('/login');
  };

  // Log để debug
  console.log('Navbar user:', user);

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
            {user && (
              <>
                {!user.checkAdmin && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/upload">Tải lên tài liệu</Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">Hồ sơ</Link>
                </li>
                {user.checkAdmin && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/admin">Quản trị</Link>
                  </li>
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