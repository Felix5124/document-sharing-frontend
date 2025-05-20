import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getUser, updateUser, getUploadCount, uploadAvatar, deleteDocument, getDownloads } from '../services/api';
import { toast } from 'react-toastify';
import Achievements from '../components/Achievements';

function Profile() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [downloads, setDownloads] = useState([]); // Thêm state cho downloads
  const [uploadCount, setUploadCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0); // Thêm state cho số lượng downloads
  const [avatarFile, setAvatarFile] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
  const fetchData = async () => {
    try {
      const [userResponse, uploadResponse, downloadResponse] = await Promise.all([
        getUser(user.userId),
        getUploadCount(user.userId),
        getDownloads(user.userId) // Gửi userId trực tiếp
      ]);
      setUserData(userResponse.data);
      setUploads(uploadResponse.data.uploads);
      setUploadCount(uploadResponse.data.uploadCount);
      setDownloads(downloadResponse.data);
      setDownloadCount(downloadResponse.data.length);
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
  if (user?.userId) { // Kiểm tra userId trước khi fetch
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
        setUserData((prev) => ({
          ...prev,
          avatarUrl: avatarResponse.data.avatarUrl
        }));
      }

      const updateData = {
        FullName: data.FullName,
        School: data.School
      };
      await updateUser(user.userId, updateData);

      toast.success('Cập nhật hồ sơ thành công.');
      const userResponse = await getUser(user.userId);
      setUserData(userResponse.data);
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
        setUploads((prevUploads) => prevUploads.filter(upload => upload.documentId !== documentId));
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
    <div className="profile-container">
      <div className="profile-card">
        <h2 className="profile-title">
          <i className="bi bi-person-circle me-2"></i> Hồ sơ cá nhân
        </h2>
        <div className="profile-content">
          <div className="avatar-section" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div className="avatar-wrapper" style={{ position: 'relative', width: '200px', height: '200px' }}>
              <img
                src={userData.avatarUrl ? `https://localhost:7013${userData.avatarUrl}` : '../src/assets/images/anh.png'}
                alt="Avatar"
                className="avatar-img"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                onError={(e) => (e.target.src = '/default-avatar.png')}
              />
              {!userData.avatarUrl && (
                <div className="avatar-upload" style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '50%', padding: '8px' }}>
                  <i className="bi bi-camera-fill" style={{ color: 'white', fontSize: '1.5rem' }}></i>
                  <input
                    type="file"
                    accept="image/*"
                    className="avatar-input"
                    onChange={handleAvatarChange}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="profile-form">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label className="form-label">Họ tên</label>
                <div className="input-wrapper">
                  <i className="bi bi-person input-icon"></i>
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
                  <i className="bi bi-envelope input-icon"></i>
                  <input
                    type="email"
                    className="form-input"
                    value={userData.email}
                    disabled
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Trường học</label>
                <div className="input-wrapper">
                  <i className="bi bi-building input-icon"></i>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue={userData.school}
                    {...register('School')}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Điểm tích lũy</label>
                <div className="input-wrapper">
                  <i className="bi bi-star input-icon"></i>
                  <input
                    type="text"
                    className="form-input"
                    value={userData.points}
                    disabled
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Cấp độ</label>
                <div className="input-wrapper">
                  <i className="bi bi-award input-icon"></i>
                  <input
                    type="text"
                    className="form-input"
                    value={userData.level}
                    disabled
                  />
                </div>
              </div>
              <button type="submit" className="submit-button">
                <i className="bi bi-check-circle me-2"></i> Cập nhật
              </button>
            </form>
          </div>
        </div>
        <hr className="profile-divider" />
        <div className="profile-stats">
          <h4 className="stats-title">
            <i className="bi bi-cloud-upload me-2"></i> Tài liệu đã tải lên ({uploadCount})
          </h4>
          <ul className="stats-list">
            {uploads.length > 0 ? (
              uploads.map((upload) => (
                <li key={upload.documentId} className="stats-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <span
                    onClick={() => handleDocumentClick(upload.documentId)}
                    style={{ flex: 1 }}
                  >
                    {upload.title} ({upload.fileType}) - {upload.downloadCount} lượt tải - Tải lên: {new Date(upload.uploadedAt).toLocaleString()} - Trạng thái: <span style={{ color: upload.isApproved ? 'green' : 'red' }}>{upload.isApproved ? 'Đã duyệt' : 'Chưa duyệt'}</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(upload.documentId);
                    }}
                    style={{
                      backgroundColor: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      marginLeft: '10px'
                    }}
                  >
                    <i className="bi bi-trash me-1"></i> Xóa
                  </button>
                </li>
              ))
            ) : (
              <p className="stats-empty">Chưa có tài liệu nào.</p>
            )}
          </ul>
        </div>
        <hr className="profile-divider" />
        <div className="profile-stats">
  <h4 className="stats-title">
    <i className="bi bi-cloud-download me-2"></i> Tài liệu đã tải xuống ({downloadCount})
  </h4>
  <ul className="stats-list">
    {downloads.length > 0 ? (
      downloads.map((download) => (
        <li key={download.documentId} className="stats-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        <hr className="profile-divider" />
        <div className="profile-achievements">
          <Achievements />
        </div>
      </div>
    </div>
  );
}

export default Profile;