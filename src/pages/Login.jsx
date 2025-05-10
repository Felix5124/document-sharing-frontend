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
      const userData = response.data.user || response.data; // Đảm bảo lấy đúng user object
      const token = response.data.token;

      // Kiểm tra token và userData
      if (!token || typeof token !== 'string') {
        throw new Error('Token không hợp lệ từ server.');
      }
      if (!userData.userId) {
        throw new Error('Không nhận được UserId từ server.');
      }

      // Log để kiểm tra
      console.log('Received user:', userData, 'Token:', token);

      // Gọi authLogin để cập nhật state và localStorage
      authLogin(userData, token);

      // Kiểm tra isAdmin và chuyển hướng
      if (userData.isAdmin === true) {
        navigate('/admin');
      } else {
        navigate('/');
      }

      toast.success('Đăng nhập thành công!');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu.';
      console.error('Login error:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Đăng nhập</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <label className="form-label">Email</label>
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
          {errors.Email && <p className="text-danger">{errors.Email.message}</p>}
        </div>
        <div className="mb-3">
          <label className="form-label">Mật khẩu</label>
          <input
            type="password"
            className="form-control"
            {...formRegister('Password', { required: 'Vui lòng nhập mật khẩu' })}
          />
          {errors.Password && <p className="text-danger">{errors.Password.message}</p>}
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>
      </form>
    </div>
  );
}

export default Login;