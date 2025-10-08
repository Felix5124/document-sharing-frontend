import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getUser, updateUser, getUploadCount, uploadAvatar, deleteDocument, getDownloads, getSchools } from '../services/api';
import { toast } from 'react-toastify';
import Achievements from '../components/Achievements';

import '../styles/pages/Profile.css';

function Profile() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [uploadCount, setUploadCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [avatarFile, setAvatarFile] = useState(null);
  const [schools, setSchools] = useState([]);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, uploadResponse, downloadResponse, schoolsResponse] = await Promise.all([
          getUser(user.userId),
          getUploadCount(user.userId),
          getDownloads(user.userId),
          getSchools()
        ]);
        setUserData(userResponse.data);
        setUploads(uploadResponse.data.uploads);
        setUploadCount(uploadResponse.data.uploadCount);
        setDownloads(downloadResponse.data);
        setDownloadCount(downloadResponse.data.length);
        setSchools(schoolsResponse.data);
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
        setUserData((prev) => ({
          ...prev,
          avatarUrl: avatarResponse.data.avatarUrl
        }));
      }

      const updateData = {
        FullName: data.FullName,
        SchoolId: parseInt(data.SchoolId)
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
          <span className="icon icon-person-circle"></span> Hồ sơ cá nhân
        </h2>
        <div className="profile-content">
          <div className="avatar-section" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div className="avatar-wrapper" style={{ position: 'relative', width: '200px', height: '200px' }}>
              <img
                src={avatarFile ? URL.createObjectURL(avatarFile) : (userData.avatarUrl ? `https://localhost:7013${userData.avatarUrl}` : '../src/assets/images/anh.png')}
                alt="Avatar"
                className="avatar-img"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                onError={(e) => (e.target.src = '/default-avatar.png')}
              />
              <div className="avatar-upload" style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: '50%', padding: '8px' }}>
                <span className="icon-camera-fill" style={{ color: 'white', fontSize: '1.5rem', display: 'inline-block', width: '1.5rem', height: '1.5rem' }}></span>
                <input
                  type="file"
                  accept="image/*"
                  className="avatar-input"
                  onChange={handleAvatarChange}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
          <div className="profile-form">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label className="form-label">Họ tên</label>
                <div className="input-wrapper">
                  <span className="icon-person input-icon"></span>
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
                  <span className="icon-envelope input-icon"></span>
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
                  <span className="icon-building input-icon"></span>
                  <select
                    className="form-input"
                    defaultValue={userData.schoolId || 0}
                    {...register('SchoolId', {
                      required: 'Vui lòng chọn trường học',
                      validate: (value) => parseInt(value) !== 0 || 'Vui lòng chọn trường học',
                    })}
                  >
                    <option value="0">Chọn trường học</option>
                    {schools.map(school => (
                      <option key={school.schoolId} value={school.schoolId}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.SchoolId && <p className="error-text">{errors.SchoolId.message}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Điểm tích lũy</label>
                <div className="input-wrapper">
                  <span className="icon-star input-icon"></span>
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
                  <span className="icon-award input-icon"></span>
                  <input
                    type="text"
                    className="form-input"
                    value={userData.level}
                    disabled
                  />
                </div>
              </div>
              <button type="submit" className="submit-button">
                <span className="icon icon-check-circle"></span> Cập nhật
              </button>
            </form>
          </div>
        </div>
        <hr className="profile-divider" />
        <div className="profile-stats">
          <h4 className="stats-title">
            <span className="icon icon-cloud-upload"></span> Tài liệu đã tải lên ({uploadCount})
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
                    <span className="icon icon-trash"></span> Xóa
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
            <span className="icon icon-cloud-download"></span> Tài liệu đã tải xuống ({downloadCount})
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