import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faRocket, faDownload, faStar, faUpload, faComments, faAward } from '@fortawesome/free-solid-svg-icons';
import '../styles/components/VipPromoBanner.css';

const VipPromoBanner = ({ variant = 'default' }) => {
  const bannerContent = {
    forum: {
      icon: faCrown,
      title: '🔥 Đăng kí Premium Ngay!',
      subtitle: 'Nhận huy hiệu Premium độc quyền và ưu tiên duyệt bài từ Admin!',
      features: [
        { icon: faStar, text: 'Huy hiệu Premium đặc biệt' },
        { icon: faRocket, text: 'Ưu tiên duyệt bài nhanh' },
        { icon: faCrown, text: 'Không quảng cáo' }
      ]
    },
    upload: {
      icon: faUpload,
      title: '⚡ Nâng Cấp Premium - Upload & Tải Nhiều Hơn!',
      subtitle: 'Tài khoản thường chỉ 1 file/ngày. Premium upload 4 file/ngày + tải 8 file thường + 5 Premium!',
      features: [
        { icon: faUpload, text: 'Upload 4 file/ngày' },
        { icon: faDownload, text: 'Tải 8 file thường + 5 Premium' },
        { icon: faRocket, text: 'Ưu tiên duyệt bài' }
      ]
    },
    profile: {
      icon: faCrown,
      title: '💎 Đặc Quyền Premium Đang Chờ Bạn!',
      subtitle: 'Xem trước 10 trang PDF, tải nhiều hơn 4x, không quảng cáo!',
      features: [
        { icon: faDownload, text: 'Tải 8 file thường + 5 Premium' },
        { icon: faStar, text: 'Xem trước 10 trang PDF' },
        { icon: faAward, text: 'Badge Premium + Ưu tiên duyệt' }
      ]
    },
    default: {
      icon: faCrown,
      title: '🚀 Premium - Trải Nghiệm Không Giới Hạn!',
      subtitle: 'Tải xuống nhiều hơn, xem nhiều hơn, không quảng cáo!',
      features: [
        { icon: faDownload, text: 'Tải 8 file thường + 5 Premium' },
        { icon: faStar, text: 'Xem trước 10 trang' },
        { icon: faRocket, text: 'Không quảng cáo' }
      ]
    }
  };

  const content = bannerContent[variant] || bannerContent.default;

  return (
    <Link to="/upgrade-account" className="vip-promo-banner">
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
