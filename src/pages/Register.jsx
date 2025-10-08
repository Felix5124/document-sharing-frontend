import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-toastify';
import { register } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUser, faUserPlus, faSpinner, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

import '../styles/pages/Register.css';

function Register() {
  const { register: formRegister, handleSubmit, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAccept, setShowPasswordAccept] = useState(false);
  const password = watch('Password'); // Lấy giá trị mật khẩu để so sánh

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        Email: data.Email,
        Password: data.Password,
        FullName: data.FullName
      };
      const response = await register(payload);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Tài khoản đã tồn tại. Vui lòng thử lại.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          Đăng ký
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label">Họ tên</label>
            <div className="input-wrapper">
              <FontAwesomeIcon icon={faUser} className="input-icon" />
              <input
                type="text"
                className="form-control"
                placeholder='Nhập họ tên của bạn'
                {...formRegister('FullName', { required: 'Vui lòng nhập họ tên' })}
              />
            </div>
            {errors.FullName && <p className="error-message">{errors.FullName.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
              <input
                type="email"
                className="form-control"
                placeholder='Nhập email của bạn'
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
              <FontAwesomeIcon icon={faLock} className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder='Nhập mật khẩu của bạn'
                {...formRegister('Password', {
                  required: 'Vui lòng nhập mật khẩu',
                  minLength: { value: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
                })}
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(prev => !prev)}
              ><FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} /></span>
            </div>
            {errors.Password && <p className="error-message">{errors.Password.message}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Xác nhận mật khẩu</label>
            <div className="input-wrapper">
              <FontAwesomeIcon icon={faLock} className="input-icon" />
              <input
                type={showPasswordAccept ? "text" : "password"}
                className="form-control"
                placeholder='Xác nhận mật khẩu của bạn'
                {...formRegister('ConfirmPassword', {
                  required: 'Vui lòng xác nhận mật khẩu',
                  validate: (value) => value === password || 'Mật khẩu không khớp',
                })}
              />
              <span
                className="toggle-password"
                onClick={() => setShowPasswordAccept(prev => !prev)}
              ><FontAwesomeIcon icon={showPasswordAccept ? faEyeSlash : faEye} /></span>
            </div>
            {errors.ConfirmPassword && <p className="error-message">{errors.ConfirmPassword.message}</p>}
          </div>
          <div className="button-group">
            <div className="button-row">
              <button type="submit" className="submit-button auth-button" disabled={loading}>
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Đang xử lý...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUserPlus} /> Đăng ký
                  </>
                )}
              </button>
            </div>
            <div className="button-row">
              <p className="auth-link">
                Đã có tài khoản?{' '}
                <span onClick={() => navigate('/login')} className="link-text">
                  Đăng nhập ngay
                </span>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;