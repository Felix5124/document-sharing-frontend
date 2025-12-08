import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { getUserFollowing, getUserFollows, unfollow } from '../services/api';
import { getFullAvatarUrl } from '../utils/avatarUtils';
import '../styles/pages/FollowList.css';

function FollowList() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'following'; // 'following' or 'followers'
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(type);
  const navigate = useNavigate();

  useEffect(() => {
    setActiveTab(type);
  }, [type]);

  useEffect(() => {
    if (activeTab === 'following') {
      fetchFollowing();
    } else {
      fetchFollowers();
    }
  }, [activeTab, user]);

  const fetchFollowing = async () => {
    setLoading(true);
    try {
      const response = await getUserFollowing(user.userId);
      const dataRaw = Array.isArray(response.data) ? response.data : (response.data?.$values || []);
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
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleUnfollow = async (followId) => {
    try {
      await unfollow(followId);
      toast.success('Bỏ theo dõi thành công!');
      fetchFollowing();
      fetchFollowers();
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

  const safeAvatar = (relativeOrAbsoluteUrl) => getFullAvatarUrl(relativeOrAbsoluteUrl);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/follow-list?type=${tab}`);
  };

  return (
    <div className="follow-list-container">
      <div className="follow-list-card">
        <h2 className="follow-list-title">
          <i className="bi bi-people icon-margin-right"></i>
          Danh sách theo dõi
        </h2>

        {/* Tabs */}
        <div className="follow-list-tabs">
          <button
            className={`tab-button ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => handleTabChange('following')}
          >
            <i className="bi bi-person-check"></i>
            Đang theo dõi ({following.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'followers' ? 'active' : ''}`}
            onClick={() => handleTabChange('followers')}
          >
            <i className="bi bi-people-fill"></i>
            Người theo dõi ({followers.length})
          </button>
        </div>

        {/* Content */}
        <div className="follow-list-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p className="loading-text">Đang tải...</p>
            </div>
          ) : activeTab === 'following' ? (
            following.length > 0 ? (
              <div className="follow-grid">
                {following.map((follow) => (
                  <div key={follow.followId} className="follow-card">
                    <div className="follow-card-content">
                      <div 
                        className="follow-avatar" 
                        onClick={() => navigate(`/profile/${follow.followedUserId}`)}
                      >
                        <img
                          src={safeAvatar(follow.avatarUrl)}
                          alt={follow.fullName}
                          className="avatar-img"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getFullAvatarUrl('');
                          }}
                        />
                      </div>
                      <div 
                        className="follow-info" 
                        onClick={() => navigate(`/profile/${follow.followedUserId}`)}
                      >
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
                        <i className="bi bi-person-dash"></i>
                        Bỏ theo dõi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <i className="bi bi-person-x empty-icon"></i>
                <p>Bạn chưa theo dõi ai.</p>
              </div>
            )
          ) : (
            followers.length > 0 ? (
              <div className="follow-grid">
                {followers.map((follower) => (
                  <div key={follower.followId} className="follow-card">
                    <div className="follow-card-content">
                      <div 
                        className="follow-avatar" 
                        onClick={() => navigate(`/profile/${follower.userId}`)}
                      >
                        <img
                          src={safeAvatar(follower.avatarUrl)}
                          alt={follower.fullName}
                          className="avatar-img"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getFullAvatarUrl('');
                          }}
                        />
                      </div>
                      <div 
                        className="follow-info" 
                        onClick={() => navigate(`/profile/${follower.userId}`)}
                      >
                        <p className="follow-name">{follower.fullName}</p>
                        <p className="follow-email">{follower.email}</p>
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
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default FollowList;
