import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { auth } from '../config/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  // signOut, // signOut sẽ được gọi từ AuthContext hoặc component khác khi cần
  signInWithEmailAndPassword
} from "firebase/auth";

function Login() {
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { user: authUser, isLoading: isAuthContextLoading } = useContext(AuthContext);
  const [emailPassLoading, setEmailPassLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Đặt khối logic điều hướng vào lại trong useEffect
  useEffect(() => {
    // Chỉ điều hướng khi AuthContext đã xử lý xong (isLoading = false) và có người dùng
    if (!isAuthContextLoading && authUser) {
      console.log("[Login.jsx useEffect] AuthUser for navigation:",
        authUser ? { userId: authUser.userId, isAdmin: authUser.isAdmin, email: authUser.email } : null,
        "isAuthContextLoading:", isAuthContextLoading
      );
      if (authUser.isAdmin) {
        console.log("[Login.jsx useEffect] User is admin, navigating to /admin.");
        navigate('/admin');
      } else {
        console.log("[Login.jsx useEffect] User is NOT admin, navigating to /.");
        navigate('/');
      }
    } else { // Bạn có thể giữ lại phần else này để log hoặc bỏ đi nếu không cần thiết
      console.log("[Login.jsx useEffect] Conditions not met for navigation (or still loading/no user):",
        { isAuthContextLoading, authUser: authUser ? 'exists' : 'null' }
      );
    }
  }, [authUser, navigate, isAuthContextLoading]); // Mảng dependencies cho useEffect

  // Đăng nhập bằng Email/Password với Firebase
  const onSubmit = async (data) => {
    setEmailPassLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.Email, data.Password);
      // AuthContext.onAuthStateChanged sẽ tự động xử lý phần còn lại
    } catch (error) {
      console.error('Lỗi đăng nhập Email/Password với Firebase:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('Email hoặc mật khẩu không hợp lệ.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Quá nhiều lần thử, tài khoản tạm thời bị khóa. Vui lòng thử lại sau.');
      } else {
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setEmailPassLoading(false);
    }
  };

  // Đăng nhập bằng Google với Firebase
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // AuthContext.onAuthStateChanged sẽ tự động xử lý phần còn lại
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        toast.info('Yêu cầu đăng nhập Google đã bị đóng/hủy.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('Tài khoản đã tồn tại với một phương thức đăng nhập khác. Vui lòng sử dụng phương thức đó.');
      } else {
        toast.error(`Đăng nhập Google thất bại: ${error.message}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          <i className="bi bi-box-arrow-in-right me-2"></i> Đăng nhập
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <i className="bi bi-envelope input-icon"></i>
              <input
                type="email"
                className="form-input"
                {...formRegister('Email', {
                  required: 'Vui lòng nhập email',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Email không hợp lệ',
                  },
                })}
              />
            </div>
            {errors.Email && <p className="error-message">{errors.Email.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="input-wrapper">
              <i className="bi bi-lock input-icon"></i>
              <input
                type="password"
                className="form-input"
                {...formRegister('Password', { required: 'Vui lòng nhập mật khẩu' })}
              />
            </div>
            {errors.Password && <p className="error-message">{errors.Password.message}</p>}
          </div>
          <button type="submit" className="submit-button" disabled={emailPassLoading || googleLoading || isAuthContextLoading}>
            {emailPassLoading || (isAuthContextLoading && !googleLoading) ? (
              <><i className="bi bi-arrow-clockwise spinning me-2"></i> Đang xử lý...</>
            ) : (
              <><i className="bi bi-box-arrow-in-right me-2"></i> Đăng nhập</>
            )}
          </button>
        </form>

        <div style={{ marginTop: '15px', marginBottom: '15px', textAlign: 'center' }}>Hoặc</div>
        <button
          type="button"
          className="submit-button google-button"
          onClick={handleGoogleLogin}
          disabled={emailPassLoading || googleLoading || isAuthContextLoading}
          style={{ backgroundColor: '#4285F4', color: 'white' }}
        >
          {googleLoading || (isAuthContextLoading && !emailPassLoading) ? (
            <><i className="bi bi-arrow-clockwise spinning me-2"></i> Đang xử lý...</>
          ) : (
            <><i className="bi bi-google me-2"></i> Đăng nhập với Google</>
          )}
        </button>

        <p className="auth-link">
          Chưa có tài khoản?{' '}
          <span onClick={() => navigate('/register')} className="link-text">
            Đăng ký ngay
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;