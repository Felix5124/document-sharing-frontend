import { useEffect, useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  getUser,
  updateUser,
  getUploadCount,
  uploadAvatar,
  deleteDocument,
  getDownloads,
  getUserFollowing,
  getUserFollows
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
} from '@fortawesome/free-solid-svg-icons';

import '../styles/pages/Profile.css';
import { getFullAvatarUrl } from '../utils/avatarUtils';

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
  // schools removed
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, uploadResponse, downloadResponse, followingResp, followersResp] = await Promise.all([
          getUser(user.userId),
          getUploadCount(user.userId),
          getDownloads(user.userId),
          getUserFollowing(user.userId),
          getUserFollows(user.userId),
        ]);
        setUserData(userResponse.data);
        setUploads(uploadResponse.data.uploads);
        setUploadCount(uploadResponse.data.uploadCount);
        setDownloads(downloadResponse.data);
        setDownloadCount(downloadResponse.data.length);

        // Normalize following/followers arrays and set counts
        let followingData = followingResp.data;
        if (Array.isArray(followingData?.$values)) followingData = followingData.$values;
        let followersData = followersResp.data;
        if (Array.isArray(followersData?.$values)) followersData = followersData.$values;
        setFollowingCount(Array.isArray(followingData) ? followingData.length : 0);
        setFollowersCount(Array.isArray(followersData) ? followersData.length : 0);
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
    if (user?.userId) {
      fetchData();
    } else {
      console.warn('No userId found, redirecting to login');
      navigate('/login');
    }
  }, [user, navigate]);

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

  const handleAvatarChange = (e) => {
    if (e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleDocumentClick = (documentId) => {
    navigate(`/update/${documentId}`);
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

  if (!userData) return <div>Đang tải...</div>;

  return (
    <div className="all-container">
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
              />
              {userData.isVip && (
                <div className="vip-badge-profile">
                  <FontAwesomeIcon icon={faAward} /> VIP
                </div>
              )}

              <div className="avatar-upload">
                <FontAwesomeIcon icon={faCamera} />
                <input
                  type="file"
                  accept="image/*"
                  className="avatar-input"
                  onChange={handleAvatarChange}
                />
              </div>
            </div>
          </div>

          <div className="profile-form">
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
                <div className="input-wrapper">
                  <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                  <input
                    type="email"
                    className="form-input"
                    value={userData.email}
                    disabled
                  />
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(upload.documentId);
                    }}
                    className="delete-button"
                  >
                    <FontAwesomeIcon icon={faTrash} /> Xóa
                  </button>
                </li>
              ))
            ) : (
              <p className="stats-empty">Chưa có tài liệu nào.</p>
            )}
          </ul>
        </div>


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

        <div className="profile-achievements">
          <Achievements />
        </div>
      </div>
    </div>
  );
}

export default Profile;
