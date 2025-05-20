import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const AdminStatistics = () => {
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalDocuments: 0,
    totalDownloads: 0,
  });

  // Gọi API để lấy thống kê
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

  return (
    <div className="admin-container">
      <div className="admin-content">
        <h2 className="admin-title">
          <i className="bi bi-bar-chart-line me-2"></i> Thống kê hệ thống
        </h2>
        <div className="row g-4">
          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-body text-center">
                <h5 className="card-title">Tổng số người dùng</h5>
                <p className="card-text display-6">{statistics.totalUsers}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-body text-center">
                <h5 className="card-title">Tổng số tài liệu</h5>
                <p className="card-text display-6">{statistics.totalDocuments}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm">
              <div className="card-body text-center">
                <h5 className="card-title">Tổng số lượt tải về</h5>
                <p className="card-text display-6">{statistics.totalDownloads}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;