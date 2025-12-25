import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/api';
import '../styles/components/Notifications.css';

function Notifications() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getUserNotifications(user.userId);
      let data = response.data;
      if (Array.isArray(data.$values)) {
        data = data.$values;
      }
      setNotifications(data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', { toastId: 'auth-error' });
        navigate('/login');
      } else {
        toast.error('Không thể tải danh sách thông báo.');
        console.error('Fetch notifications error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.userId) {
      fetchNotifications();
    }
  }, [user, location.pathname]);

  const handleNotificationClick = async (notification) => {
    try {
      // Đánh dấu thông báo là đã đọc nếu chưa đọc
      if (!notification.isRead) {
        await markNotificationAsRead(notification.notificationId);
        setNotifications(notifications.map(n =>
          n.notificationId === notification.notificationId ? { ...n, isRead: true } : n
        ));
      }

      // Chuyển hướng đến trang chi tiết thông báo
      navigate(`/notifications/${notification.notificationId}`);
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error('Đã xảy ra lỗi khi xử lý thông báo.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(user.userId);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu tất cả thông báo là đã đọc.');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Không thể đánh dấu tất cả thông báo.');
    }
  };

  return (
    <div className="all-container">
      <div className="all-container-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 className="upload-title" style={{ margin: 0 }}>
            <i className="bi bi-bell icon-margin-right"></i> Thông báo
          </h2>
          {notifications.length > 0 && notifications.some(n => !n.isRead) && (
            <button
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
            >
              <i className="bi bi-check-all" style={{ marginRight: '6px' }}></i>
              Đánh dấu đã đọc tất cả
            </button>
          )}
        </div>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Đang tải thông báo...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="notifications-list">
            {notifications.map((notification) => {
              const isUnread = !notification.isRead;

              return (
                <div
                  key={notification.notificationId}
                  className={`notification-item ${isUnread ? 'unread' : 'read'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <p className={`notification-message ${isUnread ? 'unread' : ''}`}>
                      {notification.message}
                    </p>
                    <span className={`notification-time ${isUnread ? 'unread' : ''}`}>
                      {new Date(notification.sentAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">

            <p>Không có thông báo nào để hiển thị.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;