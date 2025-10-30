import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getNotificationById, markNotificationAsRead, deleteNotification } from '../services/api';
import '../styles/components/NotificationDetail.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faClock, faArrowLeft, faTrash, faFileLines, faUser } from '@fortawesome/free-solid-svg-icons';

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
    <div className="all-container">
      <div className='all-container-card'>
        <div className="detail-header">
          <div className="detail-title">
            <FontAwesomeIcon icon={faBell} className="me-2" />
            Chi tiết thông báo
          </div>
          <button className="btn-ghost" onClick={handleBack}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> Quay lại
          </button>
        </div>
  
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Đang tải chi tiết thông báo...</p>
          </div>
        ) : notification ? (
          <>
            <div className="detail-meta">
              <div className="meta-item">
                <FontAwesomeIcon icon={faUser} className="me-2" />
                <span>{notification.document?.uploadedBy?.fullName || 'Hệ thống'}</span>
              </div>
              <div className="meta-item">
                <FontAwesomeIcon icon={faClock} className="me-2" />
                <span>
                  {new Date(notification.sentAt).toLocaleString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
              <span className={`status-chip ${notification.isRead ? 'read' : 'unread'}`}>
                {notification.isRead ? 'Đã đọc' : 'Chưa đọc'}
              </span>
            </div>
  
            <div className="detail-message">
              <div className="message-label">Nội dung</div>
              <div className="message-body">{notification.message}</div>
            </div>
  
            <div className="detail-actions">
              {notification.documentId && (
                <button className="btn-secondary" onClick={handleViewDocument}>
                  <FontAwesomeIcon icon={faFileLines} className="me-2" /> Xem tài liệu
                </button>
              )}
              <button className="btn-danger" onClick={handleDelete}>
                <FontAwesomeIcon icon={faTrash} className="me-2" /> Xóa
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">!</span>
            <p>Không tìm thấy thông báo.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationDetail;