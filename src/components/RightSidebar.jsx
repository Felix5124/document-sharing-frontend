import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLightbulb, 
  faInfoCircle, 
  faChartLine,
  faUsers,
  faFileAlt,
  faTrophy,
  faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import '../styles/components/RightSidebar.css';

const RightSidebar = ({ variant = 'default' }) => {
  const sidebarContent = {
    forum: {
      title: 'Mẹo Diễn Đàn',
      icon: faLightbulb,
      items: [
        { icon: faCheckCircle, text: 'Viết tiêu đề rõ ràng và súc tích' },
        { icon: faCheckCircle, text: 'Sử dụng ngôn ngữ lịch sự, tôn trọng' },
        { icon: faCheckCircle, text: 'Trả lời bình luận để tăng tương tác' },
        { icon: faCheckCircle, text: 'Chia sẻ kiến thức hữu ích' }
      ],
      stats: []
    },
    upload: {
      title: 'Hướng Dẫn Tải Lên',
      icon: faInfoCircle,
      items: [
        { icon: faCheckCircle, text: 'File PDF chất lượng cao được ưu tiên' },
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

  return (
    <div className="right-sidebar">
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
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
