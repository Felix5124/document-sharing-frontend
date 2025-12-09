import { useEffect, useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  getUser,
  updateUser,
  getUploadCount,
  uploadAvatar,
  deleteDocument,
  getDownloads,
  getUserFollowing,
  getUserFollows,
  follow,
  unfollow
} from '../services/api';
import { toast } from 'react-toastify';
import Achievements from '../components/Achievements';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserCircle,
  faCamera,
  faUser,
  faEnvelope,
  faAward,
  faCheckCircle,
  faCloudUploadAlt,
  faCloudDownloadAlt,
  faTrash,
  faEyeSlash,
  faEye,
} from '@fortawesome/free-solid-svg-icons';

import '../styles/pages/Profile.css';
import '../styles/layouts/PageWithSidebar.css';
import { getFullAvatarUrl } from '../utils/avatarUtils';
import VipPromoBanner from '../components/VipPromoBanner';
import VipWelcomeBanner from '../components/VipWelcomeBanner';
import RightSidebar from '../components/RightSidebar';

function Profile() {
  const navigate = useNavigate();
  const { user, updateUserContext } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [uploadCount, setUploadCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [avatarFile, setAvatarFile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentFollowId, setCurrentFollowId] = useState(null);
  const [hideLeftSidebar, setHideLeftSidebar] = useState(false);
  const [hideRightSidebar, setHideRightSidebar] = useState(false);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, type: '' });
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  // schools removed
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { id: routeUserId } = useParams();
  const viewingOther = !!routeUserId && String(routeUserId) !== String(user?.userId);
  const targetUserId = routeUserId ? parseInt(routeUserId, 10) : user?.userId;
  const canEdit = !!user && !viewingOther && String(user?.userId) === String(targetUserId);

  // Handle context menu
  const handleContextMenu = (e, type) => {
    if (!user?.isVip) return;
    e.preventDefault();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, type });
  };

  const handleToggleSidebar = (type) => {
    if (type === 'left') {
      setHideLeftSidebar(!hideLeftSidebar);
    } else if (type === 'right') {
      setHideRightSidebar(!hideRightSidebar);
    }
    setContextMenu({ show: false, x: 0, y: 0, type: '' });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu({ show: false, x: 0, y: 0, type: '' });
    if (contextMenu.show) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.show]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // If viewing another user's profile, fetch that user's public data. Some endpoints are safe to call for other users.
        const [userResponse, uploadResponse, followingResp, followersResp] = await Promise.all([
          getUser(targetUserId),
          getUploadCount(targetUserId),
          getUserFollowing(targetUserId),
          getUserFollows(targetUserId),
        ]);
        setUserData(userResponse.data);
        console.log('userData.isEmailVerified:', userResponse.data.isEmailVerified);
        setUploads(uploadResponse.data.uploads);
        setUploadCount(uploadResponse.data.uploadCount);
        
        // Only fetch downloads when viewing own profile (private data)
        if (canEdit) {
          try {
            const downloadResponse = await getDownloads(targetUserId);
            setDownloads(downloadResponse.data);
            setDownloadCount(downloadResponse.data.length);
          } catch (dErr) {
            console.warn('Could not fetch downloads', dErr);
            setDownloads([]);
            setDownloadCount(0);
          }
        } else {
          setDownloads([]);
          setDownloadCount(0);
        }

        // Normalize following/followers arrays and set counts
        let followingData = followingResp.data;
        if (Array.isArray(followingData?.$values)) followingData = followingData.$values;
        let followersData = followersResp.data;
        if (Array.isArray(followersData?.$values)) followersData = followersData.$values;
        setFollowingCount(Array.isArray(followingData) ? followingData.length : 0);
        setFollowersCount(Array.isArray(followersData) ? followersData.length : 0);

        // If current user is logged in and is viewing another profile, check whether current user follows the target
        if (user?.userId && Number(user.userId) !== Number(targetUserId)) {
          try {
            const myFollowingResp = await getUserFollowing(user.userId);
            let myFollowing = myFollowingResp.data;
            if (Array.isArray(myFollowing?.$values)) myFollowing = myFollowing.$values;
            const found = (myFollowing || []).find(f => (f.followedUserId || f.FollowedUserId) === Number(targetUserId));
            if (found) {
              setIsFollowing(true);
              setCurrentFollowId(found.followId || found.FollowId || found.FollowId);
            } else {
              setIsFollowing(false);
              setCurrentFollowId(null);
            }
          } catch (err) {
            console.warn('Could not determine follow status', err);
          }
        }
      } catch (error) {
        console.error('Fetch error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', { toastId: 'auth-error' });
          navigate('/login');
        } else {
          toast.error('Không thể tải dữ liệu.', { toastId: 'data-error' });
        }
      }
    };
    // If viewing another user's profile, allow even when not logged in; otherwise require current user.
    if (routeUserId) {
      fetchData();
    } else if (user?.userId) {
      fetchData();
    } else {
      console.warn('No userId found, redirecting to login');
      navigate('/login');
    }
  }, [user, navigate, routeUserId]);

  const onSubmit = async (data) => {
    try {
      if (avatarFile) {
        const avatarResponse = await uploadAvatar(user.userId, avatarFile);
        const newAvatarUrl = avatarResponse.data.avatarUrl; // SAS URL
        setUserData((prev) => ({
          ...prev,
          avatarUrl: newAvatarUrl
        }));
        // Cập nhật ngay Context để Navbar phản ánh lập tức
        updateUserContext({ avatarUrl: newAvatarUrl });
      }

      const updateData = {
        FullName: data.FullName,
      };
      await updateUser(user.userId, updateData);

      toast.success('Cập nhật hồ sơ thành công.');
      const userResponse = await getUser(user.userId);
      setUserData(userResponse.data);
      // Đồng bộ lại Context (phòng trường hợp BE trả thêm field khác)
      if (userResponse?.data?.avatarUrl) {
        updateUserContext({ avatarUrl: userResponse.data.avatarUrl });
      }
      setAvatarFile(null);
    } catch (error) {
      console.error('Update error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Cập nhật hồ sơ thất bại.');
    }
  };

  const handleFollow = async () => {
    if (!user || !user.userId) {
      navigate('/login');
      return;
    }
    try {
      const res = await follow({ UserId: user.userId, FollowedUserId: targetUserId });
      const created = res.data || res;
      const fid = created?.followId || created?.FollowId || created?.FollowId;
      setIsFollowing(true);
      setCurrentFollowId(fid);
      // increment followers count locally
      setFollowersCount(prev => prev + 1);
      toast.success('Bắt đầu theo dõi thành công.');
    } catch (err) {
      console.error('Follow error', err.response?.data || err.message);
      toast.error('Không thể theo dõi người này.');
    }
  };

  const handleUnfollow = async () => {
    if (!currentFollowId) return;
    try {
      await unfollow(currentFollowId);
      setIsFollowing(false);
      setCurrentFollowId(null);
      setFollowersCount(prev => Math.max(0, prev - 1));
      toast.success('Đã hủy theo dõi.');
    } catch (err) {
      console.error('Unfollow error', err.response?.data || err.message);
      toast.error('Không thể hủy theo dõi.');
    }
  };

  const handleAvatarChange = (e) => {
    if (e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleDocumentClick = (documentId) => {
    // If the current viewer can edit (owner), go to the update page; otherwise go to the public document detail page
    if (canEdit) {
      navigate(`/update/${documentId}`);
    } else {
      navigate(`/document/${documentId}`);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.');
    if (confirmDelete) {
      try {
        await deleteDocument(documentId);
        setUploads((prevUploads) =>
          prevUploads.filter(upload => upload.documentId !== documentId)
        );
        setUploadCount((prevCount) => prevCount - 1);
        toast.success('Xóa tài liệu thành công.');
      } catch (error) {
        console.error('Delete error:', error.response?.data || error.message);
        toast.error(error.response?.data?.message || 'Xóa tài liệu thất bại.');
      }
    }
  };

  if (!userData) return <div className="loading-display">Đang tải...</div>;

  return (
    <div className="all-container">
      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="sidebar-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={() => handleToggleSidebar(contextMenu.type)}>
            {(contextMenu.type === 'left' && hideLeftSidebar) || (contextMenu.type === 'right' && hideRightSidebar) 
              ? '👁️ Hiển thị' 
              : '🚫 Ẩn'}
          </button>
        </div>
      )}

      <div className={`page-layout-with-sidebar ${userData?.isVip ? 'no-left-sidebar' : ''}`}>
        {/* Sidebar - VIP Welcome or Promo Banner */}
        {viewingOther ? (
          <aside className="page-sidebar">
            {/* Div rỗng khi xem profile người khác */}
          </aside>
        ) : (
          <>
            {canEdit && user?.isVip && (
              <aside 
                className="page-sidebar"
                onContextMenu={(e) => handleContextMenu(e, 'left')}
                style={{ cursor: 'context-menu' }}
              >
                {!hideLeftSidebar && <VipWelcomeBanner />}
              </aside>
            )}
            {canEdit && user && !userData.isVip && (
              <aside className="page-sidebar">
                <VipPromoBanner variant="profile" />
              </aside>
            )}
          </>
        )}

        {/* Main Content */}
        <div className="page-main-content">
          <div className="all-container-card">
            <h2 className="upload-title">
              <FontAwesomeIcon icon={faUserCircle} /> Hồ sơ cá nhân
            </h2>

            <div className="profile-content">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              <img
                src={
                  avatarFile
                    ? URL.createObjectURL(avatarFile)
                    : getFullAvatarUrl(userData.avatarUrl || userData.AvatarUrl || null)
                }
                alt="Avatar"
                className={`avatar-img ${userData.isVip ? 'vip' : ''}`}
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFullAvatarUrl(null); }}
                onClick={() => setShowAvatarModal(true)}
                style={{ cursor: 'pointer' }}
                title="Click để xem ảnh lớn hơn"
              />
              {userData.isVip && (
                <div className="vip-badge-profile">
                  <FontAwesomeIcon icon={faAward} /> Premium
                </div>
              )}

              {canEdit && (
                <div className="avatar-upload">
                  <FontAwesomeIcon icon={faCamera} />
                  <input
                    type="file"
                    accept="image/*"
                    className="avatar-input"
                    onChange={handleAvatarChange}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="profile-form">
            {canEdit ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                  <label className="form-label">Họ tên</label>
                  <div className="input-wrapper">
                    <FontAwesomeIcon icon={faUser} className="input-icon" />
                    <input
                      type="text"
                      className="form-input"
                      defaultValue={userData.fullName}
                      {...register('FullName', { required: 'Vui lòng nhập họ tên' })}
                    />
                  </div>
                  {errors.FullName && <p className="error-text">{errors.FullName.message}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="input-wrapper email-verification-wrapper">
                    <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                    <input
                      type="email"
                      className="form-input"
                      value={userData.email}
                      disabled
                    />
                    {userData.isEmailVerified ? (
                      <span className="email-verified-badge" title="Email đã được xác thực">
                        <FontAwesomeIcon icon={faCheckCircle} /> Đã xác thực
                      </span>
                    ) : (
                      <span className="email-unverified-badge" title="Vui lòng xác thực email">
                        Chưa xác thực
                      </span>
                    )}
                  </div>
                </div>
                <div className='profile-follow-stats'>
                  <p>Đang theo dõi : {followingCount} người</p>
                  <p>Người theo dõi : {followersCount} người</p>
                </div>

                <button type="submit" className="submit-button">
                  <FontAwesomeIcon icon={faCheckCircle} /> Cập nhật
                </button>
              </form>
            ) : (
              <div className="profile-readonly">
                <h3 style={{ marginBottom: 8 }}>{userData.fullName}</h3>
                <p style={{ marginBottom: 8, color: '#6b7280' }}>{userData.email}</p>
                <div className='profile-follow-stats'>
                  <p>Đang theo dõi : {followingCount} người</p>
                  <p>Người theo dõi : {followersCount} người</p>
                </div>
                <div style={{ marginTop: 12 }}>
                  {/* Follow / Unfollow actions when viewing another user's profile */}
                  {viewingOther && (
                    user?.userId ? (
                      isFollowing ? (
                        <button className="btn-secondary btn-full-width" onClick={handleUnfollow}>Hủy theo dõi</button>
                      ) : (
                        <button className="submit-button" onClick={handleFollow}>Theo dõi</button>
                      )
                    ) : (
                      <a href="/login" className="submit-button">Đăng nhập để theo dõi</a>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <hr className="profile-divider" />

        <div className="profile-stats">
          <h4 className="profile-title">
            <FontAwesomeIcon icon={faCloudUploadAlt} /> Tài liệu đã tải lên ({uploadCount})
          </h4>
          <ul className="stats-list-profile">
            {uploads.length > 0 ? (
              uploads.map((upload) => (
                <li
                  key={upload.documentId}
                  className="stats-item-profile"
                  onClick={() => handleDocumentClick(upload.documentId)}
                  style={{ cursor: 'pointer' }}
                >
                  <span style={{ flex: 1 }}>
                    {upload.title} ({upload.fileType}) - {upload.downloadCount} lượt tải -
                    Tải lên: {new Date(upload.uploadedAt).toLocaleString()} - Trạng thái:{' '}
                    <span className={`status-text status-${upload.approvalStatus?.toLowerCase()}`}>
                      {
                        {
                          'Approved': 'Đã duyệt',
                          'SemiApproved': 'Chưa kiểm duyệt',
                          'Pending': 'Đang chờ',
                          'Rejected': 'Bị từ chối',
                          'Suspended': 'Bị tạm ngưng' // Thêm trạng thái mới
                        }[upload.approvalStatus] || 'Không xác định'
                      }
                    </span>
                  </span>
                  {canEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(upload.documentId);
                      }}
                      className="delete-button"
                    >
                      <FontAwesomeIcon icon={faTrash} /> Xóa
                    </button>
                  )}
                </li>
              ))
            ) : (
              <p className="stats-empty">Chưa có tài liệu nào.</p>
            )}
          </ul>
        </div>


        {canEdit && (
          <div className="profile-stats">
            <h4 className="profile-title">
              <FontAwesomeIcon icon={faCloudDownloadAlt} /> Tài liệu đã tải xuống ({downloadCount})
            </h4>
            <ul className="stats-list">
              {downloads.length > 0 ? (
                downloads.map((download) => (
                  <li key={download.documentId} className="stats-item-profile">
                    <span style={{ flex: 1 }}>
                      {download.title} - Tải xuống: {new Date(download.addedAt).toLocaleString()}
                    </span>
                  </li>
                ))
              ) : (
                <p className="stats-empty">Chưa có tài liệu nào.</p>
              )}
            </ul>
          </div>
        )}

        <div className="profile-achievements">
          <Achievements userId={targetUserId} />
        </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside 
          className="page-sidebar-right"
          onContextMenu={(e) => handleContextMenu(e, 'right')}
          style={{ cursor: user?.isVip ? 'context-menu' : 'default' }}
        >
          {viewingOther ? (
            /* Div rỗng khi xem profile người khác */
            <></>
          ) : (
            !hideRightSidebar && <RightSidebar variant="profile" />
          )}
        </aside>
      </div>

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="avatar-modal-overlay" onClick={() => setShowAvatarModal(false)}>
          <div className="avatar-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="avatar-modal-close" onClick={() => setShowAvatarModal(false)}>
              &times;
            </button>
            <img
              src={
                avatarFile
                  ? URL.createObjectURL(avatarFile)
                  : getFullAvatarUrl(userData.avatarUrl || userData.AvatarUrl || null)
              }
              alt="Avatar lớn"
              className="avatar-modal-img"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFullAvatarUrl(null); }}
            />
            <p className="avatar-modal-name">{userData.fullName}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
