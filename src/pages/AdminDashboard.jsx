import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, Link, Outlet, useOutletContext, useLocation } from 'react-router-dom'; // Removed Routes, Route as they are in App.jsx
import { 
    getPendingDocuments, 
    approveDocument, 
    getAllUsers, 
    getCategories, 
    createCategory as apiCreateCategory,
    updateCategory as apiUpdateCategory,
    deleteCategory as apiDeleteCategory,
    getAllBadges, 
    createBadge as apiCreateBadge
} from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import '../css/AdminDashboard.css'; // Ensure this CSS file exists and is correctly styled

// Sub-component: Tài liệu chờ duyệt
function PendingDocumentsView({ docs, onApprove }) {
  if (!docs) {
    return <div className="p-4 text-center">Đang tải danh sách tài liệu...</div>;
  }
  if (docs.length === 0) {
    return (
      <div className="empty-state p-4 text-center">
        <i className="bi bi-folder-x display-4 text-muted"></i>
        <p className="mt-3">Không có tài liệu nào chờ duyệt.</p>
      </div>
    );
  }
  return (
    <div className="card shadow-sm">
        <div className="card-header bg-light">
            <h5 className="mb-0"><i className="bi bi-file-earmark-check me-2"></i> Tài liệu chờ duyệt</h5>
        </div>
        <div className="card-body p-0">
            <div className="table-responsive">
            <table className="table table-hover admin-table mb-0 align-middle">
                <thead className="table-light">
                <tr>
                    <th>ID</th>
                    <th>Tiêu đề</th>
                    <th>Người tải lên</th>
                    <th>Ngày tải</th>
                    <th className="text-center">Hành động</th>
                </tr>
                </thead>
                <tbody>
                {docs.map((doc) => (
                    <tr key={doc.documentId}>
                    <td>{doc.documentId}</td>
                    <td>
                        <Link to={`/document/${doc.documentId}`} target="_blank" rel="noopener noreferrer" title={doc.title} className="text-decoration-none">
                        {doc.title && doc.title.length > 60 ? doc.title.substring(0, 60) + "..." : doc.title}
                        </Link>
                    </td>
                    <td>{doc.uploadedByEmail || 'N/A'}</td>
                    <td>{new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}</td>
                    <td className="text-center">
                        <button
                        className="btn btn-success btn-sm"
                        onClick={() => onApprove(doc.documentId)}
                        >
                        <i className="bi bi-check-circle me-1"></i> Duyệt
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
    </div>
  );
}

// Sub-component: Quản lý Người dùng
function UsersView({ users }) {
   if (!users) {
    return <div className="p-4 text-center">Đang tải danh sách người dùng...</div>;
  }
  if (users.length === 0) {
    return (
      <div className="empty-state p-4 text-center">
        <i className="bi bi-people-fill display-4 text-muted"></i>
        <p className="mt-3">Không có người dùng nào.</p>
      </div>
    );
  }
  return (
     <div className="card shadow-sm">
        <div className="card-header bg-light">
            <h5 className="mb-0"><i className="bi bi-people me-2"></i> Danh sách người dùng</h5>
        </div>
        <div className="card-body p-0">
            <div className="table-responsive">
            <table className="table table-hover admin-table mb-0 align-middle">
                <thead className="table-light">
                <tr>
                    <th>ID</th>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th className="text-center">Quyền</th>
                    <th>Ngày tạo</th>
                </tr>
                </thead>
                <tbody>
                {users.map((user) => (
                    <tr key={user.userId}>
                    <td>{user.userId}</td>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td className="text-center">{user.isAdmin ? <span className="badge bg-primary">Admin</span> : <span className="badge bg-secondary">User</span>}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
    </div>
  );
}

// Sub-component: Quản lý Danh mục
function CategoriesView() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategoriesData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getCategories();
      const data = response.data?.$values || response.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Không thể tải danh mục.');
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategoriesData();
  }, [fetchCategoriesData]);

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    const name = editingCategory ? editingCategory.name : newCategoryName;
    const type = editingCategory ? editingCategory.type : newCategoryType;

    if (!name.trim() || !type.trim()) {
      toast.warn('Vui lòng nhập tên và loại danh mục.');
      return;
    }
    try {
      if (editingCategory) {
        await apiUpdateCategory(editingCategory.categoryId, { name, type });
        toast.success('Cập nhật danh mục thành công!');
      } else {
        await apiCreateCategory({ name, type });
        toast.success('Tạo danh mục thành công!');
      }
      setNewCategoryName('');
      setNewCategoryType('');
      setEditingCategory(null);
      fetchCategoriesData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data || (editingCategory ? 'Lỗi cập nhật danh mục.' : 'Lỗi tạo danh mục.');
      toast.error(errorMsg);
      console.error("Error saving category:", error.response || error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa danh mục này? Các tài liệu thuộc danh mục này có thể bị ảnh hưởng.')) {
        try {
            await apiDeleteCategory(categoryId);
            toast.success('Xóa danh mục thành công!');
            fetchCategoriesData();
        } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data || 'Lỗi xóa danh mục.');
            console.error("Error deleting category:", error.response || error);
        }
    }
  };

  if (isLoading) return <div className="p-4 text-center">Đang tải danh mục...</div>;

  return (
    <div className="card shadow-sm">
        <div className="card-header bg-light">
            <h5 className="mb-0"><i className="bi bi-tags me-2"></i> Quản lý Danh mục</h5>
        </div>
        <div className="card-body">
            <form onSubmit={handleSubmitCategory} className="mb-4 p-3 border rounded bg-light-subtle">
                <h6>{editingCategory ? `Sửa danh mục: ${editingCategory.name}` : 'Thêm danh mục mới'}</h6>
                <div className="row g-3 align-items-end">
                    <div className="col-md-5">
                        <label htmlFor="categoryName" className="form-label">Tên danh mục</label>
                        <input type="text" className="form-control form-control-sm" id="categoryName" 
                            value={editingCategory ? editingCategory.name : newCategoryName}
                            onChange={(e) => editingCategory ? setEditingCategory({...editingCategory, name: e.target.value}) : setNewCategoryName(e.target.value)}
                            required />
                    </div>
                    <div className="col-md-5">
                        <label htmlFor="categoryType" className="form-label">Loại (Type)</label>
                        <input type="text" className="form-control form-control-sm" id="categoryType"
                            value={editingCategory ? editingCategory.type : newCategoryType}
                            onChange={(e) => editingCategory ? setEditingCategory({...editingCategory, type: e.target.value}) : setNewCategoryType(e.target.value)}
                            required/>
                    </div>
                    <div className="col-md-2">
                        <button type="submit" className="btn btn-primary btn-sm w-100">
                            {editingCategory ? <><i className="bi bi-save me-1"></i> Lưu</> : <><i className="bi bi-plus-circle me-1"></i> Thêm</>}
                        </button>
                        {editingCategory && (
                            <button type="button" className="btn btn-secondary btn-sm w-100 mt-2" onClick={() => setEditingCategory(null)}>Hủy</button>
                        )}
                    </div>
                </div>
            </form>

            {categories.length === 0 ? (
                <div className="empty-state p-4 text-center">
                    <i className="bi bi-tags-fill display-4 text-muted"></i>
                    <p className="mt-3">Chưa có danh mục nào.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover admin-table align-middle">
                        <thead className="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Tên danh mục</th>
                            <th>Loại</th>
                            <th className="text-center">Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        {categories.map(cat => (
                            <tr key={cat.categoryId}>
                            <td>{cat.categoryId}</td>
                            <td>{cat.name}</td>
                            <td>{cat.type}</td>
                            <td className="text-center">
                                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => setEditingCategory({...cat})} title="Sửa">
                                    <i className="bi bi-pencil-square"></i>
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteCategory(cat.categoryId)} title="Xóa">
                                    <i className="bi bi-trash"></i>
                                </button>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
  );
}

// Sub-component: Quản lý Huy hiệu
function BadgesView() {
  const [badges, setBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newBadgeName, setNewBadgeName] = useState('');
  const [newBadgeDescription, setNewBadgeDescription] = useState('');

  const fetchBadgesData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAllBadges();
      const data = response.data?.$values || response.data || [];
      setBadges(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Không thể tải danh sách huy hiệu.');
      console.error("Error fetching badges:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBadgesData();
  }, [fetchBadgesData]);

  const handleCreateBadge = async (e) => {
    e.preventDefault();
    if (!newBadgeName.trim()) {
      toast.warn('Vui lòng nhập tên huy hiệu.');
      return;
    }
    try {
      await apiCreateBadge({ name: newBadgeName, description: newBadgeDescription });
      toast.success('Tạo huy hiệu thành công!');
      setNewBadgeName('');
      setNewBadgeDescription('');
      fetchBadgesData();
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data || 'Lỗi tạo huy hiệu.');
      console.error("Error creating badge:", error.response || error);
    }
  };

  if (isLoading) return <div className="p-4 text-center">Đang tải huy hiệu...</div>;

  return (
    <div className="card shadow-sm">
        <div className="card-header bg-light">
            <h5 className="mb-0"><i className="bi bi-award me-2"></i> Quản lý Huy hiệu</h5>
        </div>
        <div className="card-body">
            <form onSubmit={handleCreateBadge} className="mb-4 p-3 border rounded bg-light-subtle">
                <h6>Thêm huy hiệu mới</h6>
                <div className="row g-3 align-items-end">
                    <div className="col-md-4">
                        <label htmlFor="badgeName" className="form-label">Tên huy hiệu</label>
                        <input type="text" className="form-control form-control-sm" id="badgeName" 
                            value={newBadgeName}
                            onChange={(e) => setNewBadgeName(e.target.value)}
                            required />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="badgeDescription" className="form-label">Mô tả</label>
                        <input type="text" className="form-control form-control-sm" id="badgeDescription"
                            value={newBadgeDescription}
                            onChange={(e) => setNewBadgeDescription(e.target.value)}
                            />
                    </div>
                    <div className="col-md-2">
                        <button type="submit" className="btn btn-primary btn-sm w-100">
                            <i className="bi bi-plus-circle me-1"></i> Thêm
                        </button>
                    </div>
                </div>
            </form>

            {badges.length === 0 ? (
                <div className="empty-state p-4 text-center">
                    <i className="bi bi-award-fill display-4 text-muted"></i>
                    <p className="mt-3">Chưa có huy hiệu nào.</p>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover admin-table align-middle">
                        <thead className="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Tên huy hiệu</th>
                            <th>Mô tả</th>
                        </tr>
                        </thead>
                        <tbody>
                        {badges.map(badge => (
                            <tr key={badge.badgeId}>
                            <td>{badge.badgeId}</td>
                            <td>{badge.name}</td>
                            <td>{badge.description}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
  );
}

// Component chính của AdminDashboard, giờ đóng vai trò là Layout
function AdminDashboard() {
  const { user, loadingAuth } = useContext(AuthContext);
  const [pendingDocs, setPendingDocs] = useState(null); 
  const [users, setUsers] = useState(null);             
  const navigate = useNavigate();
  const location = useLocation();

  const fetchAdminPageData = useCallback(async () => {
    if (!user || !user.isAdmin || loadingAuth) return;
    try {
      if (pendingDocs === null) { 
        const pendingDocsRes = await getPendingDocuments();
        let data = pendingDocsRes.data;
        if (Array.isArray(data?.$values)) { data = data.$values; }
        else if (!Array.isArray(data)) { data = []; }
        setPendingDocs(data);
      }
      if (users === null) { 
        const usersRes = await getAllUsers();
        let data = usersRes.data;
        if (Array.isArray(data?.$values)) { data = data.$values; }
        else if (!Array.isArray(data)) { data = []; }
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching initial admin data:', error);
      toast.error('Không thể tải một số dữ liệu quản trị.');
    }
  }, [user, loadingAuth, pendingDocs, users]); 

  useEffect(() => {
    if (loadingAuth) {
      return; 
    }
    if (!user || !user.isAdmin) {
      toast.warn('Bạn không có quyền truy cập trang này.');
      navigate('/', { replace: true });
      return;
    }
    fetchAdminPageData();
  }, [navigate, user, loadingAuth, fetchAdminPageData]); 

  const handleApprove = async (id) => {
    try {
      await approveDocument(id);
      toast.success('Tài liệu đã được duyệt.');
      const response = await getPendingDocuments();
      let data = response.data;
      if (Array.isArray(data?.$values)) { data = data.$values; }
      else if (!Array.isArray(data)) { data = []; }
      setPendingDocs(data);
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Duyệt tài liệu thất bại.');
    }
  };

  if (loadingAuth || (user && user.isAdmin && (pendingDocs === null || users === null) && location.pathname.startsWith('/admin'))) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "calc(100vh - 56px)", marginTop: "56px" }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }
  
  if (!user || !user.isAdmin) {
    return null; 
  }

  return (
    <div className="container-fluid admin-dashboard-container mt-0">
      <div className="row">
        <nav id="sidebarMenu" className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
          <div className="position-sticky pt-3 sidebar-sticky">
            <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-2 mb-1 text-muted text-uppercase">
              <span>Quản lý</span>
            </h6>
            <ul className="nav flex-column">
              <li className="nav-item">
                <Link className={`nav-link ${(location.pathname === '/admin' || location.pathname === '/admin/pending-documents') ? 'active' : ''}`} to="pending-documents">
                  <i className="bi bi-file-earmark-check me-2"></i>
                  Tài liệu chờ
                  {pendingDocs && pendingDocs.length > 0 && <span className="badge bg-danger rounded-pill ms-auto">{pendingDocs.length}</span>}
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`} to="users">
                  <i className="bi bi-people me-2"></i>
                  Người dùng
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/admin/categories' ? 'active' : ''}`} to="categories">
                  <i className="bi bi-tags me-2"></i>
                  Danh mục
                </Link>
              </li>
              <li className="nav-item">
                <Link className={`nav-link ${location.pathname === '/admin/badges' ? 'active' : ''}`} to="badges">
                  <i className="bi bi-award me-2"></i>
                  Huy hiệu
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 admin-main-content">
          <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
            <h1 className="h2">Bảng điều khiển Quản trị</h1>
          </div>
          
          <Outlet context={{ pendingDocs, users, handleApprove }} /> {/* Pass context to child routes */}
        </main>
      </div>
    </div>
  );
}

// Export AdminDashboard as AdminLayout for use in App.jsx
// AND export the individual view components
export { 
    AdminDashboard as AdminLayout, 
    PendingDocumentsView, 
    UsersView, 
    CategoriesView, 
    BadgesView 
};
