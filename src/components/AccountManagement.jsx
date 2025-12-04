import { useEffect, useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminUsers, lockUser } from '../services/api'; // Thay đổi import: getAllUsers -> getAdminUsers
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import useOnScreen from '../hooks/useOnScreen';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock,
  faLockOpen,
  faUserSlash,
  faMagnifyingGlass, // Icon tìm kiếm
  faFilter,          // Icon bộ lọc
  faTimes,           // Icon đóng
  faRotateRight      // Icon reset
} from '@fortawesome/free-solid-svg-icons';

import '../styles/components/AccountManagement.css';
// Import CSS của DocumentManagement để tái sử dụng style cho thanh Filter/Pagination
import '../styles/components/DocumentManagement.css'; 

function AccountManagement() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- State dữ liệu & phân trang ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // --- State bộ lọc ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState(''); 
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Kiểm tra quyền Admin
  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
  }, [navigate, user]);

  // Reset về trang 1 khi thay đổi bộ lọc
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  // Fetch dữ liệu (có debounce cho search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, searchTerm, filterRole, filterStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize: 10, // Số lượng user mỗi trang
        keyword: searchTerm,
        role: filterRole || undefined,
        isLocked: filterStatus === '' ? undefined : (filterStatus === 'true')
      };

      const response = await getAdminUsers(params);
      const resData = response.data;
      
      // Backend trả về { data: [...], totalPages: ... }
      // Chú ý: Đảm bảo backend trả về đúng cấu trúc này
      setUsers(Array.isArray(resData.data) ? resData.data : []);
      setTotalPages(resData.totalPages || 1);

    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Không thể tải danh sách người dùng.', { toastId: 'users-error' });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLockUnlock = async (userId, isLocked) => {
    const newLockedStatus = !isLocked;
    try {
      await lockUser(userId, newLockedStatus);
      toast.success(newLockedStatus ? 'Khóa tài khoản thành công.' : 'Mở khóa tài khoản thành công.');
      fetchUsers(); // Tải lại dữ liệu trang hiện tại
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Không thể ${newLockedStatus ? 'khóa' : 'mở khóa'} tài khoản.`;
      toast.error(errorMessage);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterRole('');
    setFilterStatus('');
    setPage(1);
  };

  // Component UserRow (Giữ nguyên cấu trúc hiển thị cũ)
  const UserRow = ({ userItem }) => {
    const rowRef = useRef(null);
    const isVisible = useOnScreen(rowRef);

    return (
      <tr ref={rowRef} className={`fade-in ${isVisible ? 'visible' : ''}`}>
        {/* Cột Họ tên */}
        <td>
            {userItem.fullName} 
            {/* Hiển thị nhỏ role bên cạnh tên nếu muốn, không thì bỏ qua */}
            {userItem.isAdmin && <span style={{color: 'red', fontSize: '0.7em', marginLeft: '5px'}}>(Admin)</span>}
            {userItem.isVip && <span style={{color: '#d97706', fontSize: '0.7em', marginLeft: '5px'}}>(VIP)</span>}
        </td>
        
        {/* Cột Email */}
        <td>{userItem.email}</td>
        
        {/* Cột Trạng thái */}
        <td>
          <span className={`status-badge ${userItem.isLocked ? 'locked' : 'active'}`}>
            {userItem.isLocked ? 'Đã khóa' : 'Hoạt động'}
          </span>
        </td>

        {/* Cột Hành động */}
        <td>
          <div className='btn-center'>
            {/* Ngăn chặn tự khóa chính mình */}
            {userItem.userId !== user.userId && (
                <button
                className={`action-button ${userItem.isLocked ? 'unlock-button' : 'lock-button'}`}
                onClick={() => handleLockUnlock(userItem.userId, userItem.isLocked)}
                >
                <FontAwesomeIcon
                    icon={userItem.isLocked ? faLockOpen : faLock}
                    className="icon-margin-right"
                />
                {userItem.isLocked ? 'Mở khóa' : 'Khóa'}
                </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="admin-section">
      
      {/* --- KHU VỰC BỘ LỌC & TÌM KIẾM (MỚI) --- */}
      <div className="admin-filter-bar">
        {/* Hàng 1: Tìm kiếm + Toggle Filter */}
        <div className="filter-top-row">
          <div className="search-wrapper">
            <div className="search-group">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="icon-search" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`} 
            onClick={() => setShowFilters(!showFilters)}
          >
            <FontAwesomeIcon icon={showFilters ? faTimes : faFilter} />
            {showFilters ? 'Đóng bộ lọc' : 'Bộ lọc'}
          </button>
        </div>

        {/* Hàng 2: Các Select Options (Ẩn/Hiện) */}
        <div className={`filter-options-container ${showFilters ? 'open' : ''}`}>
          <div className="filter-grid">
            
            {/* Lọc theo Vai trò */}
            <div className="filter-item">
              <label>Vai trò</label>
              <select
                className="select-filter"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">Tất cả vai trò</option>
                <option value="admin">Admin</option>
                <option value="vip">VIP</option>
                <option value="regular">Thường</option>
              </select>
            </div>

            {/* Lọc theo Trạng thái khóa */}
            <div className="filter-item">
              <label>Trạng thái</label>
              <select
                className="select-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="false">Hoạt động</option>
                <option value="true">Đã khóa</option>
              </select>
            </div>

            {/* Nút Reset */}
            <div className="filter-item filter-actions">
               <label className="invisible-label">Tác vụ</label>
               <button className="reset-filter-btn" onClick={handleResetFilters}>
                 <FontAwesomeIcon icon={faRotateRight} /> Mặc định
               </button>
            </div>
          </div>
        </div>
      </div>
      {/* --- KẾT THÚC KHU VỰC BỘ LỌC --- */}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Đang tải danh sách người dùng...</p>
        </div>
      ) : users.length > 0 ? (
        <div className="admin-table-wrapper">
          {/* --- BẢNG DỮ LIỆU (CẤU TRÚC CŨ) --- */}
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
              {users.map((userItem) => (
                <UserRow key={userItem.userId} userItem={userItem} />
              ))}
            </tbody>
          </table>

          {/* --- PHÂN TRANG (MỚI) --- */}
          <div className="pagination-section">
            <button
              className="btn-page"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              ‹ Trang trước
            </button>

            <span className="pagination-info">Trang {page} / {totalPages}</span>

            <button
              className="btn-page"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Trang tiếp ›
            </button>
          </div>

        </div>
      ) : (
        <div className="empty-state">
          <FontAwesomeIcon icon={faUserSlash} className="empty-icon" />
          <p>Không tìm thấy người dùng nào phù hợp.</p>
        </div>
      )}
    </div>
  );
}

export default AccountManagement;