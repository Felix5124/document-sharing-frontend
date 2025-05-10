import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { register } from '../services/api';

function Register() {
  const { register: formRegister, handleSubmit, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const password = watch('Password'); // Lấy giá trị mật khẩu để so sánh

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await register(data);
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác minh.');
      navigate('/login');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Đăng ký</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <label className="form-label">Họ tên</label>
          <input
            type="text"
            className="form-control"
            {...formRegister('FullName', { required: 'Vui lòng nhập họ tên' })}
          />
          {errors.FullName && <p className="text-danger">{errors.FullName.message}</p>}
        </div>
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
            {...formRegister('Password', {
              required: 'Vui lòng nhập mật khẩu',
              minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
            })}
          />
          {errors.Password && <p className="text-danger">{errors.Password.message}</p>}
        </div>
        <div className="mb-3">
          <label className="form-label">Xác nhận mật khẩu</label>
          <input
            type="password"
            className="form-control"
            {...formRegister('ConfirmPassword', {
              required: 'Vui lòng xác nhận mật khẩu',
              validate: (value) => value === password || 'Mật khẩu không khớp',
            })}
          />
          {errors.ConfirmPassword && <p className="text-danger">{errors.ConfirmPassword.message}</p>}
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Đăng ký'}
        </button>
      </form>
    </div>
  );
}

export default Register;