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

      // Tự động đánh dấu đã đọc nếu chưa đọc, không hiển thị toast
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

  if (loading) {
    return (
      <div className="notification-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Đang tải chi tiết thông báo...</p>
        </div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="notification-container">
        <div className="empty-state">
          <i className="bi bi-exclamation-circle empty-icon"></i>
          <p>Không tìm thấy thông báo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-container">
      <h2 className="notification-title">
        <i className="bi bi-bell me-2"></i> Chi tiết thông báo
      </h2>
      <div className="document-card">
        <div className="notification-details" style={{ padding: '16px' }}>
          <p className="notification-sender">
            <strong>Người gửi:</strong> {notification.document?.uploadedBy?.fullName || 'Hệ thống'}
          </p>
          <p className="notification-full-message">
            <strong>Nội dung:</strong> {notification.message}
          </p>
          <p className="notification-date">
            <strong>Ngày gửi:</strong> {new Date(notification.sentAt).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
          <div className="notification-actions" style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button
              className="action-button back-button"
              onClick={handleBack}
              style={{ backgroundColor: '#6c757d', color: '#fff' }}
            >
              <i className="bi bi-arrow-left me-2"></i> Quay lại
            </button>
            <button
              className="action-button"
              onClick={handleDelete}
              style={{ backgroundColor: '#dc3545', color: '#fff' }}
            >
              <i className="bi bi-trash me-2"></i> Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationDetail;