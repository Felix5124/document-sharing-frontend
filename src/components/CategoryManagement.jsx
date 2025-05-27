import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import useOnScreen from '../hooks/useOnScreen';

function CategoryManagement() {
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', type: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    fetchCategories();
  }, [navigate, user]);

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      let data = response.data;
      if (Array.isArray(data.$values)) {
        data = data.$values;
      }
      setCategories(data);
    } catch (error) {
      toast.error('Không thể tải danh sách thể loại.', { toastId: 'categories-error' });
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name || !newCategory.type) {
      toast.error('Vui lòng nhập đầy đủ thông tin thể loại.');
      return;
    }
    try {
      await createCategory(newCategory);
      toast.success('Thêm thể loại thành công.');
      setNewCategory({ name: '', type: '' });
      fetchCategories();
    } catch (error) {
      toast.error('Thêm thể loại thất bại.');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory({ ...category });
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory.name || !editingCategory.type) {
      toast.error('Vui lòng nhập đầy đủ thông tin thể loại.');
      return;
    }
    try {
      await updateCategory(editingCategory.categoryId, {
        name: editingCategory.name,
        type: editingCategory.type,
      });
      toast.success('Cập nhật thể loại thành công.');
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error('Cập nhật thể loại thất bại.');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa thể loại này?')) return;
    try {
      await deleteCategory(id);
      toast.success('Xóa thể loại thành công.');
      fetchCategories();
    } catch (error) {
      toast.error('Xóa thể loại thất bại.');
    }
  };

  // Component cho Table Row với hiệu ứng fade-in
  const CategoryRow = ({ category }) => {
    const rowRef = useRef(null);
    const isVisible = useOnScreen(rowRef);

    return (
      <tr ref={rowRef} className={`fade-in ${isVisible ? 'visible' : ''}`}>
        <td>{category.name}</td>
        <td>{category.type}</td>
        <td>
          <button
            className="action-button edit-button me-2"
            onClick={() => handleEditCategory(category)}
          >
            <i className="bi bi-pencil me-2"></i> Sửa
          </button>
          <button
            className="action-button delete-button"
            onClick={() => handleDeleteCategory(category.categoryId)}
          >
            <i className="bi bi-trash me-2"></i> Xóa
          </button>
        </td>
      </tr>
    );
  };

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="admin-section">
      <h4 className="section-title">
        <i className="bi bi-tags me-2"></i> Quản lý thể loại tài liệu
      </h4>

      {/* Form thêm thể loại mới */}
      <div className="category-form mb-4">
        <h5>Thêm thể loại mới</h5>
        <form onSubmit={handleAddCategory}>
          <div className="form-group">
            <label className="form-label">Tên thể loại</label>
            <input
              type="text"
              className="form-input"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Nhập tên thể loại"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Loại</label>
            <input
              type="text"
              className="form-input"
              value={newCategory.type}
              onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value })}
              placeholder="Nhập loại (ví dụ: pdf, doc)"
            />
          </div>
          <button type="submit" className="submit-button">
            <i className="bi bi-plus-circle me-2"></i> Thêm thể loại
          </button>
        </form>
      </div>

      {/* Form chỉnh sửa thể loại */}
      {editingCategory && (
        <div className="category-form mb-4">
          <h5>Chỉnh sửa thể loại</h5>
          <form onSubmit={handleUpdateCategory}>
            <div className="form-group">
              <label className="form-label">Tên thể loại</label>
              <input
                type="text"
                className="form-input"
                value={editingCategory.name}
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Loại</label>
              <input
                type="text"
                className="form-input"
                value={editingCategory.type}
                onChange={(e) => setEditingCategory({ ...editingCategory, type: e.target.value })}
              />
            </div>
            <button type="submit" className="submit-button me-2">
              <i className="bi bi-check-circle me-2"></i> Cập nhật
            </button>
            <button
              type="button"
              className="action-button cancel-button"
              onClick={() => setEditingCategory(null)}
            >
              <i className="bi bi-x-circle me-2"></i> Hủy
            </button>
          </form>
        </div>
      )}

      {/* Danh sách thể loại */}
      {categories.length > 0 ? (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên thể loại</th>
                <th>Loại</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <CategoryRow key={category.categoryId} category={category} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <i className="bi bi-tags empty-icon"></i>
          <p>Không có thể loại nào để hiển thị.</p>
        </div>
      )}
    </div>
  );
}

export default CategoryManagement;