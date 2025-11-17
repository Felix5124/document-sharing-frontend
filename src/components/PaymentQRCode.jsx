import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import { checkPaymentStatus } from '../services/api';
import '../styles/PaymentQRCode.css';

function PaymentQRCode({ paymentData, onPaymentComplete }) {
  const [checking, setChecking] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Calculate expiry time
  useEffect(() => {
    if (!paymentData?.expiredAt) return;

    const timer = setInterval(() => {
      const now = new Date();
      const expiry = new Date(paymentData.expiredAt);
      const diff = expiry - now;

      if (diff <= 0) {
        setCountdown('Đã hết hạn');
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentData]);

  const handleCheckStatus = async () => {
    if (!paymentData?.orderCode) return;

    setChecking(true);
    try {
      const res = await checkPaymentStatus(paymentData.orderCode);
      const status = res.data.status;

      if (status === 'Completed') {
        toast.success('Thanh toán thành công! Tài khoản VIP đã được kích hoạt.');
        if (onPaymentComplete) {
          onPaymentComplete(res.data);
        }
      } else if (status === 'Pending') {
        toast.info('Thanh toán đang chờ xác nhận từ admin.');
      } else if (status === 'Cancelled') {
        toast.error('Đơn hàng đã bị hủy.');
      } else if (status === 'Expired') {
        toast.error('Đơn hàng đã hết hạn.');
      }
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái:', error);
      toast.error('Không thể kiểm tra trạng thái thanh toán.');
    } finally {
      setChecking(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép!');
  };

  if (!paymentData) return null;

  return (
    <div className="payment-qr-container">
      <div className="payment-header">
        <h3>Thanh toán gói VIP</h3>
        {countdown && (
          <div className="expiry-countdown">
            <span>Hết hạn sau: </span>
            <strong>{countdown}</strong>
          </div>
        )}
      </div>

      <div className="payment-content">
        {/* QR Code Section */}
        <div className="qr-section">
          <h4>Quét mã QR để thanh toán</h4>
          {paymentData.qrCodeUrl ? (
            <img 
              src={paymentData.qrCodeUrl} 
              alt="VietQR Code" 
              className="qr-code-image"
            />
          ) : (
            <div className="qr-placeholder">QR Code không khả dụng</div>
          )}
          <p className="qr-instruction">
            Mở app ngân hàng và quét mã QR này để thanh toán
          </p>
        </div>

        {/* Bank Info Section */}
        <div className="bank-info-section">
          <h4>Hoặc chuyển khoản thủ công</h4>
          <div className="info-group">
            <label>Ngân hàng:</label>
            <div className="info-value">
              <span>{paymentData.bankName}</span>
            </div>
          </div>

          <div className="info-group">
            <label>Số tài khoản:</label>
            <div className="info-value">
              <span>{paymentData.bankAccountNumber}</span>
              <button 
                onClick={() => copyToClipboard(paymentData.bankAccountNumber)}
                className="copy-btn"
              >
                📋 Sao chép
              </button>
            </div>
          </div>

          <div className="info-group">
            <label>Chủ tài khoản:</label>
            <div className="info-value">
              <span>{paymentData.accountHolderName}</span>
            </div>
          </div>

          <div className="info-group">
            <label>Số tiền:</label>
            <div className="info-value">
              <span className="amount">{paymentData.amount?.toLocaleString()} VND</span>
              <button 
                onClick={() => copyToClipboard(paymentData.amount?.toString())}
                className="copy-btn"
              >
                📋 Sao chép
              </button>
            </div>
          </div>

          <div className="info-group highlight">
            <label>Nội dung chuyển khoản:</label>
            <div className="info-value">
              <code>{paymentData.transferContent}</code>
              <button 
                onClick={() => copyToClipboard(paymentData.transferContent)}
                className="copy-btn"
              >
                📋 Sao chép
              </button>
            </div>
          </div>

          <div className="warning-box">
            ⚠️ <strong>LƯU Ý QUAN TRỌNG:</strong><br/>
            Nhập chính xác nội dung <code>{paymentData.transferContent}</code> để đơn hàng được xác nhận nhanh chóng.
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="order-info">
        <div className="info-row">
          <span>Mã đơn hàng:</span>
          <strong>{paymentData.orderCode}</strong>
        </div>
        <div className="info-row">
          <span>Loại gói:</span>
          <strong>{paymentData.subscriptionType === 'Monthly' ? 'Tháng' : 'Năm'}</strong>
        </div>
        <div className="info-row">
          <span>Trạng thái:</span>
          <strong className={`status-${paymentData.status?.toLowerCase()}`}>
            {paymentData.status === 'Pending' ? 'Chờ thanh toán' : paymentData.status}
          </strong>
        </div>
      </div>

      {/* Check Status Button */}
      <button 
        onClick={handleCheckStatus} 
        disabled={checking}
        className="check-status-btn"
      >
        {checking ? 'Đang kiểm tra...' : '🔄 Kiểm tra trạng thái thanh toán'}
      </button>

      <div className="payment-footer">
        <p>Sau khi chuyển khoản thành công, vui lòng đợi admin xác nhận (thường trong vòng 5-30 phút).</p>
      </div>
    </div>
  );
}

PaymentQRCode.propTypes = {
  paymentData: PropTypes.shape({
    paymentId: PropTypes.number,
    orderCode: PropTypes.string,
    subscriptionType: PropTypes.string,
    amount: PropTypes.number,
    status: PropTypes.string,
    transferContent: PropTypes.string,
    bankAccountNumber: PropTypes.string,
    bankName: PropTypes.string,
    accountHolderName: PropTypes.string,
    qrCodeUrl: PropTypes.string,
    expiredAt: PropTypes.string,
  }),
  onPaymentComplete: PropTypes.func,
};

export default PaymentQRCode;
