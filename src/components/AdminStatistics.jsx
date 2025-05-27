import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import useOnScreen from '../hooks/useOnScreen';

const AdminStatistics = () => {
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    totalDownloads: 0,
  });

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('https://localhost:7013/api/documents/statistics', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Không thể lấy dữ liệu thống kê.');
        }

        const data = await response.json();
        setStatistics({
          totalUsers: data.totalUsers || 0,
          totalDocuments: data.totalDocuments || 0,
          totalDownloads: data.totalDownloads || 0,
        });
      } catch (err) {
        toast.error(err.message);
      }
    };

    fetchStatistics();
  }, []);

  // Component cho Stats Card với hiệu ứng fade-in
  const StatsCard = ({ title, value, icon }) => {
    const cardRef = useRef(null);
    const isVisible = useOnScreen(cardRef);

    return (
      <div ref={cardRef} className={`stats-card fade-in ${isVisible ? 'visible' : ''}`}>
        <h5 className="card-title">
          <i className={`bi ${icon} me-2`}></i> {title}
        </h5>
        <p className="card-text">{value}</p>
      </div>
    );
  };

  return (
    <div className="admin-section">
      <h4 className="section-title">
        <i className="bi bi-bar-chart-line me-2"></i> Thống kê hệ thống
      </h4>
      <div className="row g-4">
        <div className="col-md-4">
          <StatsCard
            title="Tổng số người dùng"
            value={statistics.totalUsers}
            icon="bi-people"
          />
        </div>
        <div className="col-md-4">
          <StatsCard
            title="Tổng số tài liệu"
            value={statistics.totalDocuments}
            icon="bi-file-earmark"
          />
        </div>
        <div className="col-md-4">
          <StatsCard
            title="Tổng số lượt tải về"
            value={statistics.totalDownloads}
            icon="bi-download"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;