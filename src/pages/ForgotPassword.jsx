import { useState } from 'react';
import { forgotPassword } from '../services/api';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import '../styles/pages/ForgotPassword.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error('Vui lòng nhập email');
            return;
        }

        setLoading(true);

        try {
            const response = await forgotPassword({ email });
            toast.success(response.message || 'Email đặt lại mật khẩu đã được gửi');
            setSubmitted(true);
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="forgot-password-container">
                <div className="forgot-password-card">
                    <h2>Kiểm tra email của bạn</h2>
                    <p className="success-message">
                        Chúng tôi đã gửi link đặt lại mật khẩu đến <strong>{email}</strong>
                    </p>
                    <p className="instruction">
                        Vui lòng kiểm tra hộp thư (và cả thư mục spam) để tìm email từ chúng tôi.
                        Link sẽ hết hạn sau 1 giờ.
                    </p>
                    <div className="actions">
                        <Link to="/login" className="back-to-login-btn">
                            <FontAwesomeIcon icon={faArrowLeft} /> Quay lại đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <div className="header">
                    <h2>Quên mật khẩu?</h2>
                    <p>Nhập email của bạn để nhận link đặt lại mật khẩu</p>
                </div>

                <form onSubmit={handleSubmit} className="forgot-password-form">
                    <div className="form-group">
                        <label htmlFor="email">
                            <FontAwesomeIcon icon={faEnvelope} /> Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email của bạn"
                            disabled={loading}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
                    </button>

                    <div className="back-to-login">
                        <Link to="/login">
                            <FontAwesomeIcon icon={faArrowLeft} /> Quay lại đăng nhập
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ForgotPassword;
