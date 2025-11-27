import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faStar, faGift, faTrophy, faHeart } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../context/AuthContext';
import '../styles/components/VipWelcomeBanner.css';

const VipWelcomeBanner = () => {
  const { user } = useContext(AuthContext);
  
  return (
    <div className="vip-welcome-banner">
      <div className="vip-welcome-content">
        <div className="vip-crown-icon">
          <FontAwesomeIcon icon={faCrown} />
        </div>
        <h3 className="vip-welcome-title-sidebar-left">Chào {user?.fullName || user?.email || 'VIP'}!</h3>
        <p className="vip-welcome-subtitle-sidebar-left">
          Bạn đang trải nghiệm tài khoản Premium
        </p>
        
        <div className="vip-perks">
          <div className="vip-perk-item">
            <FontAwesomeIcon icon={faStar} />
            <span>Tải 13 file/ngày</span>
          </div>
          <div className="vip-perk-item">
            <FontAwesomeIcon icon={faGift} />
            <span>Xem 15 trang PDF</span>
          </div>
          <div className="vip-perk-item">
            <FontAwesomeIcon icon={faTrophy} />
            <span>Ưu tiên duyệt bài</span>
          </div>
          <div className="vip-perk-item">
            <FontAwesomeIcon icon={faHeart} />
            <span>Không quảng cáo</span>
          </div>
        </div>

        <Link to="/upgrade-account" className="vip-manage-button">
          Quản Lý Gói VIP
        </Link>
      </div>
    </div>
  );
};

export default VipWelcomeBanner;
