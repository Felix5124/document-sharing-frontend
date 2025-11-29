import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faRocket, faDownload, faStar, faUpload, faComments, faAward } from '@fortawesome/free-solid-svg-icons';
import '../styles/components/VipPromoBanner.css';

const VipPromoBanner = ({ variant = 'default' }) => {
  // Định nghĩa nội dung theo từng ngữ cảnh
  const bannerContent = {
    forum: {
      icon: faCrown,
      title: '🔥 Trở Thành VIP Ngay!',
      subtitle: 'Nhận huy hiệu VIP độc quyền và ưu tiên duyệt bài từ Admin!',
      features: [
        { icon: faStar, text: 'Huy hiệu VIP đặc biệt' },
        { icon: faRocket, text: 'Ưu tiên duyệt bài nhanh' },
        { icon: faCrown, text: 'Không quảng cáo' }
      ]
    },
    upload: {
      icon: faUpload,
      title: '⚡ Nâng Cấp VIP - Thoải Mái Tải Xuống!',
      subtitle: 'Tài khoản thường chỉ 2 file/ngày. VIP tải 10 file thường + 10 file Premium!',
      features: [
        { icon: faDownload, text: 'Tải 10 file/ngày' },
        { icon: faStar, text: 'Tải 10 file VIP/ngày' },
        { icon: faRocket, text: 'Ưu tiên duyệt bài' }
      ]
    },
    profile: {
      icon: faCrown,
      title: '💎 Đặc Quyền VIP Đang Chờ Bạn!',
      subtitle: 'Xem trước 10 trang PDF, tải nhiều hơn 10x, không quảng cáo!',
      features: [
        { icon: faDownload, text: 'Tải 10 file thường + 10 VIP' },
        { icon: faStar, text: 'Xem trước 10 trang PDF' },
        { icon: faAward, text: 'Badge VIP + Ưu tiên duyệt' }
      ]
    },
    default: {
      icon: faCrown,
      title: '🚀 VIP - Trải Nghiệm Không Giới Hạn!',
      subtitle: 'Tải xuống nhiều hơn, xem nhiều hơn, không quảng cáo!',
      features: [
        { icon: faDownload, text: 'Tải 20 file/ngày' },
        { icon: faStar, text: 'Xem trước 10 trang' },
        { icon: faRocket, text: 'Không quảng cáo' }
      ]
    }
  };

  const content = bannerContent[variant] || bannerContent.default;

  return (
    <Link to="/upgrade" className="vip-promo-banner">
      <div className="vip-promo-icon">
        <FontAwesomeIcon icon={content.icon} />
      </div>
      <div className="vip-promo-content">
        <h3 className="vip-promo-title">{content.title}</h3>
        <p className="vip-promo-subtitle">{content.subtitle}</p>
        <div className="vip-promo-features">
          {content.features.map((feature, index) => (
            <div key={index} className="vip-promo-feature">
              <FontAwesomeIcon icon={feature.icon} />
              <span>{feature.text}</span>
            </div>
          ))}
        </div>
        <button className="vip-promo-button">
          Nâng Cấp Ngay <FontAwesomeIcon icon={faCrown} />
        </button>
      </div>
    </Link>
  );
};

export default VipPromoBanner;
