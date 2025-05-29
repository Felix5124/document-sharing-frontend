import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { auth } from '../config/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword
} from "firebase/auth";

function Login() {
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { user: authUser, isLoading: isAuthContextLoading } = useContext(AuthContext);
  const [emailPassLoading, setEmailPassLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Điều hướng sau khi đăng nhập
  useEffect(() => {
    if (!isAuthContextLoading && authUser) {
      console.log("[Login.jsx useEffect] AuthUser:", {
        userId: authUser.userId,
        isAdmin: authUser.isAdmin,
        email: authUser.email
      }, "isAuthContextLoading:", isAuthContextLoading);
      if (authUser.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [authUser, navigate, isAuthContextLoading]);

  // Đăng nhập bằng Email/Password
  const onSubmit = async (data) => {
    setEmailPassLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.Email, data.Password);
    } catch (error) {
      console.error('Lỗi đăng nhập Email/Password:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('Email hoặc mật khẩu không hợp lệ.');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Quá nhiều lần thử, tài khoản tạm thời bị khóa.');
      } else {
        toast.error('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setEmailPassLoading(false);
    }
  };

  // Đăng nhập bằng Google với signInWithPopup
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Google popup login successful:", result.user.uid);
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        toast.info('Yêu cầu đăng nhập Google đã bị hủy.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('Tài khoản đã tồn tại với phương thức đăng nhập khác.');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup bị chặn bởi trình duyệt. Vui lòng cho phép popup.');
      } else {
        toast.error("Full error:", error);
        toast.error('Error message:', JSON.stringify(error));
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
                className="form-control"
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
                className="form-control"
                {...formRegister('Password', { required: 'Vui lòng nhập mật khẩu' })}
              />
            </div>
            {errors.Password && <p className="error-message">{errors.Password.message}</p>}
          </div>
          <div className="button-group">
            <div className="button-row">
              <button
                type="submit"
                className="submit-button auth-button"
                disabled={emailPassLoading || googleLoading || isAuthContextLoading}
              >
                {emailPassLoading || (isAuthContextLoading && !googleLoading) ? (
                  <><i className="bi bi-arrow-clockwise spinning me-2"></i> Đang xử lý...</>
                ) : (
                  <><i className="bi bi-box-arrow-in-right me-2"></i> Đăng nhập</>
                )}
              </button>
            </div>
            <div className="button-row divider-row">
              <span className="divider-text">Hoặc</span>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="submit-button google-button auth-button"
                onClick={handleGoogleLogin}
                disabled={emailPassLoading || googleLoading || isAuthContextLoading}
              >
                {googleLoading || (isAuthContextLoading && !emailPassLoading) ? (
                  <><i className="bi bi-arrow-clockwise spinning me-2"></i> Đang xử lý...</>
                ) : (
                  <><i className="bi bi-google me-2"></i> Đăng nhập với Google</>
                )}
              </button>
            </div>
          </div>
        </form>

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