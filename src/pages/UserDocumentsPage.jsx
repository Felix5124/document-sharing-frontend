import { useState, useEffect, useContext } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { searchUserUploads, searchUserDownloads, getCategories, getUser } from '../services/api';
import { getFullImageUrl } from '../utils/imageUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter, faRotateRight,
  faCloudUploadAlt, faCloudDownloadAlt, faDownload, faCalendarDays, faUser, faStar, faFileCircleXmark
} from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import '../styles/pages/UserDocumentsPage.css';

function UserDocumentsPage() {
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useContext(AuthContext); // Lấy user đang đăng nhập
  
  // Kiểm tra xem người xem có phải là chủ sở hữu không
  const isOwner = currentUser && String(currentUser.userId) === String(userId);

  // Lấy tab từ URL, mặc định là 'uploads'
  // Nếu không phải owner mà cố tình truy cập tab downloads thì ép về uploads
  const urlTab = searchParams.get('tab');
  const initialTab = (urlTab === 'downloads' && isOwner) ? 'downloads' : 'uploads';
  
  const [activeTab, setActiveTab] = useState(initialTab);

  // Data states
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [targetUser, setTargetUser] = useState(null); // Lưu thông tin người dùng đang xem
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Sync state with URL param if it changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      if (tabParam === 'downloads' && !isOwner) {
        // Nếu không phải chủ mà đòi xem downloads -> chuyển về uploads
        setActiveTab('uploads');
        setSearchParams({ tab: 'uploads' });
      } else if (tabParam === 'uploads' || tabParam === 'downloads') {
        setActiveTab(tabParam);
      }
    }
  }, [searchParams, isOwner, setSearchParams]);

  // Load Categories & Target User Info once
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Lấy danh mục
        const catRes = await getCategories();
        const catData = catRes.data?.$values || catRes.data || [];
        setCategories(catData);

        // Lấy thông tin người dùng của trang này (để hiển thị tên)
        const userRes = await getUser(userId);
        setTargetUser(userRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitialData();
  }, [userId]);

  // Fetch Data when filters change
  useEffect(() => {
    fetchDocuments();
  }, [activeTab, page, categoryId, sortBy, userId]); // keyword handled via debounce

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchDocuments();
      else setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {
        userId,
        page,
        pageSize: 9, // Hiển thị 9 tài liệu mỗi trang (3x3 grid)
        keyword,
        categoryId: categoryId || undefined,
        sortBy
      };

      let response;
      // Chỉ cho phép gọi API downloads nếu là chủ sở hữu
      if (activeTab === 'downloads' && isOwner) {
        response = await searchUserDownloads(params);
      } else {
        // Mặc định là uploads
        response = await searchUserUploads(params);
      }

      const { data, total, totalPages: pages } = response.data;
      setDocuments(data || []);
      setTotalCount(total);
      setTotalPages(pages);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải dữ liệu tài liệu.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setKeyword('');
    setCategoryId('');
    setSortBy('newest');
    setSearchParams({ tab }); // Update URL
  };

  const handleResetFilters = () => {
    setKeyword('');
    setCategoryId('');
    setSortBy('newest');
    setPage(1);
  };

  // Tạo tiêu đề động
  const getPageTitle = () => {
    if (isOwner) {
      return "Thư viện cá nhân của bạn";
    }
    if (targetUser) {
      return `Thư viện tài liệu của ${targetUser.fullName || targetUser.email}`;
    }
    return "Thư viện tài liệu";
  };

  // Tạo danh sách số trang để hiển thị
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // Số trang tối đa hiển thị
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Điều chỉnh nếu không đủ trang
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="all-container">
      <div className="all-container-card user-docs-page">
        <h2 className="upload-title">
          {/* Thay đổi icon tùy theo là chủ sở hữu hay người xem */}
          <FontAwesomeIcon icon={faUser} className="icon-margin-right" />
          {getPageTitle()}
        </h2>

        {/* --- TABS --- */}
        <div className="docs-tabs">
          <button
            className={`docs-tab ${activeTab === 'uploads' ? 'active' : ''}`}
            onClick={() => handleTabChange('uploads')}
          >
            <FontAwesomeIcon icon={faCloudUploadAlt} /> Tài liệu đã tải lên
          </button>

          {/* CHỈ HIỂN THỊ TAB DOWNLOADS NẾU LÀ CHỦ SỞ HỮU */}
          {isOwner && (
            <button
              className={`docs-tab ${activeTab === 'downloads' ? 'active' : ''}`}
              onClick={() => handleTabChange('downloads')}
            >
              <FontAwesomeIcon icon={faCloudDownloadAlt} /> Tài liệu đã tải xuống
            </button>
          )}
        </div>

        {/* --- FILTER BAR --- */}
        <div className="docs-filter-bar">
          <div className="filter-top">
            <div className="search-box">
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <button 
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FontAwesomeIcon icon={faFilter} /> Bộ lọc
            </button>
          </div>

          <div className={`filter-options ${showFilters ? 'show' : ''}`}>
            <div className="filter-grid">
              <div className="filter-item">
                <label>Danh mục</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Tất cả</option>
                  {categories.map(c => (
                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <label>Sắp xếp</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="downloads">Lượt tải nhiều nhất</option>
                  <option value="name">Tên A-Z</option>
                </select>
              </div>
              <div className="filter-item action">
                <button className="btn-reset" onClick={handleResetFilters}>
                  <FontAwesomeIcon icon={faRotateRight} /> Đặt lại
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="docs-content">
          <p className="results-count">
            {isOwner && activeTab === 'downloads'
              ? `Bạn đã tải xuống ${totalCount} tài liệu.`
              : `Tìm thấy ${totalCount} tài liệu đã đăng.`}
          </p>
          
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : documents.length > 0 ? (
            <div className="user-docs-grid">
              {documents.map(doc => (
                <Link to={`/document/${doc.documentId}`} className="document-link document-card" key={doc.documentId}>
                  <div className="document-card-image-container">
                    <img
                      src={getFullImageUrl(doc.coverImageUrl)}
                      alt={doc.title}
                      className="document-card-image"
                      onError={(e) => (e.target.src = getFullImageUrl(null))}
                    />
                    
                    {/* VIP Badge */}
                    {(doc.isVipOnly || doc.IsVipOnly) && (
                      <span className="vip-badge" title="Tài liệu Premium">
                        <FontAwesomeIcon icon={faStar} />
                      </span>
                    )}

                    {/* Status Labels (Chỉ hiện ở tab Uploads) */}
                    {activeTab === 'uploads' && (
                      <>
                        {doc.approvalStatus === 'SemiApproved' && (
                          <span className="status-label semi-approved">Chưa kiểm duyệt</span>
                        )}
                        {doc.approvalStatus === 'Approved' && (
                          <span className="status-label approved">Đã kiểm duyệt</span>
                        )}
                        {doc.approvalStatus === 'Pending' && (
                          <span className="status-label pending">Đang chờ duyệt</span>
                        )}
                        {(doc.approvalStatus === 'Rejected' || doc.approvalStatus === 'Suspended') && (
                          <span className="status-label rejected">Bị từ chối/Khóa</span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="document-card-body">
                    <div className="document-card-header">
                      <h5 className="home-document-title" title={doc.title}>
                        {doc.title}
                      </h5>
                      <span className="document-download">
                        <FontAwesomeIcon icon={faDownload} /> {doc.downloadCount}
                      </span>
                    </div>
                    
                    <p className="document-description">
                      {doc.description?.length > 60
                        ? `${doc.description.slice(0, 57)}...`
                        : doc.description || 'Không có mô tả.'}
                    </p>
                    
                    <div className="document-meta">
                      {/* Hiển thị tác giả: Nếu là uploads thì là chính user, nếu downloads thì có thể là người khác */}
                      <div className="meta-author" title={activeTab === 'uploads' ? (targetUser?.fullName || 'Tôi') : 'Người đăng'}>
                        <FontAwesomeIcon icon={faUser} /> {activeTab === 'uploads' ? (targetUser?.fullName || 'Tôi') : 'Người đăng'}
                      </div>
                      <div className="meta-date">
                        <FontAwesomeIcon icon={faCalendarDays} />{' '}
                        {new Date(doc.uploadedAt || doc.addedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FontAwesomeIcon icon={faFileCircleXmark} className="empty-icon" />
              <p>Không tìm thấy tài liệu nào.</p>
            </div>
          )}

          {/* --- PAGINATION --- */}
          {totalPages > 1 && (
            <div className="pagination-wrapper">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="page-btn"
              >
                Trước
              </button>
              
              {/* Hiển thị trang đầu nếu cần */}
              {page > 3 && (
                <>
                  <button
                    onClick={() => setPage(1)}
                    className="page-btn"
                  >
                    1
                  </button>
                  {page > 4 && <span className="pagination-ellipsis">...</span>}
                </>
              )}
              
              {/* Hiển thị các trang số */}
              {getPageNumbers().map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`page-btn ${page === p ? 'active' : ''}`}
                >
                  {p}
                </button>
              ))}
              
              {/* Hiển thị trang cuối nếu cần */}
              {page < totalPages - 2 && (
                <>
                  {page < totalPages - 3 && <span className="pagination-ellipsis">...</span>}
                  <button
                    onClick={() => setPage(totalPages)}
                    className="page-btn"
                  >
                    {totalPages}
                  </button>
                </>
              )}
              
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="page-btn"
              >
                Sau
              </button>
              
              <span className="page-info">Trang {page} / {totalPages}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDocumentsPage;