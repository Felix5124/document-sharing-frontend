import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getNotificationById, markNotificationAsRead, deleteNotification } from '../services/api';

function NotificationDetail() {
  const { notificationId } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotification();
  }, [notificationId]);

  const fetchNotification = async () => {
    setLoading(true);
    try {
      const response = await getNotificationById(notificationId);
      let data = response.data;
      if (data.$values) {
        data = data.$values;
      }
      setNotification(data);

      if (!data.isRead) {
        await markNotificationAsRead(notificationId);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', { toastId: 'auth-error' });
        navigate('/login');
      } else {
        toast.error('Không thể tải chi tiết thông báo.');
        console.error('Fetch notification error:', error);
        navigate('/notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteNotification(notificationId);
      toast.success('Đã xóa thông báo.');
      navigate('/notifications');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', { toastId: 'auth-error' });
        navigate('/login');
      } else {
        toast.error('Không thể xóa thông báo.');
        console.error('Delete notification error:', error);
      }
    }
  };

  const handleBack = () => {
    navigate('/notifications');
  };

  return (
    <div className="notification-container">
      <div className="notification-detail-card">
        <h2 className="notifications-title">
          <i className="bi bi-bell me-2"></i> Chi tiết thông báo
        </h2>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Đang tải chi tiết thông báo...</p>
          </div>
        ) : notification ? (
          <div className="notifications-list">
            <div className="notification-item read">
              <div className="notification-content">
                <p className="notification-sender">
                  <strong>Người gửi:</strong> {notification.document?.uploadedBy?.fullName || 'Hệ thống'}
                </p>
                <p className="notification-message">
                  <strong>Nội dung:</strong> {notification.message}
                </p>
                <span className="notification-time">
                  <strong>Ngày gửi:</strong>{' '}
                  {new Date(notification.sentAt).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <div className="notification-actions">
                  <button className="action-button back-button" onClick={handleBack}>
                    <i className="bi bi-arrow-left me-2"></i> Quay lại
                  </button>
                  <button className="action-button delete-button" onClick={handleDelete}>
                    <i className="bi bi-trash me-2"></i> Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <i className="bi bi-exclamation-circle empty-icon"></i>
            <p>Không tìm thấy thông báo.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationDetail;