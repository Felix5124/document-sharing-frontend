import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { getAllUsers, lockUser } from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

function AccountManagement() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [navigate, user]);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      let data = response.data;
      if (Array.isArray(data.$values)) {
        data = data.$values;
      }
      setUsers(data);
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng.', { toastId: 'users-error' });
    }
  };

  const handleLockUnlock = async (userId, isLocked) => {
    try {
      const newLockedStatus = !isLocked;
      await lockUser(userId, newLockedStatus);
      toast.success(newLockedStatus ? 'Khóa tài khoản thành công.' : 'Mở khóa tài khoản thành công.');
      fetchUsers();
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Không thể ${newLockedStatus ? 'khóa' : 'mở khóa'} tài khoản.`;
      toast.error(errorMessage);
      console.error('Lock/Unlock error:', error);
    }
  };

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
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
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.userId}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.isLocked ? 'Đã khóa' : 'Hoạt động'}</td>
                  <td>
                    <button
                      className={`action-button ${user.isLocked ? 'unlock-button' : 'lock-button'}`}
                      onClick={() => handleLockUnlock(user.userId, user.isLocked)}
                    >
                      <i className={`bi ${user.isLocked ? 'bi-unlock' : 'bi-lock'} me-2`}></i>
                      {user.isLocked ? 'Mở khóa' : 'Khóa'}
                    </button>
                  </td>
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
  );
}

export default AccountManagement;