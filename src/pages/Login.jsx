import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { login } from '../services/api';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const { register: formRegister, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const { login: authLogin } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await login(data);
      console.log('Login response:', response.data);
      const userData = response.data.user || response.data;
      const token = response.data.token;

      if (!token || typeof token !== 'string') {
        throw new Error('Token không hợp lệ từ server.');
      }
      if (!userData.userId) {
        throw new Error('Không nhận được UserId từ server.');
      }

      console.log('Received user:', userData, 'Token:', token);

      authLogin(userData, token);

      if (userData.checkAdmin === true) {
        navigate('/admin');
      } else {
        navigate('/');
      }

      toast.success('Đăng nhập thành công!');
    } catch (error) {
      const errorMessage = error.response?.data || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.';
      console.error('Login error:', errorMessage);
      if (error.response?.status === 401 && errorMessage === 'Tài khoản đã bị khóa.') {
        toast.error('Tài khoản đã bị khóa.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
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
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? (
              <>
                <i className="bi bi-arrow-clockwise spinning me-2"></i> Đang xử lý...
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2"></i> Đăng nhập
              </>
            )}
          </button>
          <p className="auth-link">
            Chưa có tài khoản?{' '}
            <span onClick={() => navigate('/register')} className="link-text">
              Đăng ký ngay
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;