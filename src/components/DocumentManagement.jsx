import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteDocument, lockDocument, getAdminDocuments, getCategories } from '../services/api';
import { toast } from 'react-toastify';
import useOnScreen from '../hooks/useOnScreen';
import '../styles/components/DocumentManagement.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock,
  faLockOpen,
  faTrash,
  faFileCircleXmark,
  faMagnifyingGlass,
  faFilter,
  faTimes,
  faRotateRight
} from '@fortawesome/free-solid-svg-icons';

function DocumentManagement() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLock, setFilterLock] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // --- STATE MỚI CHO BỘ LỌC ---
  const [showFilters, setShowFilters] = useState(false); 
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Không thể tải danh sách danh mục.');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterCategory, filterStatus, filterLock, sortBy]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize: 15,
        keyword: searchTerm,
        categoryId: filterCategory || undefined,
        status: filterStatus || undefined,
        isLocked: filterLock === '' ? undefined : (filterLock === 'true'),
        sortBy: sortBy
      };
      const response = await getAdminDocuments(params);
      setDocuments(Array.isArray(response.data.data) ? response.data.data : []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Không thể tải danh sách tài liệu.');
      setDocuments([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM RESET BỘ LỌC ---
  const handleResetFilters = () => {
    setFilterCategory('');
    setFilterStatus('');
    setFilterLock('');
    setSortBy('newest');
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      try {
        await deleteDocument(id);
        toast.success('Xóa tài liệu thành công!');
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Không thể xóa tài liệu.');
      }
    }
  };

  const handleLockUnlock = async (id, currentStatus) => {
    const isLockingAction = currentStatus !== 'Suspended';
    const actionText = isLockingAction ? 'khóa' : 'mở khóa';

    try {
      await lockDocument(id, isLockingAction);
      toast.success(`Tài liệu đã được ${actionText} thành công!`);
      fetchDocuments();
    } catch (error) {
      console.error(`Error ${actionText} document:`, error);
      toast.error(`Không thể ${actionText} tài liệu.`);
    }
  };

  const DocumentRow = ({ doc }) => {
    const rowRef = useRef(null);
    const isVisible = useOnScreen(rowRef);

    const isSuspended = doc.approvalStatus === 'Suspended';
    const buttonText = isSuspended ? 'Mở khóa' : 'Khóa';
    const buttonIcon = isSuspended ? faLockOpen : faLock;
    const buttonClass = isSuspended ? 'unlock-button' : 'lock-button';

    return (
      <tr ref={rowRef} className={`fade-in ${isVisible ? 'visible' : ''}`}>
        <td>
          <button
            type="button"
            className="link-like-btn document-title-btn title-clamp"
            onClick={() => navigate(`/document/${doc.documentId}`)}
            title="Xem chi tiết tài liệu"
          >
            <span className="title-text">{doc.title}</span>
          </button>
        </td>
        <td>{doc.email || 'Không xác định'}</td>
        <td className="download-count">{doc.downloadCount}</td>
        <td className="download-count">{doc.uniqueDownloadCount ?? 0}</td>
        <td>
          <div className="status-container">
            <span className={`status-badge status-${doc.approvalStatus?.toLowerCase()}`}>
              {{
                  'Approved': 'Đã duyệt',
                  'SemiApproved': 'Chưa kiểm duyệt',
                  'Pending': 'Đang chờ',
                  'Rejected': 'Bị từ chối',
                  'Suspended': 'Bị tạm ngưng'
                }[doc.approvalStatus] || 'Không xác định'
              }
            </span>
          </div>
        </td>
        <td>
          <div className="action-container">
            <button
              className={`action-button ${buttonClass} margin-right-sm`}
              onClick={() => handleLockUnlock(doc.documentId, doc.approvalStatus)}
            >
              <FontAwesomeIcon icon={buttonIcon} className="icon-margin-right-sm" />
              {buttonText}
            </button>

            <button
              className="action-button delete-button"
              onClick={() => handleDelete(doc.documentId)}
            >
              <FontAwesomeIcon icon={faTrash} className="icon-margin-right-sm" /> Xóa
            </button>
          </div>
        </td>
      </tr>
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, searchTerm, filterCategory, filterStatus, filterLock, sortBy]);

  return (
    <div className="admin-section">
      <div className="admin-filter-bar">
        {/* === HÀNG 1: TÌM KIẾM + NÚT BỘ LỌC === */}
        <div className="filter-top-row">
          <div className="search-wrapper">
            <div className="search-group">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="icon-search" />
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm tài liệu theo tên..."
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

        {/* === HÀNG 2: CÁC SELECT (COLLAPSIBLE) === */}
        <div className={`filter-options-container ${showFilters ? 'open' : ''}`}>
          <div className="filter-grid">
            <div className="filter-item">
              <label>Danh mục</label>
              <select
                className="select-filter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {categories.length > 0
                  ? categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                  ))
                  : <option disabled>Đang tải danh mục...</option>}
              </select>
            </div>

            <div className="filter-item">
              <label>Trạng thái duyệt</label>
              <select
                className="select-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Pending">Đang chờ</option>
                <option value="SemiApproved">Chưa kiểm duyệt</option>
                <option value="Approved">Đã duyệt</option>
                <option value="Rejected">Bị từ chối</option>
                <option value="Suspended">Bị tạm ngưng</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Tình trạng khóa</label>
              <select
                className="select-filter"
                value={filterLock}
                onChange={(e) => setFilterLock(e.target.value)}
              >
                <option value="">Tất cả</option>
                <option value="true">Đã khóa</option>
                <option value="false">Chưa khóa</option>
              </select>
            </div>

            <div className="filter-item">
              <label>Sắp xếp</label>
              <select
                className="select-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="downloads_desc">Lượt tải cao → thấp</option>
                <option value="downloads_asc">Lượt tải thấp → cao</option>
              </select>
            </div>

            {/* Nút Reset nằm trong grid */}
            <div className="filter-item filter-actions">
               <label className="invisible-label">Tác vụ</label>
               <button className="reset-filter-btn" onClick={handleResetFilters}>
                 <FontAwesomeIcon icon={faRotateRight} /> Mặc định
               </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Đang tải tài liệu...</p>
        </div>
      ) : documents.length > 0 ? (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Người đăng</th>
                <th>Lượt tải</th>
                <th>Lượt tải thực tế</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <DocumentRow key={doc.documentId} doc={doc} />
              ))}
            </tbody>
          </table>
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
          <FontAwesomeIcon icon={faFileCircleXmark} className="empty-icon" />
          <p>Không có tài liệu nào để hiển thị.</p>
        </div>
      )}
    </div>
  );
}

export default DocumentManagement;
