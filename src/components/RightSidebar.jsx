import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLightbulb, 
  faInfoCircle, 
  faChartLine,
  faUsers,
  faFileAlt,
  faTrophy,
  faCheckCircle,
  faDownload,
  faCloudUploadAlt
} from '@fortawesome/free-solid-svg-icons';
import '../styles/components/RightSidebar.css';

const RightSidebar = ({ variant = 'default', user = null, uploadLimit = null }) => {
  const sidebarContent = {
    forum: {
      title: 'Mẹo Diễn Đàn',
      icon: faLightbulb,
      items: [
        { icon: faCheckCircle, text: 'Viết tiêu đề rõ ràng và súc tích'},
        { icon: faCheckCircle, text: 'Sử dụng ngôn ngữ lịch sự'},
        { icon: faCheckCircle, text: 'Bình luận để tăng tương tác' },
        { icon: faCheckCircle, text: 'Chia sẻ kiến thức hữu ích' }
      ],
      stats: []
    },
    upload: {
      title: 'Hướng Dẫn Tải Lên',
      icon: faInfoCircle,
      items: [
        { icon: faCheckCircle, text: 'Up file PDF và docx' },
        { icon: faCheckCircle, text: 'Đặt tên file rõ ràng, dễ hiểu' },
        { icon: faCheckCircle, text: 'Thêm mô tả chi tiết về tài liệu' },
        { icon: faCheckCircle, text: 'Chọn đúng danh mục và tags' }
      ],
      stats: []
    },
    profile: {
      title: 'Thống Kê Cộng Đồng',
      icon: faChartLine,
      items: [
        { icon: faCheckCircle, text: 'Tải lên thường xuyên để được xếp hạng' },
        { icon: faCheckCircle, text: 'Nhận huy hiệu khi đạt thành tựu' },
        { icon: faCheckCircle, text: 'Tương tác nhiều để tăng điểm' },
        { icon: faCheckCircle, text: 'Theo dõi người dùng khác' }
      ],
      stats: []
    },
    document: {
      title: 'Mẹo Sử Dụng Tài Liệu',
      icon: faFileAlt,
      items: [
        { icon: faCheckCircle, text: 'Tải về để xem toàn bộ nội dung' },
        { icon: faCheckCircle, text: 'Đánh giá và bình luận sau khi tải' },
        { icon: faCheckCircle, text: 'Theo dõi tác giả để nhận cập nhật' },
        { icon: faCheckCircle, text: 'Báo cáo nếu phát hiện vi phạm' },
      ],
      stats: []
    },
    default: {
      title: 'Thông Tin Hữu Ích',
      icon: faInfoCircle,
      items: [
        { icon: faCheckCircle, text: 'Tuân thủ quy định cộng đồng' },
        { icon: faCheckCircle, text: 'Chia sẻ tài liệu chất lượng' },
        { icon: faCheckCircle, text: 'Tương tác tích cực' },
        { icon: faCheckCircle, text: 'Báo cáo vi phạm nếu phát hiện' }
      ],
      stats: []
    }
  };

  const content = sidebarContent[variant] || sidebarContent.default;

  // Calculate remaining downloads
  const calculateRemainingDownloads = () => {
    if (!user) return null;

    const isVip = user.isVip && user.vipExpiryDate && new Date(user.vipExpiryDate) > new Date();
    
    let vipDownloadsRemaining = 0;
    let regularDownloadsRemaining = 0;
    let vipBonusCount = 0;
    let regularBonusCount = 0;

    if (isVip) {
      // VIP users: 5 VIP downloads + 8 regular downloads per day (reset mỗi ngày, không cộng dồn)
      vipDownloadsRemaining = Math.max(0, 5 - (user.vipDownloadsUsedToday || 0));
      regularDownloadsRemaining = Math.max(0, 8 - (user.regularDownloadsUsedToday || 0));
      vipBonusCount = user.vipBonusDownloads || 0;
      regularBonusCount = user.regularBonusDownloads || 0;
    } else {
      // Regular users: 2 downloads per day (reset mỗi ngày, không cộng dồn)
      const dailyUsed = user.regularDownloadsUsedToday || 0;
      regularDownloadsRemaining = Math.max(0, 2 - dailyUsed);
      regularBonusCount = user.regularBonusDownloads || 0;
      vipBonusCount = user.vipBonusDownloads || 0;
    }

    return {
      isVip,
      vipDownloadsRemaining,
      regularDownloadsRemaining,
      vipBonusCount,
      regularBonusCount,
      totalRemaining: vipDownloadsRemaining + regularDownloadsRemaining + vipBonusCount + regularBonusCount
    };
  };

  const downloadInfo = calculateRemainingDownloads();
  
  // Only show download limit on document and profile pages
  const showDownloadLimit = variant === 'document' || variant === 'profile';
  
  // Only show upload limit on upload page
  const showUploadLimit = variant === 'upload' && uploadLimit;

  return (
    <div className="right-sidebar">
      {/* Upload Limit Card - Only show on upload page */}
      {user && showUploadLimit && uploadLimit && (
        <div className="right-sidebar-card upload-limit-card">
          <div className="right-sidebar-header">
            <FontAwesomeIcon icon={faCloudUploadAlt} />
            <h3>Lượt Upload Hôm Nay</h3>
          </div>
          <div className="right-sidebar-content">
            <div className="upload-limit-info">
              {uploadLimit.isVip ? (
                <>
                  <div className="upload-limit-item regular-uploads">
                    <span className="upload-label">📄 Tài liệu thường:</span>
                    <span className="upload-count regular">{uploadLimit.remainingRegular}/2</span>
                  </div>
                  <div className="upload-limit-item vip-uploads">
                    <span className="upload-label">⭐ Tài liệu Premium:</span>
                    <span className="upload-count vip">{uploadLimit.remainingVip}/2</span>
                  </div>
                </>
              ) : (
                <div className="upload-limit-item regular-uploads">
                  <span className="upload-label">📄 Tài liệu thường:</span>
                  <span className="upload-count regular">{uploadLimit.remainingRegular}/1</span>
                </div>
              )}
              <div className="upload-limit-note">
                <small>{uploadLimit.isVip ? 'Giới hạn hàng ngày' : 'Nâng cấp Premium để upload nhiều hơn'}</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Limit Card - Only show if user is logged in and on specific pages */}
      {user && downloadInfo && showDownloadLimit && (
        <div className="right-sidebar-card download-limit-card">
          <div className="right-sidebar-header">
            <FontAwesomeIcon icon={faDownload} />
            <h3>Lượt Tải Còn Lại</h3>
          </div>
          <div className="right-sidebar-content">
            <div className="download-limit-info">
              {downloadInfo.isVip ? (
                <>
                  <div className="download-limit-item vip-downloads">
                    <span className="download-label">Tài liệu Premium:</span>
                    <span className="download-count vip">{downloadInfo.vipDownloadsRemaining}/5</span>
                  </div>
                  <div className="download-limit-item regular-downloads">
                    <span className="download-label">Tài liệu thường:</span>
                    <span className="download-count regular">{downloadInfo.regularDownloadsRemaining}/8</span>
                  </div>
                  {/* Bonus downloads - separate row */}
                  {(downloadInfo.vipBonusCount > 0 || downloadInfo.regularBonusCount > 0) && (
                    <>
                      {downloadInfo.vipBonusCount > 0 && (
                        <div className="download-limit-item bonus-item vip-downloads">
                          <span className="download-label">Bonus (Premium):</span>
                          <span className="download-count vip">{downloadInfo.vipBonusCount}</span>
                        </div>
                      )}
                      {downloadInfo.regularBonusCount > 0 && (
                        <div className="download-limit-item bonus-item regular-downloads">
                          <span className="download-label">Bonus (Thường):</span>
                          <span className="download-count regular">{downloadInfo.regularBonusCount}</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="download-limit-item regular-downloads">
                    <span className="download-label">Tài liệu thường:</span>
                    <span className="download-count regular">{downloadInfo.regularDownloadsRemaining}/2</span>
                  </div>
                  {/* Bonus downloads - separate row */}
                  {downloadInfo.regularBonusCount > 0 && (
                    <div className="download-limit-item bonus-item regular-downloads">
                      <span className="download-label">Bonus (Thường):</span>
                      <span className="download-count regular">{downloadInfo.regularBonusCount}</span>
                    </div>
                  )}
                  {downloadInfo.vipBonusCount > 0 && (
                    <div className="download-limit-item bonus-item vip-downloads">
                      <span className="download-label">Bonus (Premium):</span>
                      <span className="download-count vip">{downloadInfo.vipBonusCount}</span>
                    </div>
                  )}
                </>
              )}
              <div className="download-limit-note">
                <small>{downloadInfo.isVip ? 'Giới hạn hàng ngày' : 'Tải lên tài liệu để nhận thêm lượt tải'}</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips Card */}
      <div className="right-sidebar-card">
        <div className="right-sidebar-header">
          <FontAwesomeIcon icon={content.icon} />
          <h3>{content.title}</h3>
        </div>
        <div className="right-sidebar-content">
          {content.items.map((item, index) => (
            <div key={index} className="sidebar-tip-item">
              <FontAwesomeIcon icon={item.icon} className="tip-icon" />
              <span >{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
