import { useState, useEffect } from 'react';
import {
  searchDocuments,
  getCategories,
  getTopCommenter,
  getTopPointsUser,
  getTopDownloadedDocument,
  getTopDownloadedDocumentsList,
  getSchools
} from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import bannerImage1 from '../assets/images/anhbg.jpg';
import bannerImage2 from '../assets/images/anhbg2.jpg';
import bannerImage3 from '../assets/images/anhbg3.jpg';
import { getFullImageUrl } from '../utils/imageUtils';
import useOnScreen from '../hooks/useOnScreen';
import { useRef } from 'react';

// Component Banner riêng
function Banner() {
  const bannerRef = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const bannerImages = [bannerImage1, bannerImage2, bannerImage3];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === bannerImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Chuyển mỗi 5 giây

    return () => clearInterval(interval);
  }, [bannerImages.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (bannerRef.current) {
        bannerRef.current.classList.toggle('scrolled', window.scrollY > 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={bannerRef}
      className="banner-section"
      style={{
        width: '100%',
        height: '600px',
        backgroundImage: `url(${bannerImages[currentImageIndex]})`,
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
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          color: 'white',
          textAlign: 'center',
          padding: '30px',
        }}
      >
        <h1 style={{ fontSize: '3.2rem', marginBottom: '15px' }}>
          Chào mừng đến với Thư viện Tài liệu Học tập
        </h1>
        <p style={{ fontSize: '1.6rem' }}>
          Tìm kiếm và khám phá tài liệu học tập dễ dàng!
        </p>
      </div>
    </div>
  );
}

function Home() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [tags, setTags] = useState('');
  const [categories, setCategories] = useState([]);
  const [schools, setSchools] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const documentsPerPage = 6;

  const [topCommenter, setTopCommenter] = useState(null);
  const [topPointsUser, setTopPointsUser] = useState(null);
  const [topDownloadedDoc, setTopDownloadedDoc] = useState(null);
  const [topInterestDocuments, setTopInterestDocuments] = useState([]);
  const [loadingTopInterest, setLoadingTopInterest] = useState(false);

  const fetchSchools = async () => {
    try {
      const response = await getSchools();
      let data = response.data || [];
      if (Array.isArray(data)) {
        setSchools(data);
      } else if (data && Array.isArray(data.$values)) {
        setSchools(data.$values);
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
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (data && Array.isArray(data.$values)) {
        setCategories(data.$values);
      } else {
        setCategories([]);
      }
    } catch (error) {
      toast.error('Không thể tải danh mục.');
      setCategories([]);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const tagArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const params = {
        Keyword: searchTerm || undefined,
        CategoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
        SchoolId: selectedSchool ? parseInt(selectedSchool) : undefined,
        Tags: tagArray.length > 0 ? tagArray : undefined,
        SortBy: 'newest',
        Page: currentPage,
        PageSize: documentsPerPage,
      };

      const response = await searchDocuments(params);
      const responseData = response.data;
      const docs = responseData.documents || [];
      const total = responseData.total || 0;

      if (Array.isArray(docs)) {
        const approvedDocuments = docs.filter((doc) => doc.isApproved && !doc.isLock);
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

  const fetchHomePageData = async () => {
    setLoadingTopInterest(true);
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

      const topDocResponse = await getTopDownloadedDocument();
      let topDocData = topDocResponse.data;
      if (topDocData && Array.isArray(topDocData.$values) && topDocData.$values) {
        topDocData = topDocData.$values.length > 0 ? topDocData.$values[0] : null;
      } else if (topDocData && Object.prototype.hasOwnProperty.call(topDocData, '$value')) {
        topDocData = topDocData.$value;
      }
      setTopDownloadedDoc(topDocData);

      const topInterestDocsResponse = await getTopDownloadedDocumentsList(5);
      let topInterestData = topInterestDocsResponse.data;
      if (topInterestData && Array.isArray(topInterestData.$values)) {
        setTopInterestDocuments(topInterestData.$values);
      } else if (Array.isArray(topInterestData)) {
        setTopInterestDocuments(topInterestData);
      } else {
        setTopInterestDocuments([]);
      }
    } catch (error) {
      console.error("Error fetching home page data:", error);
      toast.error('Không thể tải dữ liệu bảng xếp hạng.');
      setTopInterestDocuments([]);
    } finally {
      setLoadingTopInterest(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [searchTerm, selectedCategory, selectedSchool, tags, currentPage]);

  useEffect(() => {
    fetchCategories();
    fetchSchools();
    fetchHomePageData();
  }, []);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

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
              style={{ height: '180px', objectFit: 'cover' }}
              onError={(e) => { e.target.src = getFullImageUrl(null); }}
            />
            {doc.school?.logoUrl && (
              <img
                src={getFullImageUrl(doc.school.logoUrl)}
                alt={doc.school.name || 'School Logo'}
                className="school-logo"
                style={{
                  position: 'absolute', top: '10px', right: '10px',
                  width: '50px', height: '50px', borderRadius: '50%',
                  objectFit: 'cover', border: '2px solid white', backgroundColor: 'white',
                }}
                onError={(e) => { e.target.src = '/default-school-logo.png'; }}
              />
            )}
          </div>
          <div className="card-body d-flex flex-column p-2">
            <div className="d-flex justify-content-between align-items-start mb-1">
              <h5 className="card-title mb-0 me-2" title={doc.title} style={{ flex: '1', fontSize: '1rem', fontWeight: '500', maxHeight: '2.8em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {doc.title}
              </h5>
              <small className="text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                <i className="bi bi-download me-1"></i>
                {doc.downloadCount}
              </small>
            </div>
            <p className="card-text flex-grow-1" style={{ fontSize: '0.85rem', minHeight: '36px', maxHeight: '3.2em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '0.5rem' }}>
              {doc.description || "Không có mô tả."}
            </p>
            <div className="card-meta mt-auto text-muted" style={{ fontSize: '0.75rem' }}>
              <small className="d-block mb-1 text-truncate" title={doc.email ? `Người đăng: ${doc.email}` : 'Người đăng: Không xác định'}>
                <i className="bi bi-person me-1"></i>
                {doc.email || 'Không xác định'}
              </small>
              <small className="d-block">
                <i className="bi bi-calendar me-1"></i>
                {new Date(doc.uploadedAt).toLocaleDateString()}
              </small>
            </div>
            <Link to={`/document/${doc.documentId}`} className="btn btn-primary btn-sm mt-2 py-1 px-2" style={{ fontSize: '0.8rem' }}>
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const ContributorColumn = ({ title, data, icon, statLabel, statValue, linkTo }) => {
    const columnRef = useRef(null);
    const isVisible = useOnScreen(columnRef);

    // Gỡ lỗi: In avatarUrl ra console
    console.log(`${title} - AvatarUrl:`, data?.avatarUrl);

    return (
      <div ref={columnRef} className={`contributor-column fade-in ${isVisible ? 'visible' : ''}`}>
        <h4 className="column-title">{title}</h4>
        {data ? (
          <div className="contributor-card h-100 text-center">
            {icon && <i className={`bi ${icon} contributor-icon`}></i>}
            {linkTo ? (
              <>
                <img
                  src={getFullImageUrl(data.coverImageUrl)}
                  alt={data.title || 'Document cover'}
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }}
                  onError={(e) => { e.target.src = getFullImageUrl(null); }}
                />
                <h5
                  className="contributor-name mt-2"
                  title={data.title}
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {data.title.length > 30 ? `${data.title.substring(0, 27)}...` : data.title}
                </h5>
                <p className="contributor-stat mb-2">
                  <i className="bi bi-download me-1"></i>{statLabel}: {statValue}
                </p>
                <Link to={linkTo} className="btn btn-sm btn-outline-primary w-100">Xem chi tiết</Link>
              </>
            ) : (
              <>
                <img
                  src={getFullImageUrl(data.avatarUrl)} // Hiển thị avatar của người dùng
                  alt={data.fullName || 'User Avatar'}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    margin: '0 auto 1rem',
                    border: '2px solid #e9ecef',
                  }}
                  onError={(e) => {
                    console.error(`Failed to load avatar for ${title}:`, data.avatarUrl);
                    e.target.src = '/avatars/defaultavatar.png';
                  }}
                />
                <p
                  className="contributor-name"
                  title={data.fullName || data.email}
                  style={{ fontSize: '1.1rem', fontWeight: 'bold' }}
                >
                  {data.fullName || data.email}
                </p>
                <p className="contributor-stat">{statLabel}: {statValue}</p>
              </>
            )}
          </div>
        ) : (<p className="text-center">Không có dữ liệu</p>)}
      </div>
    );
  };

  const SchoolCard = ({ school }) => {
    const cardRef = useRef(null);
    const isVisible = useOnScreen(cardRef);
    return (
      <div ref={cardRef} className={`col fade-in ${isVisible ? 'visible' : ''}`}>
        <div className="school-card card h-100 shadow-sm">
          <img src={getFullImageUrl(school.logoUrl)} alt={school.name || 'School Logo'} className="card-img-top" style={{ height: '200px', objectFit: 'contain', padding: '20px', backgroundColor: '#f8f9fa' }} onError={(e) => { e.target.src = '/default-school-logo.png'; }} />
          <div className="card-body d-flex flex-column">
            <h5 className="card-title text-truncate" title={school.name}>{school.name}</h5>
            <p className="card-text flex-grow-1" style={{ fontSize: '0.9rem', minHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              <span className="text-muted d-block"><i className="bi bi-people me-1"></i> Sinh viên: {school.userCount || 0}</span>
              <span className="text-muted d-block"><i className="bi bi-file-earmark-text me-1"></i> Bài đăng: {school.documentCount || 0}</span>
            </p>
            <a href={school.externalUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm mt-2">Xem trang web</a>
          </div>
        </div>
      </div>
    );
  };

  const TopInterestDocumentItem = ({ doc, rank }) => {
    return (
      <li className={`list-group-item top-interest-item d-flex align-items-start py-2 px-0`}>
        <span className="fw-bold me-3 ms-2" style={{ fontSize: '1rem', minWidth: '20px', textAlign: 'center' }}>#{rank}</span>
        <Link to={`/document/${doc.documentId}`} className="text-decoration-none text-dark d-flex align-items-start flex-grow-1" style={{ minWidth: 0 }}>
          <img src={getFullImageUrl(doc.coverImageUrl)} alt={doc.title || 'Cover'} style={{ width: '50px', height: '65px', objectFit: 'cover', borderRadius: '4px', marginRight: '12px', flexShrink: 0 }} onError={(e) => { e.target.src = getFullImageUrl(null); }} />
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <h6 className="mb-1 text-truncate" title={doc.title} style={{ fontSize: '0.9rem', fontWeight: 500 }}>{doc.title}</h6>
            <small className="text-muted d-block"><i className="bi bi-download me-1"></i> {doc.downloadCount} lượt tải</small>
            {doc.uploadedByUser?.fullName && (
              <small className="text-muted d-block text-truncate" style={{ fontSize: '0.75rem' }} title={`Người đăng: ${doc.uploadedByUser.fullName}`}>
                <i className="bi bi-person me-1"></i>{doc.uploadedByUser.fullName}
              </small>
            )}
          </div>
        </Link>
      </li>
    );
  };

  const TopInterestDocumentsList = ({ documents, isLoading }) => {
    const renderContent = () => {
      if (isLoading) return <div className="text-center py-5"><div className="spinner-border spinner-border-sm text-primary" role="status"><span className="visually-hidden">Loading...</span></div><p className="mb-0 mt-2 text-muted small">Đang tải...</p></div>;
      if (!documents || documents.length === 0) return <p className="text-muted text-center py-4 px-2 small">Chưa có tài liệu nổi bật nào.</p>;
      return <ul className="list-group list-group-flush">{documents.map((doc, index) => (<TopInterestDocumentItem key={doc.documentId || index} doc={doc} rank={index + 1} />))}</ul>;
    };
    return (
      <div className="card shadow-sm top-interest-documents-card">
        <div className="card-header bg-light py-2"><h5 className="mb-0" style={{ fontSize: '0.9rem', fontWeight: 500 }}><i className="bi bi-graph-up-arrow me-2 text-primary"></i>Tài liệu được quan tâm nhiều</h5></div>
        <div className="card-body p-2" style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>{renderContent()}</div>
      </div>
    );
  };

  return (
    <div>
      <Banner />
      <div className="home-container py-4">
        <div className="container">
          <div className="header-section mb-3">
            <div className="title-group">
              <h2 className="main-title">Tài liệu học tập</h2>
              <h4 className="sub-title">Khám phá & chia sẻ tri thức</h4>
            </div>
            <div className="d-flex flex-column flex-md-row align-items-center ms-auto search-filter-group">
              <div className="search-wrapper me-2 me-md-3 mb-2 mb-md-0 w-100">
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
              <div className="category-wrapper me-2 me-md-3 mb-2 mb-md-0 w-100">
                <select
                  className="form-select form-select-sm"
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
              <div className="school-wrapper me-2 me-md-3 mb-2 mb-md-0 w-100">
                <select
                  className="form-select form-select-sm"
                  value={selectedSchool}
                  onChange={(e) => {
                    setSelectedSchool(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Tất cả trường</option>
                  {schools.length > 0 ? (
                    schools.map((school) => (
                      <option key={school.schoolId} value={school.schoolId}>
                        {school.name}
                      </option>
                    ))
                  ) : (
                    <option disabled>Không có trường</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="row mt-2">
            <div className="col-lg-9 col-md-8 order-md-1">
              {loading ? (
                <div className="loading-container py-5 text-center"><div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div><p className="loading-text mt-2">Đang tải tài liệu...</p></div>
              ) : documents.length > 0 ? (
                <>
                  <div className="documents-grid row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
                    {documents.map((doc) => (<DocumentCard key={doc.documentId} doc={doc} />))}
                  </div>
                  {totalPages > 1 && (
                    <div className="pagination-section mt-4 d-flex justify-content-center">
                      <button className="prev-button btn btn-outline-primary btn-sm me-2" onClick={handlePrevPage} disabled={currentPage === 1}><i className="bi bi-arrow-left me-1"></i> Trang trước</button>
                      <button className="next-button btn btn-outline-primary btn-sm" onClick={handleNextPage} disabled={currentPage === totalPages}>Trang tiếp <i className="bi bi-arrow-right ms-1"></i></button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state py-5 text-center"><i className="bi bi-folder-x empty-icon fs-1 text-muted"></i><p className="mt-2">Không có tài liệu nào để hiển thị.</p></div>
              )}
            </div>

            <div className="col-lg-3 col-md-4 order-md-2 mt-4 mt-md-0">
              <TopInterestDocumentsList documents={topInterestDocuments} isLoading={loadingTopInterest} />
            </div>
          </div>

          <div className="custom-divider my-4"><span className="divider-text">✨ Cộng đồng ✨</span></div>
          <div className="title-group text-center mb-4">
            <h2 className="main-title">Các trường đại học tiêu biểu</h2>
          </div>
          {schools.length > 0 ? (
            <div className="schools-grid row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
              {schools.map((school) => (<SchoolCard key={school.schoolId} school={school} />))}
            </div>
          ) : (
            <div className="empty-state py-4 text-center"><i className="bi bi-building empty-icon fs-2 text-muted"></i><p className="mt-2">Không có trường đại học nào để hiển thị.</p></div>
          )}

          <div className="custom-divider my-4"><span className="divider-text">✨ Bảng Vinh Danh ✨</span></div>
          <div className="title-group text-center mb-4"><h2 className="main-title">Bảng xếp hạng nổi bật</h2></div>
          <div className="top-contributors-section d-flex flex-row justify-content-center gap-4">
            <div className="contributor-wrapper">
              <ContributorColumn
                title="Người bình luận nhiều nhất"
                data={topCommenter}
                icon="bi-chat-left-text-fill"
                statLabel="Số bình luận"
                statValue={topCommenter?.commentCount}
              />
            </div>
            <div className="contributor-wrapper">
              <ContributorColumn
                title="Người điểm cao nhất"
                data={topPointsUser}
                icon="bi-star-fill"
                statLabel="Điểm"
                statValue={topPointsUser?.points}
              />
            </div>
            <div className="contributor-wrapper">
              <ContributorColumn
                title="Tài liệu tải nhiều nhất"
                data={topDownloadedDoc}
                statLabel="Lượt tải"
                statValue={topDownloadedDoc?.downloadCount}
                linkTo={topDownloadedDoc ? `/document/${topDownloadedDoc.documentId}` : null}
              />
            </div>
          </div>
          <div className="text-center mt-4 mb-5">
            <Link to="/rankings" className="btn btn-primary btn-lg shadow-sm">
              <i className="bi bi-bar-chart-steps me-2"></i> Xem Tất Cả Bảng Xếp Hạng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;