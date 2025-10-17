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
import '../styles/pages/Home.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
        height: '500px',
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
          color: 'white',
          textAlign: 'center',
          padding: '30px',
        }}
      >
        <h1 style={{ fontSize: '2.8rem', marginBottom: '15px' }}>
          Chào mừng đến với Thư viện Tài liệu Học tập
        </h1>
        <p style={{ fontSize: '1.4rem' }}>
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

  const [categories, setCategories] = useState([]);
  const [schools, setSchools] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const documentsPerPage = 10;

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
    } catch {
      toast.error('Không thể tải danh mục.');
      setCategories([]);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {
        Keyword: searchTerm || undefined,
        CategoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
        SchoolId: selectedSchool ? parseInt(selectedSchool) : undefined,
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
      if (commenterData && '$value' in commenterData) {
        commenterData = commenterData.$value;
      } else if (commenterData && Array.isArray(commenterData.$values)) {
        commenterData = commenterData.$values.length > 0 ? commenterData.$values[0] : null;
      }
      setTopCommenter(commenterData);

      const pointsResponse = await getTopPointsUser();
      let pointsData = pointsResponse.data;
      if (pointsData && '$value' in pointsData) {
        pointsData = pointsData.$value;
      } else if (pointsData && Array.isArray(pointsData.$values)) {
        pointsData = pointsData.$values.length > 0 ? pointsData.$values[0] : null;
      }
      setTopPointsUser(pointsData);

      const topDocResponse = await getTopDownloadedDocument();
      let topDocData = topDocResponse.data;
      if (topDocData && Array.isArray(topDocData.$values) && topDocData.$values) {
        topDocData = topDocData.$values.length > 0 ? topDocData.$values[0] : null;
      } else if (topDocData && '$value' in topDocData) {
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
  }, [searchTerm, selectedCategory, selectedSchool, currentPage]);

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
      <div ref={cardRef} className={`document-column fade-in ${isVisible ? 'visible' : ''}`}>
        <Link to={`/document/${doc.documentId}`} className="document-link document-card">
          <div className="document-card-image-container">
            <img
              src={getFullImageUrl(doc.coverImageUrl)}
              alt={doc.title || 'Cover'}
              className="document-card-image"
              onError={(e) => { e.target.src = getFullImageUrl(null); }}
            />
            {doc.school?.logoUrl && (
              <img
                src={getFullImageUrl(doc.school.logoUrl)}
                alt={doc.school.name || 'School Logo'}
                className="document-school-logo"
                onError={(e) => { e.target.src = '/default-school-logo.png'; }}
              />
            )}
          </div>
          <div className="document-card-body">
            <div className="document-card-header">
              <h5 className="home-document-title" title={doc.title}>
                {doc.title}
              </h5>
              <span className="document-download">
                <span className="icon-download"></span>
                {doc.downloadCount}
              </span>
            </div>
            <p className="document-description">
              {doc.description && doc.description.length > 60
                ? `${doc.description.slice(0, 57)}...`
                : doc.description || "Không có mô tả."}
            </p>
            <div className="document-meta">
              <div className="meta-author" title={doc.email ? `Người đăng: ${doc.email}` : 'Không xác định'}>
                <span className="icon-user"></span>
                {doc.email || 'Không xác định'}
              </div>
              <div className="meta-date">
                <span className="icon-calendar"></span>
                {new Date(doc.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  const ContributorColumn = ({ title, data, icon, statLabel, statValue, linkTo }) => {
    const columnRef = useRef(null);
    const isVisible = useOnScreen(columnRef);

    return (
      <div ref={columnRef} className={`contributor-column fade-in ${isVisible ? 'visible' : ''}`}>
        <h4 className="column-title">{title}</h4>
        {data ? (
          <div className="contributor-card">
            {icon && <span className={`contributor-icon icon-${icon}`}></span>}
            {linkTo ? (
              <>
                <img
                  src={getFullImageUrl(data.coverImageUrl)}
                  alt={data.title || 'Document cover'}
                  className="contributor-image"
                  onError={(e) => { e.target.src = getFullImageUrl(null); }}
                />
                <p className="contributor-name" title={data.title}>
                  {data.title.length > 30 ? `${data.title.slice(0, 27)}...` : data.title}
                </p>
                <p className="contributor-stat">{statLabel}: {statValue}</p>
                <Link to={linkTo} className="contributor-link">Xem chi tiết</Link>
              </>
            ) : (
              <>
                <img
                  src={getFullImageUrl(data.avatarUrl)}
                  alt={data.fullName || 'User Avatar'}
                  className="contributor-avatar"
                  onError={(e) => { e.target.src = '/avatars/defaultavatar.png'; }}
                />
                <p className="contributor-name" title={data.fullName || data.email}>
                  {data.fullName || data.email}
                </p>
                <p className="contributor-stat">{statLabel}: {statValue}</p>
              </>
            )}
          </div>
        ) : <p className="contributor-empty">Không có dữ liệu</p>}
      </div>
    );
  };


  // const SchoolCard = ({ school }) => {
  //   const cardRef = useRef(null);
  //   const isVisible = useOnScreen(cardRef);

  //   return (
  //     <div ref={cardRef} className={`school-card-wrapper fade-in ${isVisible ? 'visible' : ''}`}>
  //       <div className="school-card">
  //         <img
  //           src={getFullImageUrl(school.logoUrl)}
  //           alt={school.name || 'School Logo'}
  //           className="school-image"
  //           onError={(e) => { e.target.src = '/default-school-logo.png'; }}
  //         />
  //         <div className="school-card-body">
  //           <h5 className="school-name" title={school.name}>{school.name}</h5>
  //           <p className="school-meta">
  //             <span><span className="icon-people"></span> Sinh viên: {school.userCount || 0}</span>
  //             <span><span className="icon-doc"></span> Bài đăng: {school.documentCount || 0}</span>
  //           </p>
  //           <a href={school.externalUrl} target="_blank" rel="noopener noreferrer" className="school-link">
  //             Xem trang web
  //           </a>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };


  const TopInterestDocumentItem = ({ doc, rank }) => {
    return (
      <li className="top-interest-item">
        <span className="item-rank">{rank}</span>
        <Link to={`/document/${doc.documentId}`} className="item-link">
          <img
            src={getFullImageUrl(doc.coverImageUrl)}
            alt={doc.title || 'Cover'}
            className="item-image"
            onError={(e) => {
              e.target.src = getFullImageUrl(null);
            }}
          />
          <div className="item-info">
            <h6 className="item-title" title={doc.title}>
              {doc.title.length > 20 ? `${doc.title.slice(0, 17)}...` : doc.title}
            </h6>
            <div className="item-meta">
              <span className="item-download">
                <span className="icon-download"></span>
                {doc.downloadCount}
              </span>
            </div>
          </div>
        </Link>
      </li>
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

      if (!documents || documents.length === 0)
        return <p className="empty-text">Chưa có tài liệu nổi bật nào.</p>;

      return (
        <ul className="top-interest-list">
          {documents.map((doc, index) => (
            <TopInterestDocumentItem key={doc.documentId || index} doc={doc} rank={index + 1} />
          ))}
        </ul>
      );
    };

    return (
      <div className="top-interest-documents-card">
        <div className="top-interest-header">
          <h5 className="top-interest-title">
            <i className="icon-graph"></i>
            Tài liệu được quan tâm nhiều
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
                  <i className="icon-search">
                    <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
                  </i>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Tìm kiếm tài liệu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                    ? categories.map((category) => (
                      <option key={category.categoryId} value={category.categoryId}>
                        {category.name}
                      </option>
                    ))
                    : <option disabled>Không có danh mục</option>}
                </select>
              </div>
              <div className="filter-wrapper">
                <select
                  className="select-filter"
                  value={selectedSchool}
                  onChange={(e) => {
                    setSelectedSchool(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">Tất cả trường</option>
                  {schools.length > 0
                    ? schools.map((school) => (
                      <option key={school.schoolId} value={school.schoolId}>
                        {school.name}
                      </option>
                    ))
                    : <option disabled>Không có trường</option>}
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
              ) : documents.length > 0 ? (
                <>
                  <div className="documents-grid">
                    {documents.slice(0, 10).map((doc) => (
                      <DocumentCard key={doc.documentId} doc={doc} />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="pagination-section">
                      <button
                        className="btn-page"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                      >
                        ‹ Trang trước
                      </button>
                      <button
                        className="btn-page"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                      >
                        Trang tiếp ›
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-view">
                  <i className="icon-empty"></i>
                  <p>Không có tài liệu nào để hiển thị.</p>
                </div>
              )}
            </main>
          </div>

          <div className="divider-section">
            <span className="divider-text">✨ Cộng đồng ✨</span>
          </div>

          {/* <div className="section-title text-center">
            <h2 className="main-title">Các trường đại học đã tham gia</h2>
          </div>

          {schools.length > 0 ? (
            <div className="schools-grid">
              {schools.map((school) => (
                <SchoolCard key={school.schoolId} school={school} />
              ))}
            </div>
          ) : (
            <div className="empty-view">
              <i className="icon-empty-school"></i>
              <p>Không có trường đại học nào để hiển thị.</p>
            </div>
          )} */}



          <div className="text-center">
            <h2 className="main-title">Bảng xếp hạng nổi bật</h2>
          </div>

          <div className="contributors-section">
            <div className="contrib-box">
              <ContributorColumn
                title="Người bình luận nhiều nhất"
                data={topCommenter}
                icon="icon-comment"
                statLabel="Số bình luận"
                statValue={topCommenter?.commentCount}
              />
            </div>
            <div className="contrib-box">
              <ContributorColumn
                title="Người điểm cao nhất"
                data={topPointsUser}
                icon="icon-star"
                statLabel="Điểm"
                statValue={topPointsUser?.points}
              />
            </div>
            <div className="contrib-box">
              <ContributorColumn
                title="Tài liệu tải nhiều nhất"
                data={topDownloadedDoc}
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
