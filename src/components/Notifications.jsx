import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { getUserNotifications, markNotificationAsRead } from '../services/api';
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

  return (
    <div className="notifications-container">
      <div className="notifications-card">
        <h2 className="notifications-title">
          <i className="bi bi-bell icon-margin-right"></i> Thông báo
        </h2>
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Đang tải thông báo...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="notifications-list">
            {notifications.map((notification) => {
              const isUnread = !notification.isRead;
              const shortMessage = notification.message.length > 50
                ? `${notification.message.substring(0, 50)}...`
                : notification.message;

              return (
                <div
                  key={notification.notificationId}
                  className={`notification-item ${isUnread ? 'unread' : 'read'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <p className={`notification-message ${isUnread ? 'unread' : ''}`}>
                      {shortMessage}
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
            <i className="bi bi-bell-slash empty-icon"></i>
            <p>Không có thông báo nào để hiển thị.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;