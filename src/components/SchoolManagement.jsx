import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getSchools, createSchool, updateSchool, deleteSchool } from '../services/api';
import '../styles/components/SchoolManagement.css';

function SchoolManagement() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', logo: null, externalUrl: '' });
  const [editingSchool, setEditingSchool] = useState(null);

  
  // Lấy danh sách trường học
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await getSchools();
        setSchools(response.data || []);
      } catch (error) {
        toast.error('Không thể tải danh sách trường học.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  // Xử lý thêm hoặc sửa trường
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchool) {
        // Sửa trường
        await updateSchool(editingSchool.schoolId, formData);
        toast.success('Cập nhật trường học thành công!');
        setSchools((prev) =>
          prev.map((school) =>
            school.schoolId === editingSchool.schoolId
              ? { ...school, name: formData.name, externalUrl: formData.externalUrl, logoUrl: school.logoUrl }
              : school
          )
        );
      } else {
        // Thêm trường
        await createSchool(formData);
        toast.success('Thêm trường học thành công!');
        const response = await getSchools();
        setSchools(response.data || []);
      }
      setFormData({ name: '', logo: null, externalUrl: '' });
      setEditingSchool(null);
    } catch (error) {
      toast.error(error.response?.data || 'Lỗi khi lưu trường học.');
    }
  };

  // Xử lý chỉnh sửa trường
  const handleEdit = (school) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      logo: null,
      externalUrl: school.externalUrl,
    });
  };

  // Xử lý xóa trường
  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa trường này?')) {
      try {
        await deleteSchool(id);
        toast.success('Xóa trường học thành công!');
        setSchools((prev) => prev.filter((school) => school.schoolId !== id));
      } catch (error) {
        toast.error(error.response?.data || 'Lỗi khi xóa trường học.');
      }
    }
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="school-management">
      <h4>{editingSchool ? 'Sửa trường học' : 'Thêm trường học'}</h4>
      <form onSubmit={handleSubmit} className="margin-bottom-md">
        <div className="form-group">
          <label className="form-label">Tên trường</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="custom-input"
            placeholder="Nhập tên trường"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Logo trường</label>
          <input
            type="file"
            name="logo"
            onChange={handleInputChange}
            className="custom-file-input"
            accept="image/*"
            required={!editingSchool}
          />
        </div>
        <div className="form-group">
          <label className="form-label">URL bên ngoài</label>
          <input
            type="url"
            name="externalUrl"
            value={formData.externalUrl}
            onChange={handleInputChange}
            className="custom-input"
            placeholder="Nhập URL (http:// hoặc https://)"
            required
          />
        </div>
        <button type="submit" className="custom-btn primary-btn">
          {editingSchool ? 'Cập nhật' : 'Thêm trường'}
        </button>
        {editingSchool && (
          <button
            type="button"
            className="custom-btn secondary-btn margin-left-sm"
            onClick={() => {
              setEditingSchool(null);
              setFormData({ name: '', logo: null, externalUrl: '' });
            }}
          >
            Hủy
          </button>
        )}
      </form>

      <h4>Danh sách trường học</h4>
      {schools.length > 0 ? (
        <table className="custom-table">
          <thead>
            <tr>
              <th>Tên trường</th>
              <th>Logo</th>
              <th>URL</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((school) => (
              <tr key={school.schoolId}>
                <td>{school.name}</td>
                <td>
                  <img
                    src={`https://localhost:7013/${school.logoUrl}`}
                    alt={school.name}
                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.src = '/default-school-logo.png';
                    }}
                  />
                </td>
                <td>
                  <a href={school.externalUrl} target="_blank" rel="noopener noreferrer">
                    {school.externalUrl}
                  </a>
                </td>
                <td>
                  <button
                    className="custom-btn small-btn warning-btn margin-right-sm"
                    onClick={() => handleEdit(school)}
                  >
                    Sửa
                  </button>
                  <button
                    className="custom-btn small-btn danger-btn"
                    onClick={() => handleDelete(school.schoolId)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Không có trường học nào.</p>
      )}
    </div>
  );
}

export default SchoolManagement;