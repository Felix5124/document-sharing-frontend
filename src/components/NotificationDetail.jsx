import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getNotificationById, markNotificationAsRead, deleteNotification } from '../services/api';
import '../styles//components/NotificationDetail.css';

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

  const handleViewDocument = () => {
    if (notification?.documentId) {
      navigate(`/document/${notification.documentId}`);
    }
  };

  return (
    <div className="notifications-container">
      <div className="notifications-card">
        <h2 className="notifications-title">
          <i className="bi bi-bell icon-margin-right"></i> Chi tiết thông báo
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
                <div className="flex-container flex-justify-between flex-align-center margin-bottom-sm">
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
                  {notification.documentId && (
                    <button
                      className="action-button view-document-button"
                      onClick={handleViewDocument}
                    >
                      <i className="bi bi-file-earmark-text icon-margin-right-sm"></i> Xem tài liệu
                    </button>
                  )}
                </div>
                <div className="notification-actions flex-container flex-justify-end">
                  <button className="action-button back-button margin-right-sm" onClick={handleBack}>
                    <i className="bi bi-arrow-left icon-margin-right-sm"></i> Quay lại
                  </button>
                  <button className="action-button delete-button" onClick={handleDelete}>
                    <i className="bi bi-trash icon-margin-right-sm"></i> Xóa
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