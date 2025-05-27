import { useState, useEffect, useRef } from 'react';
import { searchDocuments, getCategories, getTopCommenter, getTopPointsUser, getTopDownloadedDocument, getSchools } from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import bannerImage from '../assets/images/anhbg.jpg';
import { getFullImageUrl } from '../utils/imageUtils';
import useOnScreen from '../hooks/useOnScreen';

function Home() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [schools, setSchools] = useState([]);
  const documentsPerPage = 6;

  // State cho Bảng xếp hạng
  const [topCommenter, setTopCommenter] = useState(null);
  const [topPointsUser, setTopPointsUser] = useState(null);
  const [topDownloadedDoc, setTopDownloadedDoc] = useState(null);

  // Ref cho banner để thêm hiệu ứng parallax
  const bannerRef = useRef(null);

  const fetchSchools = async () => {
    try {
      const response = await getSchools();
      let data = response.data || [];
      if (Array.isArray(data)) {
        setSchools(data.slice(0, 4)); // Giới hạn 4 trường
      } else {
        setSchools([]);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách trường học.');
      setSchools([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      let data = response.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
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
      const response = await searchDocuments(params);
      const { documents, total } = response.data;
      if (Array.isArray(documents)) {
        const approvedDocuments = documents.filter((doc) => doc.isApproved === true && doc.isLock === false);
        setDocuments(approvedDocuments);
        setTotalPages(Math.ceil(total / documentsPerPage));
      } else {
        setDocuments([]);
        setTotalPages(1);
      }
    } catch (error) {
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
      let commenterData = commenterResponse.data;
      if (commenterData && Object.prototype.hasOwnProperty.call(commenterData, '$value')) {
        commenterData = commenterData.$value;
      } else if (commenterData && Array.isArray(commenterData.$values)) {
        commenterData = commenterData.$values.length > 0 ? commenterData.$values[0] : null;
      }
      setTopCommenter(commenterData);

      const pointsResponse = await getTopPointsUser();
      let pointsData = pointsResponse.data;
      if (pointsData && pointsData.hasOwnProperty('$value')) {
        pointsData = pointsData.$value;
      } else if (pointsData && Array.isArray(pointsData.$values)) {
        pointsData = pointsData.$values.length > 0 ? pointsData.$values[0] : null;
      }
      setTopPointsUser(pointsData);

      const docResponse = await getTopDownloadedDocument();
      let docData = docResponse.data;
      if (docData && Array.isArray(docData.$values) && docData.$values) {
        docData = docData.$values.length > 0 ? docData.$values[0] : null;
      } else if (docData && Object.prototype.hasOwnProperty.call(docData, '$value')) {
        docData = docData.$value;
      }
      setTopDownloadedDoc(docData);
    } catch (error) {
      if (error.config.url.includes('top-commenter')) toast.error('Không thể tải top người bình luận.');
      else if (error.config.url.includes('top-points')) toast.error('Không thể tải top người dùng điểm cao.');
      else if (error.config.url.includes('top-downloaded')) toast.error('Không thể tải tài liệu tải nhiều nhất.');
      else toast.error('Không thể tải dữ liệu bảng xếp hạng.');
    }
  };

  // Hiệu ứng parallax cho banner
  useEffect(() => {
    const handleScroll = () => {
      if (bannerRef.current) {
        if (window.scrollY > 100) {
          bannerRef.current.classList.add('scrolled');
        } else {
          bannerRef.current.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [searchTerm, selectedCategory, currentPage]);

  useEffect(() => {
    fetchCategories();
    fetchSchools();
    fetchTopContributors();
  }, []);

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

  // Component cho Document Card
  const DocumentCard = ({ doc }) => {
    const cardRef = useRef(null);
    const isVisible = useOnScreen(cardRef);

    return (
      <div ref={cardRef} className={`col fade-in ${isVisible ? 'visible' : ''}`}>
        <div className="document-card card h-100 shadow-sm">
          <div style={{ position: 'relative' }}>
            <img
              src={getFullImageUrl(doc.coverImageUrl)}
              alt={doc.title || 'Cover'}
              className="card-img-top"
              style={{ height: '250px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getFullImageUrl(null);
              }}
            />
            {doc.school?.logoUrl && (
              <img
                src={`https://localhost:7013/${doc.school.logoUrl}`}
                alt={doc.school.name || 'School Logo'}
                className="school-logo"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid white',
                  backgroundColor: 'white',
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-school-logo.png';
                }}
              />
            )}
          </div>
          <div className="card-body d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="card-title text-truncate mb-0" style={{ flex: '1' }}>
                {doc.title}
              </h5>
              <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                <i className="bi bi-download me-1"></i>
                Lượt tải: {doc.downloadCount}
              </small>
            </div>
            <p
              className="card-text flex-grow-1"
              style={{
                fontSize: '0.9rem',
                minHeight: '40px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {doc.description ? doc.description : "Không có mô tả."}
            </p>
            <div className="card-meta mt-auto text-muted" style={{ fontSize: '0.8rem' }}>
              <small
                className="d-block mb-2"
                style={{ overflow: 'visible', whiteSpace: 'normal', width: '100%' }}
              >
                <i className="bi bi-person me-1"></i>
                Người đăng: {doc.email || 'Không xác định'}
              </small>
              <small className="d-block">
                <i className="bi bi-calendar me-1"></i>
                Tải lên: {new Date(doc.uploadedAt).toLocaleDateString()}
              </small>
            </div>
            <Link to={`/document/${doc.documentId}`} className="btn btn-primary btn-sm mt-3">
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Component cho Contributor Column
  const ContributorColumn = ({ title, data, icon, statLabel, statValue, linkTo }) => {
    const columnRef = useRef(null);
    const isVisible = useOnScreen(columnRef);

    return (
      <div ref={columnRef} className={`contributor-column fade-in ${isVisible ? 'visible' : ''}`}>
        <h4 className="column-title">{title}</h4>
        {data ? (
          <div className="contributor-card">
            {icon && <i className={`bi ${icon} contributor-icon`}></i>}
            {linkTo ? (
              <>
                <img
                  src={getFullImageUrl(data.coverImageUrl)}
                  alt={data.title || 'Document cover'}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getFullImageUrl(null);
                  }}
                />
                <h5
                  className="contributor-name mt-2"
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {data.title}
                </h5>
                <p className="contributor-stat mb-2">
                  <i className="bi bi-download me-1"></i>
                  {statLabel}: {statValue}
                </p>
                <Link to={linkTo} className="btn btn-sm btn-outline-primary w-100">
                  Xem chi tiết
                </Link>
              </>
            ) : (
              <>
                <p className="contributor-name">{data.email}</p>
                <p className="contributor-stat">{statLabel}: {statValue}</p>
              </>
            )}
          </div>
        ) : (
          <p>Không có dữ liệu</p>
        )}
      </div>
    );
  };

  // Component cho trường học
  const SchoolCard = ({ school }) => {
    const cardRef = useRef(null);
    const isVisible = useOnScreen(cardRef);

    return (
      <div ref={cardRef} className={`col fade-in ${isVisible ? 'visible' : ''}`}>
        <div className="school-card card h-100 shadow-sm">
          <img
            src={`https://localhost:7013/${school.logoUrl}`}
            alt={school.name || 'School Logo'}
            className="card-img-top"
            style={{ height: '200px', objectFit: 'contain', padding: '20px', backgroundColor: '#f8f9fa' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-school-logo.png';
            }}
          />
          <div className="card-body d-flex flex-column">
            <h5 className="card-title text-truncate">{school.name}</h5>
            <p
              className="card-text flex-grow-1"
              style={{
                fontSize: '0.9rem',
                minHeight: '60px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              <span className="text-muted">
                <i className="bi bi-people me-1"></i> Sinh viên: {school.userCount || 0}
              </span>
              <br />
              <span className="text-muted">
                <i className="bi bi-file-earmark-text me-1"></i> Bài đăng: {school.documentCount || 0}
              </span>
            </p>
            <a
              href={school.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm mt-2"
            >
              Xem trang web
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div
        ref={bannerRef}
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
          className="banner-content"
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

      <div className="home-container">
        <div className="container">
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
              <div className="documents-grid row row-cols-1 row-cols-md-2 row-cols-lg-1 g-4">
                {documents.map((doc) => (
                  <DocumentCard key={doc.documentId} doc={doc} />
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

          <div className="custom-divider">
            <span className="divider-text">✨ Người sử dụng ✨</span>
          </div>

          <div className="title-group">
            <h2 className="main-title">Các sinh viên trường đại học</h2>
            <h4 className="sub-title">Khám phá các trường đại học với số lượng sinh viên tham gia</h4>
          </div>

          {schools.length > 0 ? (
            <div className="schools-grid row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
              {schools.map((school) => (
                <SchoolCard key={school.schoolId} school={school} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <i className="bi bi-building empty-icon"></i>
              <p>Không có trường đại học nào để hiển thị.</p>
            </div>
          )}

          <div className="custom-divider">
            <span className="divider-text">✨ Khám phá thêm ✨</span>
          </div>

          <div className="title-group">
            <h2 className="main-title">Bảng xếp hạng</h2>
          </div>
          <div className="top-contributors-section">
            <ContributorColumn
              title="Người đóng góp nhiều nhất"
              data={topCommenter}
              icon="bi-chat-left-text"
              statLabel="Số bình luận"
              statValue={topCommenter?.commentCount}
            />
            <ContributorColumn
              title="Người có nhiều điểm nhất"
              data={topPointsUser}
              icon="bi-star"
              statLabel="Điểm"
              statValue={topPointsUser?.points}
            />
            <ContributorColumn
              title="Bài viết tải nhiều nhất"
              data={topDownloadedDoc}
              statLabel="Lượt tải"
              statValue={topDownloadedDoc?.downloadCount}
              linkTo={topDownloadedDoc ? `/document/${topDownloadedDoc.documentId}` : null}
            />
          </div>
          <div className="text-center mt-0 mb-5">
            <Link to="/rankings" className="btn btn-primary btn-lg shadow">
              <i className="bi bi-bar-chart-steps me-2"></i> Xem Tất Cả Bảng Xếp Hạng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;