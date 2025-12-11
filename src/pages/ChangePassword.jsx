import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { changePassword } from '../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faLock, faKey } from '@fortawesome/free-solid-svg-icons';
import { getAuth } from 'firebase/auth';
import '../styles/pages/ChangePassword.css';

function ChangePassword() {
  const { user } = useContext(AuthContext);
  const [isPasswordProvider, setIsPasswordProvider] = useState(true);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Check if user logged in with password or OAuth provider (Google/Facebook)
  useEffect(() => {
    const checkAuthProvider = () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.providerData) {
        // Check if user has password provider
        const hasPasswordProvider = currentUser.providerData.some(
          provider => provider.providerId === 'password'
        );
        setIsPasswordProvider(hasPasswordProvider);
        
        console.log('Auth providers:', currentUser.providerData.map(p => p.providerId));
        console.log('Has password provider:', hasPasswordProvider);
      }
    };

    checkAuthProvider();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await changePassword({
        email: user.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      toast.success('Đổi mật khẩu thành công!');
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
    } catch (error) {
      console.error('=== Change Password Error ===');
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.response?.data?.message);
      
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu';
      toast.error(errorMessage);
      
      if (errorMessage.includes('Mật khẩu hiện tại không đúng')) {
        setErrors({ currentPassword: errorMessage });
      } else if (errorMessage.includes('Google/Facebook')) {
        // User đăng ký bằng OAuth provider
        setErrors({ currentPassword: 'Tài khoản này đăng ký bằng Google/Facebook, không thể đổi mật khẩu' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị thông báo nếu user đăng nhập bằng OAuth provider (Google/Facebook)
  if (!isPasswordProvider) {
    return (
      <div className="change-password-container">
        <div className="change-password-card">
          <div className="change-password-header">
            <FontAwesomeIcon icon={faLock} className="header-icon" />
            <h2>Đổi Mật Khẩu</h2>
          </div>
          <div className="auth-provider-notice">
            <p>
              Tài khoản của bạn đăng nhập bằng Google/Facebook nên không sử dụng mật khẩu.
            </p>
            <p>
              Nếu muốn đặt mật khẩu cho tài khoản, vui lòng liên hệ hỗ trợ.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <div className="change-password-header">
          <FontAwesomeIcon icon={faKey} className="header-icon" />
          <h2>Đổi Mật Khẩu</h2>
        </div>

        <form onSubmit={handleSubmit} className="change-password-form">
          {/* Current Password */}
          <div className="form-group">
            <label htmlFor="currentPassword">
              <FontAwesomeIcon icon={faLock} /> Mật khẩu hiện tại
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.current ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={errors.currentPassword ? 'error' : ''}
                placeholder="Nhập mật khẩu hiện tại"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => togglePasswordVisibility('current')}
                tabIndex="-1"
              >
                <FontAwesomeIcon icon={showPasswords.current ? faEyeSlash : faEye} />
              </button>
            </div>
            {errors.currentPassword && (
              <span className="error-message">{errors.currentPassword}</span>
            )}
          </div>

          {/* New Password */}
          <div className="form-group">
            <label htmlFor="newPassword">
              <FontAwesomeIcon icon={faKey} /> Mật khẩu mới
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.new ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={errors.newPassword ? 'error' : ''}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => togglePasswordVisibility('new')}
                tabIndex="-1"
              >
                <FontAwesomeIcon icon={showPasswords.new ? faEyeSlash : faEye} />
              </button>
            </div>
            {errors.newPassword && (
              <span className="error-message">{errors.newPassword}</span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              <FontAwesomeIcon icon={faKey} /> Xác nhận mật khẩu mới
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder="Nhập lại mật khẩu mới"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => togglePasswordVisibility('confirm')}
                tabIndex="-1"
              >
                <FontAwesomeIcon icon={showPasswords.confirm ? faEyeSlash : faEye} />
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-change-password"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faKey} />
                  Đổi mật khẩu
                </>
              )}
            </button>
          </div>

          {/* Security Tips */}
          <div className="security-tips">
            <h4>💡 Mẹo bảo mật:</h4>
            <ul>
              <li>Sử dụng mật khẩu mạnh với ít nhất 8 ký tự</li>
              <li>Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</li>
              <li>Không sử dụng thông tin cá nhân dễ đoán</li>
              <li>Không chia sẻ mật khẩu với bất kỳ ai</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
