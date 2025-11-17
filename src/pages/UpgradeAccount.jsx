import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { createPayment, getUserPayments } from "../services/api";
import { toast } from "react-toastify";
import PaymentQRCode from "../components/PaymentQRCode";
import "../styles/UpgradeAccount.css";

function UpgradeAccount() {
  const { user, setUser } = useContext(AuthContext);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const plans = [
    {
      type: "Monthly",
      name: "Gói Tháng",
      price: 50000,
      duration: "1 tháng",
      benefits: [
        "Tải xuống không giới hạn",
        "Xem trước tài liệu VIP",
        "Không quảng cáo",
        "Hỗ trợ ưu tiên"
      ]
    },
    {
      type: "Yearly",
      name: "Gói Năm",
      price: 500000,
      duration: "12 tháng",
      discount: "Tiết kiệm 100,000đ",
      benefits: [
        "Tất cả quyền lợi gói tháng",
        "Giảm giá 16%",
        "Ưu đãi đặc biệt",
        "Badge VIP vàng"
      ]
    }
  ];

  useEffect(() => {
    if (user?.userId) {
      loadPaymentHistory();
    }
  }, [user]);

  const loadPaymentHistory = async () => {
    try {
      const res = await getUserPayments(user.userId);
      setPaymentHistory(res.data || []);
    } catch (error) {
      console.error("Lỗi khi tải lịch sử thanh toán:", error);
    }
  };

  const handleCreatePayment = async (plan) => {
    if (!user) {
      toast.error("Bạn cần đăng nhập trước khi nâng cấp!");
      return;
    }

    setLoading(true);
    try {
      const data = {
        userId: user.userId,
        subscriptionType: plan.type
      };

      const res = await createPayment(data);
      setPaymentData(res.data);
      setSelectedPlan(plan);
      toast.success("Đã tạo đơn thanh toán! Vui lòng quét QR hoặc chuyển khoản.");
    } catch (error) {
      console.error("Lỗi khi tạo thanh toán:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tạo đơn thanh toán.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = (completedPayment) => {
    // Refresh user data
    if (user) {
      setUser({
        ...user,
        isVip: true,
        vipExpiryDate: completedPayment.vipExpiryDate
      });
    }
    
    // Reload payment history
    loadPaymentHistory();
    
    // Clear payment data to show plans again
    setTimeout(() => {
      setPaymentData(null);
      setSelectedPlan(null);
    }, 3000);
  };

  const getStatusBadge = (status) => {
    const badges = {
      Pending: { text: "Chờ thanh toán", className: "badge-pending" },
      Completed: { text: "Thành công", className: "badge-success" },
      Cancelled: { text: "Đã hủy", className: "badge-danger" },
      Expired: { text: "Hết hạn", className: "badge-secondary" }
    };
    return badges[status] || { text: status, className: "badge-default" };
  };

  return (
    <div className="all-container">
      <div className="all-container-card upgrade-account-container">
        <div className="upload-title">
          <h4>Nâng cấp tài khoản VIP</h4>
        </div>

        {/* Show current VIP status */}
        {user?.isVip && user?.vipExpiryDate && (
          <div className="vip-status-box">
            <div className="vip-badge">👑 VIP</div>
            <p>
              Tài khoản VIP của bạn còn hiệu lực đến:{" "}
              <strong>{new Date(user.vipExpiryDate).toLocaleDateString("vi-VN")}</strong>
            </p>
            <p className="vip-note">Bạn có thể gia hạn thêm bất cứ lúc nào.</p>
          </div>
        )}

        {/* Show payment QR if payment is created */}
        {paymentData ? (
          <div className="payment-section">
            <PaymentQRCode 
              paymentData={paymentData} 
              onPaymentComplete={handlePaymentComplete}
            />
            <button 
              onClick={() => {
                setPaymentData(null);
                setSelectedPlan(null);
              }}
              className="back-btn"
            >
              ← Quay lại chọn gói khác
            </button>
          </div>
        ) : (
          <>
            {/* Show plans */}
            <div className="upgrade-content">
              <p className="intro-text">
                Nâng cấp lên VIP để trải nghiệm đầy đủ tính năng của hệ thống!
              </p>

              <div className="plans-container">
                {plans.map((plan) => (
                  <div 
                    key={plan.type} 
                    className={`plan-card ${selectedPlan?.type === plan.type ? 'selected' : ''}`}
                  >
                    {plan.discount && (
                      <div className="discount-badge">{plan.discount}</div>
                    )}
                    <h3>{plan.name}</h3>
                    <div className="plan-price">
                      <span className="price">{plan.price.toLocaleString()}đ</span>
                      <span className="duration">/{plan.duration}</span>
                    </div>
                    <ul className="benefits-list">
                      {plan.benefits.map((benefit, idx) => (
                        <li key={idx}>✓ {benefit}</li>
                      ))}
                    </ul>
                    <button
                      className="select-plan-btn"
                      onClick={() => handleCreatePayment(plan)}
                      disabled={loading}
                    >
                      {loading ? "Đang xử lý..." : "Chọn gói này"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment history */}
            <div className="payment-history-section">
              <button 
                className="toggle-history-btn"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? "Ẩn" : "Xem"} lịch sử thanh toán
              </button>

              {showHistory && (
                <div className="history-list">
                  {paymentHistory.length === 0 ? (
                    <p className="no-history">Chưa có lịch sử thanh toán</p>
                  ) : (
                    <table className="history-table">
                      <thead>
                        <tr>
                          <th>Mã đơn</th>
                          <th>Gói</th>
                          <th>Số tiền</th>
                          <th>Trạng thái</th>
                          <th>Ngày tạo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((payment) => {
                          const badge = getStatusBadge(payment.status);
                          return (
                            <tr key={payment.paymentId}>
                              <td>{payment.orderCode}</td>
                              <td>{payment.subscriptionType === 'Monthly' ? 'Tháng' : 'Năm'}</td>
                              <td>{payment.amount.toLocaleString()}đ</td>
                              <td>
                                <span className={`status-badge ${badge.className}`}>
                                  {badge.text}
                                </span>
                              </td>
                              <td>{new Date(payment.createdAt).toLocaleDateString("vi-VN")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default UpgradeAccount;

