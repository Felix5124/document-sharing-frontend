import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { createPayment, getUserPayments } from "../services/api";
import { toast } from "react-toastify";
import PaymentQRCode from "../components/PaymentQRCode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCrown, 
  faCheck, 
  faStar, 
  faDownload,
  faFileAlt,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import "../styles/pages/UpgradeAccount.css";

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
      name: "Premium 1 Tháng",
      price: 49000,
      duration: "1 Tháng",
      originalPrice: null,
      discount: null,
      saveAmount: null,
      icon: faStar,
      color: "#3b82f6",
      benefits: [
        "Tải xuống không giới hạn",
        "Xem trước tài liệu Premium",
        "Không quảng cáo",
        "Hỗ trợ ưu tiên",
        "Badge Premium đặc biệt"
      ],
      popular: false
    },
    {
      type: "Quarterly",
      name: "Premium 3 Tháng",
      price: 129000,
      duration: "3 Tháng",
      originalPrice: "147.000",
      discount: "-12%",
      saveAmount: "18.000đ",
      icon: faStar,
      color: "#8b5cf6",
      benefits: [
        "Tất cả quyền lợi gói 1 tháng",
        "Tiết kiệm 18.000đ",
        "Badge Premium tím đặc biệt",
        "Ưu tiên duyệt bài cao",
        "Hỗ trợ ưu tiên Premium"
      ],
      popular: true
    },
    {
      type: "Yearly",
      name: "Premium 12 Tháng",
      price: 499000,
      duration: "12 Tháng",
      originalPrice: "588.000",
      discount: "-15%",
      saveAmount: "89.000đ",
      icon: faCrown,
      color: "#f59e0b",
      benefits: [
        "Tất cả quyền lợi gói 3 tháng",
        "Tiết kiệm tới 89.000đ",
        "Badge Premium vàng độc quyền",
        "Ưu tiên duyệt bài cao nhất",
        "Quà tặng đặc biệt Premium"
      ],
      popular: false
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
      await loadPaymentHistory(); // Reload lịch sử ngay sau khi tạo payment
    } catch (error) {
      console.error("Lỗi khi tạo thanh toán:", error);
      console.error("Chi tiết lỗi:", error.response?.data);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi tạo đơn thanh toán.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = (completedPayment) => {
    // Refresh user data
    if (user && setUser && typeof setUser === 'function') {
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
    <div className="upgrade-account-container">
      <div className="upgrade-header">
        <FontAwesomeIcon icon={faCrown} className="upgrade-header-icon" />
        <h1 className="upgrade-title">Nâng Cấp Tài Khoản Premium</h1>
        <p className="upgrade-subtitle">
          Mở khóa trải nghiệm premium với nhiều tính năng độc quyền
        </p>
      </div>

      {/* Show current VIP status */}
      {user?.isVip && user?.vipExpiryDate && (
        <div className="vip-status-box">
          <div className="vip-badge-current">👑 Premium</div>
          <p>
            Tài khoản Premium của bạn còn hiệu lực đến:{" "}
            <strong>{new Date(user.vipExpiryDate).toLocaleDateString("vi-VN")}</strong>
          </p>
          <p className="vip-note">Bạn có thể gia hạn thêm bất cứ lúc nào.</p>
        </div>
      )}

      <div className="benefits-section">
        <div className="benefits-grid">
          <div className="benefit-card">
            <FontAwesomeIcon icon={faDownload} className="benefit-icon" />
            <h3>Tải Không Giới Hạn</h3>
            <p>Tải xuống tài liệu không giới hạn số lượng</p>
          </div>
          <div className="benefit-card">
            <FontAwesomeIcon icon={faFileAlt} className="benefit-icon" />
            <h3>Tài Liệu Premium</h3>
            <p>Truy cập độc quyền tài liệu Premium</p>
          </div>
          <div className="benefit-card">
            <FontAwesomeIcon icon={faLock} className="benefit-icon" />
            <h3>Không Quảng Cáo</h3>
            <p>Trải nghiệm mượt mà không bị gián đoạn</p>
          </div>
          <div className="benefit-card">
            <FontAwesomeIcon icon={faCrown} className="benefit-icon" />
            <h3>Badge Premium Đặc Biệt</h3>
            <p>Hiển thị đẳng cấp với badge độc quyền</p>
          </div>
        </div>
      </div>

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
                loadPaymentHistory(); // Reload lịch sử khi quay lại
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll lên đầu trang
              }}
              className="back-btn"
            >
              ← Quay lại chọn gói khác
            </button>
          </div>
        ) : (
          <>
            <div className="plans-section">
              <h2 className="plans-title">Chọn Gói Phù Hợp Với Bạn</h2>
              <div className="plans-grid">
                {plans.map((plan) => (
                  <div
                    key={plan.type}
                    className={`plan-card ${selectedPlan?.type === plan.type ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                  >
                    {plan.popular && (
                      <div className="popular-badge">
                        <FontAwesomeIcon icon={faStar} /> Phổ Biến Nhất
                      </div>
                    )}
                    
                    <div className="plan-header" style={{ background: `linear-gradient(135deg, ${plan.color} 0%, ${plan.color}dd 100%)` }}>
                      <FontAwesomeIcon icon={plan.icon} className="plan-icon" />
                      <h3 className="plan-name">{plan.name}</h3>
                      <p className="plan-duration">{plan.duration}</p>
                    </div>

                    <div className="plan-pricing">
                      <div className="price-wrapper">
                        <span className="price-amount">{(plan.price / 1000).toFixed(0)}</span>
                        <span className="price-currency">.000đ</span>
                      </div>
                      {plan.originalPrice && (
                        <div className="original-price">
                          <span className="strike-through">{plan.originalPrice}đ</span>
                          <span className="discount-badge-price">{plan.discount}</span>
                        </div>
                      )}
                    </div>

                    <div className="plan-features">
                      {plan.benefits.map((benefit, index) => (
                        <div key={index} className="feature-item">
                          <FontAwesomeIcon icon={faCheck} className="feature-check" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      className={`select-plan-btn ${selectedPlan?.type === plan.type ? 'selected' : ''}`}
                      style={selectedPlan?.type === plan.type ? { background: plan.color } : {}}
                      onClick={() => handleCreatePayment(plan)}
                      disabled={loading}
                    >
                      {loading ? "Đang xử lý..." : selectedPlan?.type === plan.type ? 'Đã Chọn' : 'Chọn Gói Này'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

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
                          const displayType = payment.subscriptionType === 'Monthly' ? '1 Tháng' 
                            : payment.subscriptionType === 'Quarterly' ? '3 Tháng' 
                            : '12 Tháng';
                          return (
                            <tr 
                              key={payment.paymentId}
                              onClick={() => {
                                if (payment.status === 'Pending') {
                                  setPaymentData(payment);
                                  toast.info("Đã mở lại đơn thanh toán. Vui lòng hoàn tất thanh toán.");
                                }
                              }}
                              style={{ cursor: payment.status === 'Pending' ? 'pointer' : 'default' }}
                              title={payment.status === 'Pending' ? 'Click để xem lại QR code' : ''}
                            >
                              <td>{payment.orderCode}</td>
                              <td>{displayType}</td>
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

            <div className="faq-section">
              <h2 className="faq-title">Câu Hỏi Thường Gặp</h2>
              <div className="faq-list">
                <div className="faq-item">
                  <h3>💳 Có những phương thức thanh toán nào?</h3>
                  <p>Hiện tại hỗ trợ chuyển khoản qua VietQR. Quét mã QR bằng app banking để thanh toán nhanh chóng.</p>
                </div>
                <div className="faq-item">
                  <h3>🔄 Mất bao lâu để được kích hoạt Premium?</h3>
                  <p>Sau khi chuyển khoản thành công, admin sẽ xác nhận trong vòng 5-30 phút. Bạn có thể nhấn "Kiểm tra trạng thái" để cập nhật.</p>
                </div>
                <div className="faq-item">
                  <h3>⭐ Tài khoản Premium có gì đặc biệt?</h3>
                  <p>Premium được tải không giới hạn, xem trước tài liệu premium, không quảng cáo, badge đặc biệt và ưu tiên duyệt bài.</p>
                </div>
              </div>
            </div>
          </>
        )}
    </div>
  );
}

export default UpgradeAccount;
