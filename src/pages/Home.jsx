import { useState, useEffect, useRef } from 'react';
import {
  searchDocuments,
  getCategories,
  getTopCommenter,
  getTopDownloadedDocument,
  getTopDownloadedDocumentsList
} from '../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import bannerImage1 from '../assets/images/anhbg.jpg';
import bannerImage2 from '../assets/images/anhbg2.jpg';
import bannerImage3 from '../assets/images/anhbg3.jpg';
import { getFullImageUrl } from '../utils/imageUtils';
import useOnScreen from '../hooks/useOnScreen';
import '../styles/pages/Home.css';
import {
  faMagnifyingGlass,
  faUser,
  faCalendarDays,
  faDownload,
  faChartLine,
  faCommentDots,
  faCircleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Banner
function Banner() {
  const bannerRef = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const bannerImages = [bannerImage1, bannerImage2, bannerImage3];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === bannerImages.length - 1 ? 0 : prev + 1
      );
    }, 5000);
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
        height: '500px',
        backgroundImage: `url(${bannerImages[currentImageIndex]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}
    >
      <div className="banner-content">
        <h1>Chào mừng đến với Thư viện Tài liệu Học tập</h1>
        <p>Tìm kiếm và khám phá tài liệu học tập dễ dàng!</p>
      </div>
    </div>
  );
}

function Home() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const documentsPerPage = 10;

  const [topCommenter, setTopCommenter] = useState(null);
  const [topDownloadedDoc, setTopDownloadedDoc] = useState(null);
  const [topInterestDocuments, setTopInterestDocuments] = useState([]);
  const [loadingTopInterest, setLoadingTopInterest] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      const data = res.data;
      if (Array.isArray(data)) setCategories(data);
      else if (data?.$values) setCategories(data.$values);
      else setCategories([]);
    } catch {
      toast.error('Không thể tải danh mục.');
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {
        Keyword: debouncedSearchTerm || undefined,
        CategoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
        SortBy: 'newest',
        Page: currentPage,
        PageSize: documentsPerPage,
      };
      const res = await searchDocuments(params);
      const { documents: docs = [], total = 0 } = res.data;
      const approvedDocs = docs.filter((d) => d.isApproved && !d.isLock);
      setDocuments(approvedDocs);
      setTotalPages(Math.ceil(total / documentsPerPage));
    } catch {
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
      const commenterRes = await getTopCommenter();
      let commenterData = commenterRes.data;
      if (Array.isArray(commenterData?.$values))
        commenterData = commenterData.$values[0] || null;
      setTopCommenter(commenterData);

      const topDocRes = await getTopDownloadedDocument();
      let topDocData = topDocRes.data;
      if (Array.isArray(topDocData?.$values))
        topDocData = topDocData.$values[0] || null;
      setTopDownloadedDoc(topDocData);

      const topInterestRes = await getTopDownloadedDocumentsList(5);
      let topInterestData = topInterestRes.data;
      if (Array.isArray(topInterestData?.$values))
        setTopInterestDocuments(topInterestData.$values);
      else if (Array.isArray(topInterestData))
        setTopInterestDocuments(topInterestData);
      else setTopInterestDocuments([]);
    } catch {
      toast.error('Không thể tải dữ liệu bảng xếp hạng.');
      setTopInterestDocuments([]);
    } finally {
      setLoadingTopInterest(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchDocuments();
  }, [debouncedSearchTerm, selectedCategory, currentPage]);

  useEffect(() => {
    fetchCategories();
    fetchHomePageData();
  }, []);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const DocumentCard = ({ doc }) => {
    const ref = useRef(null);
    const isVisible = useOnScreen(ref);
    return (
      <div ref={ref} className={`document-column fade-in ${isVisible ? 'visible' : ''}`}>
        <Link to={`/document/${doc.documentId}`} className="document-link document-card">
          <div className="document-card-image-container">
            <img
              src={getFullImageUrl(doc.coverImageUrl)}
              alt={doc.title}
              className="document-card-image"
              onError={(e) => (e.target.src = getFullImageUrl(null))}
            />
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
              <div className="meta-author" title={doc.fullName || 'Không xác định'}>
                <FontAwesomeIcon icon={faUser} /> {doc.fullName || 'Không xác định'}
              </div>
              <div className="meta-date">
                <FontAwesomeIcon icon={faCalendarDays} />{' '}
                {new Date(doc.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  const ContributorColumn = ({ title, data, icon, statLabel, statValue, linkTo }) => {
    const ref = useRef(null);
    const isVisible = useOnScreen(ref);
    return (
      <div ref={ref} className={`contributor-column fade-in ${isVisible ? 'visible' : ''}`}>
        <h4 className="column-title">{title}</h4>
        {data ? (
          <div className="contributor-card">
            {linkTo ? (
              <>
                <img
                  src={getFullImageUrl(data.coverImageUrl)}
                  alt={data.title}
                  className="contributor-image"
                  onError={(e) => (e.target.src = getFullImageUrl(null))}
                />
                <p className="contributor-name">{data.title}</p>
                <p className="contributor-stat">{statLabel}: {statValue}</p>
                <Link to={linkTo} className="contributor-link">Xem chi tiết</Link>
              </>
            ) : (
              <>
                <img
                  src={getFullImageUrl(data.avatarUrl)}
                  alt={data.fullName || 'User Avatar'}
                  className="contributor-avatar"
                  onError={(e) => (e.target.src = '/avatars/defaultavatar.png')}
                />
                <p className="contributor-name">{data.fullName || data.email}</p>
                <p className="contributor-stat">{statLabel}: {statValue}</p>
              </>
            )}
          </div>
        ) : <p className="contributor-empty">Không có dữ liệu</p>}
      </div>
    );
  };

  const TopInterestDocumentsList = ({ documents, isLoading }) => {
    const renderContent = () => {
      if (isLoading)
        return (
          <div className="loading-box">
            <div className="spinner-custom-sm"></div>
            <p className="loading-text-small">Đang tải...</p>
          </div>
        );
      if (!documents?.length) return <p className="empty-text">Chưa có tài liệu nổi bật nào.</p>;
      return (
        <ul className="top-interest-list">
          {documents.map((doc, i) => (
            <li key={doc.documentId || i} className="top-interest-item">
              <span className="item-rank">{i + 1}</span>
              <Link to={`/document/${doc.documentId}`} className="item-link">
                <img
                  src={getFullImageUrl(doc.coverImageUrl)}
                  alt={doc.title}
                  className="item-image"
                  onError={(e) => (e.target.src = getFullImageUrl(null))}
                />
                <div className="item-info">
                  <h6 className="item-title">{doc.title}</h6>
                  <div className="item-meta">
                    {doc.uploadedByUser?.fullName || doc.fullName || 'Ẩn danh'}
                    <span className="item-download">
                      <FontAwesomeIcon icon={faDownload} /> {doc.downloadCount}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      );
    };

    return (
      <div className="top-interest-documents-card">
        <div className="top-interest-header">
          <h5 className="top-interest-title">
            <FontAwesomeIcon icon={faChartLine} /> Tài liệu được quan tâm
          </h5>
        </div>
        <div className="top-interest-body">{renderContent()}</div>
      </div>
    );
  };

  return (
    <div className="home-root">
      <Banner />
      <div className="home-content">
        <div className="home-inner container-root">
          <header className="header-section">
            <div className="title-group">
              <h2 className="main-title">Tài liệu học tập</h2>
              <h4 className="sub-title">Khám phá & chia sẻ tri thức</h4>
            </div>
            <div className="search-filter-group">
              <div className="search-wrapper">
                <div className="search-group">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="icon-search" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Tìm kiếm tài liệu..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (currentPage !== 1) setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
              <div className="filter-wrapper">
                <select
                  className="select-filter"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.length > 0
                    ? categories.map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                      ))
                    : <option disabled>Không có danh mục</option>}
                </select>
              </div>
            </div>
          </header>

          <div className="content-section">
            <aside className="sidebar-area">
              <TopInterestDocumentsList
                documents={topInterestDocuments}
                isLoading={loadingTopInterest}
              />
            </aside>

            <main className="main-area">
              {loading ? (
                <div className="loading-view">
                  <div className="spinner-custom"></div>
                  <p className="loading-text">Đang tải tài liệu...</p>
                </div>
              ) : documents.length ? (
                <>
                  <div className="documents-grid">
                    {documents.slice(0, 10).map((doc) => (
                      <DocumentCard key={doc.documentId} doc={doc} />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="pagination-section">
                      <button className="btn-page" onClick={handlePrevPage} disabled={currentPage === 1}>
                        ‹ Trang trước
                      </button>
                      <button className="btn-page" onClick={handleNextPage} disabled={currentPage === totalPages}>
                        Trang tiếp ›
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-view">
                  <FontAwesomeIcon icon={faCircleExclamation} size="2x" />
                  <p>Không có tài liệu nào để hiển thị.</p>
                </div>
              )}
            </main>
          </div>

          <div className="divider-section">
            <span className="divider-text">✨ Cộng đồng ✨</span>
          </div>

          <div className="text-center">
            <h2 className="main-title">Bảng xếp hạng nổi bật</h2>
          </div>

          <div className="contributors-section">
            <div className="contrib-box">
              <ContributorColumn
                title="Người bình luận nhiều nhất"
                data={topCommenter}
                icon={<FontAwesomeIcon icon={faCommentDots} />}
                statLabel="Số bình luận"
                statValue={topCommenter?.commentCount}
              />
            </div>
            <div className="contrib-box">
              <ContributorColumn
                title="Tài liệu tải nhiều nhất"
                data={topDownloadedDoc}
                icon={<FontAwesomeIcon icon={faDownload} />}
                statLabel="Lượt tải"
                statValue={topDownloadedDoc?.downloadCount}
                linkTo={topDownloadedDoc ? `/document/${topDownloadedDoc.documentId}` : null}
              />
            </div>
          </div>

          <div className="action-center">
            <Link to="/rankings" className="btn-primary-custom">
              Xem Tất Cả Bảng Xếp Hạng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
