import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getPendingPayments, confirmPayment, cancelPayment } from "../services/api";
import { toast } from "react-toastify";
import "../styles/AdminPayments.css";

function AdminPayments() {
  const { user } = useContext(AuthContext);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user?.isAdmin) {
      loadPendingPayments();
      // Auto refresh every 30 seconds
      const interval = setInterval(loadPendingPayments, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadPendingPayments = async () => {
    setLoading(true);
    try {
      const res = await getPendingPayments();
      setPendingPayments(res.data || []);
    } catch (error) {
      console.error("Lỗi khi tải danh sách thanh toán:", error);
      toast.error("Không thể tải danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClick = (payment) => {
    setSelectedPayment(payment);
    setNote("");
    setShowConfirmModal(true);
  };

  const handleCancelClick = (payment) => {
    setSelectedPayment(payment);
    setNote("");
    setShowCancelModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment || !user) return;

    setProcessing(true);
    try {
      const data = {
        paymentId: selectedPayment.paymentId,
        adminId: user.userId,
        note: note || "Đã xác nhận thanh toán"
      };

      await confirmPayment(data);
      toast.success("Đã xác nhận thanh toán thành công!");
      setShowConfirmModal(false);
      loadPendingPayments();
    } catch (error) {
      console.error("Lỗi khi xác nhận thanh toán:", error);
      toast.error(error.response?.data?.message || "Không thể xác nhận thanh toán");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!selectedPayment || !user) return;

    if (!note.trim()) {
      toast.error("Vui lòng nhập lý do hủy");
      return;
    }

    setProcessing(true);
    try {
      const data = {
        adminId: user.userId,
        note: note
      };

      await cancelPayment(selectedPayment.paymentId, data);
      toast.success("Đã hủy đơn thanh toán!");
      setShowCancelModal(false);
      loadPendingPayments();
    } catch (error) {
      console.error("Lỗi khi hủy thanh toán:", error);
      toast.error(error.response?.data?.message || "Không thể hủy thanh toán");
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép!");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getTimeRemaining = (expiredAt) => {
    const now = new Date();
    const expiry = new Date(expiredAt);
    const diff = expiry - now;

    if (diff <= 0) return "Đã hết hạn";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (!user?.isAdmin) {
    return (
      <div className="all-container">
        <div className="all-container-card">
          <p className="error-message">Chỉ admin mới có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="all-container">
      <div className="all-container-card admin-payments-container">
        <div className="upload-title">
          <h4>Quản lý thanh toán VIP</h4>
          <button onClick={loadPendingPayments} disabled={loading} className="refresh-btn">
            🔄 {loading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        {loading && pendingPayments.length === 0 ? (
          <div className="loading-spinner">Đang tải...</div>
        ) : pendingPayments.length === 0 ? (
          <div className="no-payments">
            <p>📭 Không có đơn thanh toán nào đang chờ xử lý</p>
          </div>
        ) : (
          <div className="payments-list">
            <p className="payments-count">
              Có <strong>{pendingPayments.length}</strong> đơn đang chờ xác nhận
            </p>

            {pendingPayments.map((payment) => (
              <div key={payment.paymentId} className="payment-card">
                <div className="payment-header-row">
                  <div className="payment-code">
                    <strong>#{payment.orderCode}</strong>
                    <button 
                      onClick={() => copyToClipboard(payment.orderCode)}
                      className="copy-icon-btn"
                      title="Sao chép mã đơn"
                    >
                      📋
                    </button>
                  </div>
                  <div className="payment-amount">
                    {payment.amount.toLocaleString()}đ
                  </div>
                </div>

                <div className="payment-info">
                  <div className="info-row">
                    <span className="label">Người dùng:</span>
                    <span className="value">{payment.userFullName} ({payment.userEmail})</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Gói VIP:</span>
                    <span className="value">
                      {payment.subscriptionType === 'Monthly' ? 'Tháng' : 'Năm'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Nội dung CK:</span>
                    <span className="value transfer-content">
                      <code>{payment.transferContent}</code>
                      <button 
                        onClick={() => copyToClipboard(payment.transferContent)}
                        className="copy-icon-btn"
                      >
                        📋
                      </button>
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Thông tin NH:</span>
                    <span className="value">
                      {payment.bankName} - {payment.bankAccountNumber}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Thời gian tạo:</span>
                    <span className="value">{formatDate(payment.createdAt)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Còn lại:</span>
                    <span className="value expiry-time">
                      {getTimeRemaining(payment.expiredAt)}
                    </span>
                  </div>
                </div>

                <div className="payment-actions">
                  <button 
                    onClick={() => handleConfirmClick(payment)}
                    className="btn-confirm"
                  >
                    ✅ Xác nhận thanh toán
                  </button>
                  <button 
                    onClick={() => handleCancelClick(payment)}
                    className="btn-cancel"
                  >
                    ❌ Hủy đơn
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confirm Modal */}
        {showConfirmModal && selectedPayment && (
          <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Xác nhận thanh toán</h3>
              <p>
                Bạn có chắc chắn muốn xác nhận thanh toán cho đơn hàng{" "}
                <strong>{selectedPayment.orderCode}</strong>?
              </p>
              <div className="modal-info">
                <p>Người dùng: <strong>{selectedPayment.userFullName}</strong></p>
                <p>Số tiền: <strong>{selectedPayment.amount.toLocaleString()}đ</strong></p>
                <p>Gói: <strong>{selectedPayment.subscriptionType === 'Monthly' ? 'Tháng' : 'Năm'}</strong></p>
              </div>
              <div className="form-group">
                <label>Ghi chú (tùy chọn):</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: Đã kiểm tra sao kê, user đã chuyển khoản đúng"
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button 
                  onClick={handleConfirmPayment} 
                  disabled={processing}
                  className="btn-primary"
                >
                  {processing ? "Đang xử lý..." : "Xác nhận"}
                </button>
                <button 
                  onClick={() => setShowConfirmModal(false)} 
                  disabled={processing}
                  className="btn-secondary"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && selectedPayment && (
          <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Hủy đơn thanh toán</h3>
              <p>
                Bạn có chắc chắn muốn hủy đơn hàng{" "}
                <strong>{selectedPayment.orderCode}</strong>?
              </p>
              <div className="form-group">
                <label>Lý do hủy <span className="required">*</span>:</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: User chuyển sai số tiền, nội dung không đúng..."
                  rows={3}
                  required
                />
              </div>
              <div className="modal-actions">
                <button 
                  onClick={handleCancelPayment} 
                  disabled={processing || !note.trim()}
                  className="btn-danger"
                >
                  {processing ? "Đang xử lý..." : "Xác nhận hủy"}
                </button>
                <button 
                  onClick={() => setShowCancelModal(false)} 
                  disabled={processing}
                  className="btn-secondary"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPayments;
