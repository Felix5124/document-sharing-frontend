import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { getUserNotifications } from '../services/api';

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
    fetchNotifications();
  }, [user, location]);

  const handleNotificationClick = (notificationId) => {
    navigate(`/notifications/${notificationId}`);
  };

  return (
    <div className="notifications-container">
      <h2 className="notifications-title">
        <i className="bi bi-bell me-2"></i> Thông báo
      </h2>
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Đang tải thông báo...</p>
        </div>
      ) : notifications.length > 0 ? (
        <div className="notifications-card"> {/* Thêm khung card */}
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
                  onClick={() => handleNotificationClick(notification.notificationId)}
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
        </div>
      ) : (
        <div className="empty-state">
          <i className="bi bi-bell-slash empty-icon"></i>
          <p>Không có thông báo nào để hiển thị.</p>
        </div>
      )}
    </div>
  );
}

export default Notifications;