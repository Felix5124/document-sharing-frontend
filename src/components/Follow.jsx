import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { getUserFollowing, getUserFollows, unfollow } from '../services/api';
import { getFullAvatarUrl } from '../utils/avatarUtils';
import '../styles/components/Follow.css';

function Follow() {
  const { user } = useContext(AuthContext);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [showFollowers, setShowFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const navigate = useNavigate();

  const navigateToProfile = (idCandidate) => {
    const id = Number(idCandidate);
    if (!id || Number.isNaN(id)) {
      toast.error('Không xác định được người dùng.');
      return;
    }
    navigate(`/profile/${id}`);
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoadingCounts(true);
      try {
        await Promise.all([fetchFollowing(), fetchFollowerCount()]);
      } catch (e) {
        // ignore, individual functions handle errors
      } finally {
        setLoadingCounts(false);
      }
    };

    loadAll();
  }, [user]);

  const fetchFollowing = async () => {
    setLoadingFollowing(true);
    try {
      const response = await getUserFollowing(user.userId);
      const dataRaw = Array.isArray(response.data) ? response.data : (response.data?.$values || []);
      // Normalize to expected shape
      const data = dataRaw.map(item => ({
        followId: item.followId,
        userId: item.userId,
        followedUserId: item.followedUserId,
        fullName: item.fullName || item.followedUserFullName,
        email: item.email || item.followedUserEmail,
        avatarUrl: item.avatarUrl || item.followedUserAvatarUrl,
      }));
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

  // Sử dụng ảnh đại diện thật từ hệ thống; không tạo ảnh từ bên thứ ba
  const safeAvatar = (relativeOrAbsoluteUrl) => getFullAvatarUrl(relativeOrAbsoluteUrl);

  return (
    <div className="all-container">
      <div className="all-container-card">
        <h2 className="upload-title">
          <i className="bi bi-person-plus icon-margin-right"></i> Quản lý theo dõi
        </h2>

        {/* Following List */}
        <div className="follow-section">
          <div className="section-header">
            <h4 className="section-title">Đang theo dõi ({loadingCounts ? <span className="count-spinner" aria-hidden="true"></span> : following.length})</h4>
            {following.length > 0 && (
              <button 
                className="view-all-button"
                onClick={() => navigate('/follow-list?type=following')}
              >
                <i className="bi bi-eye"></i>
                Xem tất cả
              </button>
            )}
          </div>
          {loadingFollowing ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Đang tải...</p>
            </div>
          ) : following.length > 0 ? (
            <>
              <div className="follow-grid">
                {following.slice(0, 10).map((follow) => (
                  <div key={follow.followId} className="follow-card">
                    <div className="follow-card-content">
                      <div className="follow-avatar" onClick={() => navigateToProfile(follow.followedUserId || follow.userId)} style={{ cursor: 'pointer' }}>
                        <img
                          src={safeAvatar(follow.avatarUrl)}
                          alt={follow.fullName}
                          className="avatar-img"
                          onError={(e) => {
                            // Fallback về ảnh mặc định nội bộ
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getFullAvatarUrl('');
                          }}
                        />
                      </div>
                      <div className="follow-info" onClick={() => navigateToProfile(follow.followedUserId || follow.userId)} style={{ cursor: 'pointer' }}>
                        <p className="follow-name">{follow.fullName}</p>
                        <p className="follow-email">{follow.email}</p>
                      </div>
                      <button
                        className="unfollow-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnfollow(follow.followId);
                        }}
                      >
                        Bỏ theo dõi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {following.length > 10 && (
                <div className="view-more-notice">
                  <i className="bi bi-info-circle"></i>
                  <span>Còn {following.length - 10} người nữa.</span>
                  <button 
                    className="view-more-link"
                    onClick={() => navigate('/follow-list?type=following')}
                  >
                    Bấm "Xem tất cả" để xem thêm
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>Bạn chưa theo dõi ai.</p>
            </div>
          )}
        </div>

        {/* Followers List */}
        <div className="follow-section">
          <div className="section-header">
            <h4 className="section-title follow-toggle" onClick={toggleFollowers}>
              Người theo dõi ({loadingCounts ? <span className="count-spinner" aria-hidden="true"></span> : followerCount})
              <i className={`bi bi-chevron-${showFollowers ? 'up' : 'down'} icon-margin-left`}></i>
            </h4>
            {followerCount > 0 && (
              <button 
                className="view-all-button"
                onClick={() => navigate('/follow-list?type=followers')}
              >
                <i className="bi bi-eye"></i>
                Xem tất cả
              </button>
            )}
          </div>
          {showFollowers && (
            <div className="follow-list">
              {loadingFollowers ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p className="loading-text">Đang tải...</p>
                </div>
              ) : followers.length > 0 ? (
                <>
                  <div className="follow-grid">
                    {followers.slice(0, 10).map((follower) => (
                      <div key={follower.followId} className="follow-card">
                        <div className="follow-card-content">
                          <div className="follow-avatar" onClick={() => navigateToProfile(follower.userId)} style={{ cursor: 'pointer' }}>
                            <img
                              src={safeAvatar(follower.avatarUrl)}
                              alt={follower.fullName}
                              className="avatar-img"
                              onError={(e) => {
                                // Fallback về ảnh mặc định nội bộ
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = getFullAvatarUrl('');
                              }}
                            />
                          </div>
                          <div className="follow-info" onClick={() => navigateToProfile(follower.userId)} style={{ cursor: 'pointer' }}>
                            <p className="follow-name">{follower.fullName}</p>
                            <p className="follow-email">{follower.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {followers.length > 10 && (
                    <div className="view-more-notice">
                      <i className="bi bi-info-circle"></i>
                      <span>Còn {followers.length - 10} người nữa.</span>
                      <button 
                        className="view-more-link"
                        onClick={() => navigate('/follow-list?type=followers')}
                      >
                        Bấm "Xem tất cả" để xem thêm
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  
                  <p>Chưa có ai theo dõi bạn.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Follow;