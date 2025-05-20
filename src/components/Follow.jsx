import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Thêm import này
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { getUserFollowing, getUserFollows, unfollow } from '../services/api';

function Follow() {
  const { user } = useContext(AuthContext);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [showFollowers, setShowFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFollowing();
    fetchFollowerCount();
  }, [user]);

  const fetchFollowing = async () => {
    setLoadingFollowing(true);
    try {
      const response = await getUserFollowing(user.userId);
      const data = Array.isArray(response.data) ? response.data : [];
      setFollowing(data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', { toastId: 'auth-error' });
        navigate('/login');
      } else {
        toast.error('Không thể tải danh sách người bạn đang theo dõi.');
        console.error('Fetch following error:', error);
      }
    } finally {
      setLoadingFollowing(false);
    }
  };

  const fetchFollowerCount = async () => {
    try {
      const response = await getUserFollows(user.userId);
      const data = Array.isArray(response.data) ? response.data : [];
      setFollowerCount(data.length);
      setFollowers(data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', { toastId: 'auth-error' });
        navigate('/login');
      } else {
        toast.error('Không thể tải số lượng người đang theo dõi.');
        console.error('Fetch followers error:', error);
      }
    }
  };

  const fetchFollowers = async () => {
    setLoadingFollowers(true);
    try {
      const response = await getUserFollows(user.userId);
      const data = Array.isArray(response.data) ? response.data : [];
      setFollowers(data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', { toastId: 'auth-error' });
        navigate('/login');
      } else {
        toast.error('Không thể tải danh sách người đang theo dõi.');
        console.error('Fetch followers error:', error);
      }
    } finally {
      setLoadingFollowers(false);
    }
  };

  const handleUnfollow = async (followId) => {
    try {
      await unfollow(followId);
      toast.success('Bỏ theo dõi thành công!');
      fetchFollowing();
      if (showFollowers) {
        fetchFollowers();
      }
      fetchFollowerCount();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', { toastId: 'auth-error' });
        navigate('/login');
      } else {
        toast.error('Không thể bỏ theo dõi.');
        console.error('Unfollow error:', error);
      }
    }
  };

  const toggleFollowers = () => {
    setShowFollowers(!showFollowers);
    if (!showFollowers) {
      fetchFollowers();
    }
  };

  return (
    <div className="follow-container">
      <h2 className="follow-title">
        <i className="bi bi-person-plus me-2"></i> Quản lý theo dõi
      </h2>

      {/* Following List */}
      <div className="follow-section">
        <h4 className="section-title">Đang theo dõi ({following.length})</h4>
        {loadingFollowing ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Đang tải...</p>
          </div>
        ) : following.length > 0 ? (
          <div className="follow-grid">
            {following.map((follow) => (
              <div key={follow.followId} className="follow-card">
                <div className="follow-card-content">
                  <div className="follow-avatar">
                    <img
                      src={`https://ui-avatars.com/api/?name=${follow.followedUserFullName}&background=1a73e8&color=fff`}
                      alt={follow.followedUserFullName}
                      className="avatar-img"
                    />
                  </div>
                  <div className="follow-info">
                    <p className="follow-name">{follow.followedUserFullName}</p>
                    <p className="follow-email">{follow.followedUserEmail}</p>
                    <p className="follow-id">ID: {follow.followedUserId}</p>
                  </div>
                </div>
                <button
                  className="action-button unfollow-button"
                  onClick={() => handleUnfollow(follow.followId)}
                >
                  <i className="bi bi-person-dash me-1"></i> Bỏ theo dõi
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <i className="bi bi-person-x empty-icon"></i>
            <p>Bạn chưa theo dõi ai.</p>
          </div>
        )}
      </div>

      {/* Followers List */}
      <div className="follow-section">
        <h4
          className="section-title follow-toggle"
          onClick={toggleFollowers}
        >
          Người theo dõi ({followerCount})
          <i className={`bi bi-chevron-${showFollowers ? 'up' : 'down'} ms-2`}></i>
        </h4>
        {showFollowers && (
          <div className="follow-list">
            {loadingFollowers ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Đang tải...</p>
              </div>
            ) : followers.length > 0 ? (
              <div className="follow-grid">
                {followers.map((follower) => (
                  <div key={follower.followId} className="follow-card">
                    <div className="follow-card-content">
                      <div className="follow-avatar">
                        <img
                          src={`https://ui-avatars.com/api/?name=${follower.fullName}&background=1a73e8&color=fff`}
                          alt={follower.fullName}
                          className="avatar-img"
                        />
                      </div>
                      <div className="follow-info">
                        <p className="follow-name">{follower.fullName}</p>
                        <p className="follow-email">{follower.email}</p>
                        <p className="follow-id">ID: {follower.userId}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="bi bi-person-x empty-icon"></i>
                <p>Chưa có ai theo dõi bạn.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Follow;