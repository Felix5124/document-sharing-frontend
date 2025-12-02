import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import useOnScreen from '../hooks/useOnScreen';
import { getStatistics } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers,
  faFileLines,
  faDownload,
  faChartColumn
} from '@fortawesome/free-solid-svg-icons';
import '../styles/components/AdminStatistics.css';

const AdminStatistics = () => {
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    totalDownloads: 0,
  });

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        // Sử dụng API service đã cấu hình base URL tự động
        const response = await getStatistics();
        const data = response.data; // Axios trả về dữ liệu trong thuộc tính .data

        setStatistics({
          totalUsers: data.totalUsers || 0,
          totalDocuments: data.totalDocuments || 0,
          totalDownloads: data.totalDownloads || 0,
        });
      } catch (err) {
        // Xử lý lỗi tốt hơn
        const errorMsg = err.response?.data?.message || err.message || 'Không thể lấy dữ liệu thống kê.';
        console.error("Lỗi thống kê:", err);
        toast.error(errorMsg);
      }
    };
    fetchStatistics();
  }, []);

  const StatsCard = ({ title, value, icon }) => {
    const cardRef = useRef(null);
    const isVisible = useOnScreen(cardRef);

    return (
      <div ref={cardRef} className={`stats-card fade-in ${isVisible ? 'visible' : ''}`}>
        <h5 className="card-title">
          <FontAwesomeIcon icon={icon} className="icon-margin" /> {title}
        </h5>
        <p className="card-text">{value}</p>
      </div>
    );
  };

  return (
    <div className="admin-section">
      <div className="stats-grid">
        <div className="stats-column">
          <StatsCard
            title="Tổng số người dùng"
            value={statistics.totalUsers}
            icon={faUsers}
          />
        </div>
        <div className="stats-column">
          <StatsCard
            title="Tổng số tài liệu"
            value={statistics.totalDocuments}
            icon={faFileLines}
          />
        </div>
        <div className="stats-column">
          <StatsCard
            title="Tổng số lượt tải về"
            value={statistics.totalDownloads}
            icon={faDownload}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;