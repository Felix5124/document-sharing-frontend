import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { subscribeVip } from "../services/api";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCrown, 
  faCheck, 
  faStar, 
  faInfinity,
  faDownload,
  faFileAlt,
  faLock,
  faRocket
} from '@fortawesome/free-solid-svg-icons';
import '../styles/pages/UpgradeAccount.css';

function UpgradeAccount() {
  const { user } = useContext(AuthContext);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'monthly',
      name: 'VIP Tháng',
      duration: '1 Tháng',
      price: '49.000',
      originalPrice: '79.000',
      discount: '-38%',
      icon: faStar,
      color: '#3b82f6',
      features: [
        'Tải 8 file thường/ngày',
        'Tải 5 file VIP/ngày',
        'Xem trước 15 trang PDF',
        'Không quảng cáo',
        'Ưu tiên duyệt bài'
      ],
      popular: false
    },
    {
      id: 'quarterly',
      name: 'VIP 3 Tháng',
      duration: '3 Tháng',
      price: '129.000',
      originalPrice: '237.000',
      discount: '-46%',
      icon: faCrown,
      color: '#8b5cf6',
      features: [
        'Tải 8 file thường/ngày',
        'Tải 5 file VIP Premium/ngày',
        'Xem trước 15 trang PDF',
        'Không quảng cáo',
        'Ưu tiên duyệt bài nhanh',
        'Badge VIP đặc biệt',
        'Tiết kiệm 13%'
      ],
      popular: true
    },
    {
      id: 'yearly',
      name: 'VIP Năm',
      duration: '12 Tháng',
      price: '399.000',
      originalPrice: '948.000',
      discount: '-58%',
      icon: faRocket,
      color: '#f59e0b',
      features: [
        'Tải 8 file thường/ngày',
        'Tải 5 file VIP Premium/ngày',
        'Xem trước 15 trang PDF',
        'Không quảng cáo',
        'Ưu tiên duyệt bài cao nhất',
        'Badge VIP Vàng độc quyền',
        'Tiết kiệm 33%'
      ],
      popular: false
    }
  ];

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };

  const handleUpgrade = async () => {
    if (!user) {
      toast.error("Bạn cần đăng nhập trước khi nâng cấp!");
      return;
    }

    if (!selectedPlan) {
      toast.error("Vui lòng chọn gói VIP!");
      return;
    }

    try {
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      
      const data = {
        userId: user.userId || user.id,
        subscriptionType: selectedPlan === 'monthly' ? 'Monthly' : selectedPlan === 'quarterly' ? 'Quarterly' : 'Yearly',
        price: 0, // Test mode
        paymentMethod: "Test",
        transactionId: "FAKE_" + Date.now(),
      };

      const res = await subscribeVip(data);
      toast.success(`Tài khoản đã được nâng cấp lên ${selectedPlanData.name}!`);
      console.log("VIP Subscription:", res.data);
    } catch (error) {
      console.error("Lỗi khi nâng cấp VIP:", error);
      toast.error("Có lỗi xảy ra khi nâng cấp tài khoản.");
    }
  };

  return (
    <div className="upgrade-account-container">
      <div className="upgrade-header">
        <FontAwesomeIcon icon={faCrown} className="upgrade-header-icon" />
        <h1 className="upgrade-title">Nâng Cấp Tài Khoản VIP</h1>
        <p className="upgrade-subtitle">
          Mở khóa trải nghiệm premium với nhiều tính năng độc quyền
        </p>
      </div>

      <div className="benefits-section">
        <div className="benefits-grid">
          <div className="benefit-card">
            <FontAwesomeIcon icon={faDownload} className="benefit-icon" />
            <h3>Tải Nhiều Hơn 6.5x</h3>
            <p>13 file/ngày so với 2 file của tài khoản thường</p>
          </div>
          <div className="benefit-card">
            <FontAwesomeIcon icon={faFileAlt} className="benefit-icon" />
            <h3>Tài Liệu VIP Premium</h3>
            <p>Truy cập độc quyền 5 file VIP mỗi ngày</p>
          </div>
          <div className="benefit-card">
            <FontAwesomeIcon icon={faLock} className="benefit-icon" />
            <h3>Xem Trước 3x Nhiều</h3>
            <p>15 trang PDF so với 5 trang của tài khoản free</p>
          </div>
          <div className="benefit-card">
            <FontAwesomeIcon icon={faCrown} className="benefit-icon" />
            <h3>Ưu Tiên & Badge VIP</h3>
            <p>Duyệt bài nhanh + Badge đặc biệt + Không ads</p>
          </div>
        </div>
      </div>

      <div className="plans-section">
        <h2 className="plans-title">Chọn Gói Phù Hợp Với Bạn</h2>
        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
              onClick={() => handleSelectPlan(plan.id)}
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
                  <span className="price-amount">{plan.price}</span>
                  <span className="price-currency">đ</span>
                </div>
                <div className="original-price">
                  <span className="strike-through">{plan.originalPrice}đ</span>
                  <span className="discount-badge">{plan.discount}</span>
                </div>
              </div>

              <div className="plan-features">
                {plan.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <FontAwesomeIcon icon={faCheck} className="feature-check" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                className={`select-plan-btn ${selectedPlan === plan.id ? 'selected' : ''}`}
                style={selectedPlan === plan.id ? { background: plan.color } : {}}
              >
                {selectedPlan === plan.id ? 'Đã Chọn' : 'Chọn Gói Này'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="checkout-section">
        <button
          className="upgrade-btn"
          onClick={handleUpgrade}
          disabled={!selectedPlan}
        >
          <FontAwesomeIcon icon={faCrown} />
          {selectedPlan ? 'Nâng Cấp Ngay (Test Mode)' : 'Vui Lòng Chọn Gói'}
        </button>
        
        <p className="test-mode-note">
          🔧 <strong>Chế độ test:</strong> Chưa tích hợp thanh toán thực tế. 
          Chức năng thanh toán sẽ được thêm vào sau.
        </p>
      </div>

      <div className="faq-section">
        <h2 className="faq-title">Câu Hỏi Thường Gặp</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h3>💳 Có những phương thức thanh toán nào?</h3>
            <p>Hiện tại đang trong chế độ test. Sắp tới sẽ hỗ trợ: Thẻ ATM, Ví điện tử (Momo, ZaloPay), Chuyển khoản ngân hàng.</p>
          </div>
          <div className="faq-item">
            <h3>🔄 Có thể hủy gói VIP không?</h3>
            <p>Có, bạn có thể hủy gói VIP bất cứ lúc nào. Tính năng VIP sẽ còn hiệu lực đến hết thời gian đã đăng ký.</p>
          </div>
          <div className="faq-item">
            <h3>⭐ Tài khoản VIP có gì đặc biệt?</h3>
            <p>VIP được tải không giới hạn, xem trước tài liệu premium, badge đặc biệt, và nhiều quyền lợi khác.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpgradeAccount;
