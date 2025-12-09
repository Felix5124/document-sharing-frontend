import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { verifyEmail } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import '../styles/pages/VerifyEmail.css';

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Đang xác thực email của bạn...');
  const hasVerified = useRef(false); // Prevent duplicate verification

  useEffect(() => {
    const handleVerifyEmail = async () => {
      // Prevent duplicate calls
      if (hasVerified.current) {
        return;
      }
      hasVerified.current = true;

      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        setStatus('error');
        setMessage('Token hoặc email xác thực không hợp lệ.');
        return;
      }

      try {
        const response = await verifyEmail(token, email);

        if (response.status === 200) {
          setStatus('success');
          setMessage('Xác thực email thành công! Bạn có thể đăng nhập ngay.');
          
          const toastId = 'email-verified-success';
          if (!toast.isActive(toastId)) {
            toast.success('Email đã được xác thực thành công!', { toastId });
          }
        }
      } catch (error) {
        console.error('Lỗi xác thực email:', error);
        console.error('Response data:', error.response?.data);
        
        if (error.response?.status === 400) {
          const errorMsg = error.response.data?.message || error.response.data || 'Token xác thực không hợp lệ hoặc đã hết hạn.';
          
          // Nếu lỗi là "đã verify trước đó", coi như success
          if (errorMsg.includes('đã được xác thực trước đó') || errorMsg.includes('already verified')) {
            setStatus('success');
            setMessage('Email đã được xác thực! Bạn có thể đăng nhập ngay.');
            
            const toastId = 'email-already-verified';
            if (!toast.isActive(toastId)) {
              toast.info('Email đã được xác thực trước đó.', { toastId });
            }
          } else {
            setStatus('error');
            setMessage(errorMsg);
            
            const toastId = 'email-verify-error';
            if (!toast.isActive(toastId)) {
              toast.error(errorMsg, { toastId });
            }
          }
        } else {
          setStatus('error');
          setMessage('Xác thực email thất bại. Vui lòng thử lại.');
          
          const toastId = 'email-verify-failed';
          if (!toast.isActive(toastId)) {
            toast.error('Xác thực email thất bại!', { toastId });
          }
        }
      }
    };

    handleVerifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <div className={`verify-icon ${status}`}>
          {status === 'verifying' && <FontAwesomeIcon icon={faSpinner} spin size="4x" />}
          {status === 'success' && <FontAwesomeIcon icon={faCheckCircle} size="4x" />}
          {status === 'error' && <FontAwesomeIcon icon={faTimesCircle} size="4x" />}
        </div>
        
        <h2 className="verify-title">
          {status === 'verifying' && 'Đang xác thực'}
          {status === 'success' && 'Xác thực thành công'}
          {status === 'error' && 'Xác thực thất bại'}
        </h2>
        
        <p className="verify-message">{message}</p>
        
        {status === 'success' && (
          <button
            className="verify-button"
            onClick={() => navigate('/login')}
          >
            Đăng nhập ngay
          </button>
        )}
        
        {status === 'error' && (
          <button
            className="verify-button"
            onClick={() => navigate('/login')}
          >
            Quay lại đăng nhập
          </button>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
