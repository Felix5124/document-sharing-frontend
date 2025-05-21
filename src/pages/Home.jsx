import { useState, useEffect } from 'react';
import { searchDocuments, getCategories, getTopCommenter, getTopPointsUser, getTopDownloadedDocument } from '../services/api';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';
import bannerImage from '../assets/images/anhbg.jpg';
import api from '../services/api';

function Home() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const documentsPerPage = 6;
  const navigate = useNavigate();

  // State cho Bảng xếp hạng
  const [topCommenter, setTopCommenter] = useState(null);
  const [topPointsUser, setTopPointsUser] = useState(null);
  const [topDownloadedDoc, setTopDownloadedDoc] = useState(null);

  const getFullImageUrl = (relativePath) => {
    if (!relativePath || typeof relativePath !== 'string') {
      return `${api.defaults.baseURL.replace('/api', '')}/ImageCovers/cat.jpg`;
    }
    return `${api.defaults.baseURL.replace('/api', '')}/${relativePath}`;
  };


  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...');
      const response = await getCategories();
      console.log('Categories response:', response);
      let data = response.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Không thể tải danh mục.');
      setCategories([]);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {
        Keyword: searchTerm,
        CategoryId: selectedCategory ? parseInt(selectedCategory) : 0,
        Page: currentPage,
        PageSize: documentsPerPage,
      };
      console.log('Fetching documents with params:', params);
      const response = await searchDocuments(params);
      console.log('Documents response:', response);

      const { documents, total } = response.data;
      if (Array.isArray(documents)) {
        // Lọc tài liệu: chỉ hiển thị các tài liệu đã được duyệt (isApproved = true) và không bị khóa (isLock = false)
        const approvedDocuments = documents.filter((doc) => doc.isApproved === true && doc.isLock === false);
        setDocuments(approvedDocuments);
        setTotalPages(Math.ceil(total / documentsPerPage));
      } else {
        console.warn('API data is not an array:', documents);
        setDocuments([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Không thể tải tài liệu.');
      setDocuments([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopContributors = async () => {
    try {
      const commenterResponse = await getTopCommenter();
      setTopCommenter(commenterResponse.data);

      const pointsResponse = await getTopPointsUser();
      setTopPointsUser(pointsResponse.data);

      const docResponse = await getTopDownloadedDocument();
      setTopDownloadedDoc(docResponse.data);
    } catch (error) {
      console.error('Error fetching top contributors:', error);
      toast.error('Không thể tải dữ liệu bảng xếp hạng.');
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [searchTerm, selectedCategory, currentPage]);

  useEffect(() => {
    fetchCategories();
    fetchTopContributors();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Đăng xuất thành công!');
    navigate('/login');
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div>
      <div
        className="banner-section"
        style={{
          width: '100%',
          height: '500px',
          backgroundImage: `url(${bannerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          marginTop: 0,
          padding: 0,
          borderRadius: 0,
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: 'white',
            textAlign: 'center',
            padding: '30px',
          }}
        >
          <h1 style={{ fontSize: '3rem', marginBottom: '15px' }}>
            Chào mừng đến với Thư viện Tài liệu Học tập
          </h1>
          <p style={{ fontSize: '1.5rem' }}>
            Tìm kiếm và khám phá tài liệu học tập dễ dàng!
          </p>
        </div>
      </div>

      {/* Nội dung chính trong container */}
      <div className="home-container">
        <div className="header-section">
          <div className="title-group">
            <h2 className="main-title">Tài liệu học tập</h2>
            <h4 className="sub-title">Danh sách tài liệu</h4>
          </div>
          <div className="d-flex align-items-center">
            <div className="search-wrapper me-3">
              <div className="search-group">
                <i className="bi bi-search search-icon"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tìm kiếm tài liệu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="category-wrapper">
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Tất cả danh mục</option>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                      {category.name}
                    </option>
                  ))
                ) : (
                  <option disabled>Không có danh mục</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Đang tải tài liệu...</p>
          </div>
        ) : documents.length > 0 ? (
          <>
            <div className="documents-grid row row-cols-1 row-cols-md-2 row-cols-lg-1 g-4"> {/* Bootstrap grid */}
              {documents.map((doc) => (
                <div key={doc.documentId} className="col">
                  <div className="document-card card h-100 shadow-sm"> {/* Bootstrap card */}
                    <img
                      src={getFullImageUrl(doc.coverImageUrl)}
                      alt={doc.title || 'Cover'}
                      className="card-img-top"
                      style={{ height: '250px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getFullImageUrl(null); // Fallback to default
                      }}
                    />
                    <div className="card-body d-flex flex-column"> {/* card-body */}
                      <h5 className="card-title text-truncate">{doc.title}</h5>
                      <p className="card-text flex-grow-1" style={{ fontSize: '0.9rem', minHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                        {doc.description ? doc.description : "Không có mô tả."}
                      </p>
                      <div className="card-meta mt-auto text-muted" style={{ fontSize: '0.8rem' }}>
                        <small className="d-block text-truncate">
                          <i className="bi bi-person me-1"></i>
                          Người đăng: {doc.email || 'Không xác định'}
                        </small>
                        <small className="d-block">
                          <i className="bi bi-calendar me-1"></i>
                          Tải lên: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </small>
                        <small className="d-block">
                          <i className="bi bi-download me-1"></i>
                          Lượt tải: {doc.downloadCount}
                        </small>
                      </div>
                      <Link to={`/document/${doc.documentId}`} className="btn btn-primary btn-sm mt-2">
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination-section">
                <button
                  className="prev-button"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <i className="bi bi-arrow-left me-2"></i> Trang trước
                </button>
                <button
                  className="next-button"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <i className="bi bi-arrow-right me-2"></i> Xem tiếp
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <i className="bi bi-folder-x empty-icon"></i>
            <p>Không có tài liệu nào để hiển thị.</p>
          </div>
        )}

        {/* Thay thế <hr /> bằng một div với style đẹp */}
        <div className="custom-divider">
          <span className="divider-text">✨ Khám phá thêm ✨</span>
        </div>

        <div className="title-group">
          <h2 className="main-title">Bảng xếp hạng</h2>
        </div>
        <div className="top-contributors-section">
          <div className="contributor-column">
            <h4 className="column-title">Người đóng góp nhiều nhất</h4>
            {topCommenter ? (
              <div className="contributor-card">
                <i className="bi bi-chat-left-text contributor-icon"></i>
                <p className="contributor-name">{topCommenter.email}</p>
                <p className="contributor-stat">Số bình luận: {topCommenter.commentCount}</p>
              </div>
            ) : (
              <p>Không có dữ liệu</p>
            )}
          </div>
          <div className="contributor-column">
            <h4 className="column-title">Người có nhiều điểm nhất</h4>
            {topPointsUser ? (
              <div className="contributor-card">
                <i className="bi bi-star contributor-icon"></i>
                <p className="contributor-name">{topPointsUser.email}</p>
                <p className="contributor-stat">Điểm: {topPointsUser.points}</p>
              </div>
            ) : (
              <p>Không có dữ liệu</p>
            )}
          </div>
          <div className="contributor-column">
            <h4 className="column-title">Bài viết tải nhiều nhất</h4>
            {topDownloadedDoc ? (
              <div className="contributor-card">
                <i className="bi bi-download contributor-icon"></i>
                <p className="contributor-name">{topDownloadedDoc.title}</p>
                <p className="contributor-stat">Lượt tải: {topDownloadedDoc.downloadCount}</p>
                <Link to={`/document/${topDownloadedDoc.documentId}`} className="view-details-link">
                  Xem chi tiết
                </Link>
              </div>
            ) : (
              <p>Không có dữ liệu</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;