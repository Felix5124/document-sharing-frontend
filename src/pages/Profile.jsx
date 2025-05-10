import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { getUser, updateUser, getUploads, getDownloads } from '../services/api';
import { toast } from 'react-toastify';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const storedUser = JSON.parse(localStorage.getItem('user'));
  const userId = storedUser?.userId;

  useEffect(() => {
    console.log('Stored User in Profile:', storedUser);
    if (!userId) {
      toast.error('Vui lòng đăng nhập lại.', { toastId: 'auth-error' });
      navigate('/login');
      return;
    }
    const fetchData = async () => {
      try {
        const [userResponse, uploadsResponse, downloadsResponse] = await Promise.all([
          getUser(userId),
          getUploads(),
          getDownloads(),
        ]);
        setUser(userResponse.data);
        setUploads(uploadsResponse.data);
        setDownloads(downloadsResponse.data);
      } catch (error) {
        console.error('Fetch error:', error.response?.data || error.message);
        toast.error('Không thể tải dữ liệu.', { toastId: 'data-error' });
      }
    };
    fetchData();
  }, [userId, navigate]);

  const onSubmit = async (data) => {
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('Avatar', avatarFile);
        formData.append('FullName', data.FullName);
        formData.append('School', data.School);
        // Gửi formData với avatar
        await updateUser(userId, formData);
      } else {
        // Gửi dữ liệu thường nếu không có avatar
        await updateUser(userId, data);
      }
      toast.success('Cập nhật hồ sơ thành công.');
      // Cập nhật lại thông tin user sau khi update
      const userResponse = await getUser(userId);
      setUser(userResponse.data);
    } catch (error) {
      console.error('Update error:', error.response?.data || error.message);
      toast.error('Cập nhật hồ sơ thất bại.');
    }
  };

  const handleAvatarChange = (e) => {
    if (e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2 className="profile-title">
          <i className="bi bi-person-circle me-2"></i> Hồ sơ cá nhân
        </h2>
        <div className="profile-content">
          <div className="avatar-section">
            <div className="avatar-wrapper">
              <img
                src={user.avatarUrl || 'https://via.placeholder.com/150'}
                alt="Avatar"
                className="avatar-img"
              />
              <div className="avatar-upload">
                <i className="bi bi-camera-fill"></i>
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
                  <i className="bi bi-person input-icon"></i>
                  <input
                    type="text"
                    className="form-input"
                    defaultValue={user.fullName}
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
                    value={user.email}
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
                    defaultValue={user.school}
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
                    value={user.points}
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
                    value={user.level}
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
            <i className="bi bi-cloud-upload me-2"></i> Tài liệu đã tải lên
          </h4>
          <ul className="stats-list">
            {uploads.length > 0 ? (
              uploads.map((upload) => (
                <li key={upload.DocumentId} className="stats-item">
                  {upload.Title} - {upload.DownloadCount} lượt tải
                </li>
              ))
            ) : (
              <p className="stats-empty">Chưa có tài liệu nào.</p>
            )}
          </ul>
          <h4 className="stats-title">
            <i className="bi bi-cloud-download me-2"></i> Tài liệu đã tải xuống
          </h4>
          <ul className="stats-list">
            {downloads.length > 0 ? (
              downloads.map((download) => (
                <li key={download.DocumentId} className="stats-item">
                  {download.Title} - Tải vào: {new Date(download.AddedAt).toLocaleString()}
                </li>
              ))
            ) : (
              <p className="stats-empty">Chưa có tài liệu nào.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Profile;