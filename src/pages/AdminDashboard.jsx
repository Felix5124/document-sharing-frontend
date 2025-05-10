import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { getPendingDocuments, approveDocument, getAllUsers } from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.checkAdmin) {
      navigate('/');
      return;
    }

    fetchPendingDocs();
    fetchUsers();
  }, [navigate, user]);

  const fetchPendingDocs = async () => {
    try {
      const response = await getPendingDocuments();
      let data = response.data;
      if (Array.isArray(data.$values)) {
        data = data.$values;
      }
      setPendingDocs(data);
    } catch (error) {
      toast.error('Không thể tải tài liệu chờ duyệt.');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      let data = response.data;
      if (Array.isArray(data.$values)) {
        data = data.$values;
      }
      setUsers(data);
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng.');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveDocument(id);
      toast.success('Tài liệu đã được duyệt.');
      fetchPendingDocs();
    } catch (error) {
      toast.error('Duyệt tài liệu thất bại.');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công!');
    navigate('/login');
  };

  if (!user || !user.checkAdmin) {
    return null; // Không hiển thị gì nếu không phải admin
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2 className="admin-title">
          <i className="bi bi-gear me-2"></i> Bảng điều khiển quản trị
        </h2>
      </div>

      <div className="admin-section">
        <h4 className="section-title">
          <i className="bi bi-file-earmark-check me-2"></i> Tài liệu chờ duyệt
        </h4>
        {pendingDocs.length > 0 ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Mô tả</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pendingDocs.map((doc) => (
                  <tr key={doc.documentId}>
                    <td>{doc.title}</td>
                    <td>{doc.description}</td>
                    <td>
                      <button
                        className="action-button approve-button"
                        onClick={() => handleApprove(doc.documentId)}
                      >
                        <i className="bi bi-check-circle me-2"></i> Duyệt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <i className="bi bi-folder-x empty-icon"></i>
            <p>Không có tài liệu chờ duyệt.</p>
          </div>
        )}
      </div>

      <div className="admin-section">
        <h4 className="section-title">
          <i className="bi bi-people me-2"></i> Danh sách người dùng
        </h4>
        {users.length > 0 ? (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userId}>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <i className="bi bi-person-x empty-icon"></i>
            <p>Không có người dùng nào để hiển thị.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;