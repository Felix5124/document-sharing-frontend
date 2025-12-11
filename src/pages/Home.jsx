import { useState, useEffect, useRef, memo, useContext } from 'react';
import {
  searchDocuments,
  getCategories,
  getTopCommenter,
  getTopUploader,
  getTopDownloadedDocument,
  getTopDownloadedDocumentsList,
  getDocumentById
} from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import bannerImage1 from '../assets/images/anhbg.jpg';
import bannerImage2 from '../assets/images/anhbg2.jpg';
import bannerImage3 from '../assets/images/anhbg3.jpg';
import { getFullImageUrl } from '../utils/imageUtils';
import { getFullAvatarUrl } from '../utils/avatarUtils';
import useOnScreen from '../hooks/useOnScreen';
import '../styles/pages/Home.css';
import { useHomeCache } from '../context/HomeCacheContext';
import {
  faMagnifyingGlass,
  faUser,
  faCalendarDays,
  faDownload,
  faChartLine,
  faCommentDots,
  faCircleExclamation,
  faStar,
  faBook,
  faUsers,
  faCrown,
  faRocket,
  faUpload,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// Global cache for VIP status - persists across component unmounts
const globalVipCache = {};

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

// Component để hiển thị danh sách tài liệu được quan tâm
const TopInterestDocumentsList = memo(({ documents, isLoading }) => {
  // Khởi tạo augDocs từ cache nếu có
  const initialAugDocs = () => {
    if (documents && Array.isArray(documents) && documents.length > 0) {
      const cacheKey = documents.slice(0, 5).map(d => d.documentId).join(',');
      return globalVipCache[cacheKey] || [];
    }
    return [];
  };
  
  const [augDocs, setAugDocs] = useState(initialAugDocs);
  const lastFetchedDocsRef = useRef(null);
  const isFetchingRef = useRef(false);
  
  useEffect(() => {
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      setAugDocs([]);
      return;
    }
    
    // Tạo cache key dựa trên documentId thay vì stringify toàn bộ
    const cacheKey = documents.slice(0, 5).map(d => d.documentId).join(',');
    
    if (lastFetchedDocsRef.current === cacheKey || isFetchingRef.current) {
      return;
    }
    
    // Kiểm tra cache trước (dùng global cache)
    if (globalVipCache[cacheKey]) {
      setAugDocs(globalVipCache[cacheKey]);
      lastFetchedDocsRef.current = cacheKey;
      return;
    }
    lastFetchedDocsRef.current = cacheKey;
    isFetchingRef.current = true;
    
    let mounted = true;
    const keys = ['isVipOnly', 'IsVipOnly', 'isVip', 'IsVip', 'vipOnly', 'VipOnly'];
    const getLocalVip = (obj) => {
      for (const k of keys) {
        if (obj && obj[k] !== undefined && obj[k] !== null) {
          const v = obj[k];
          const truthy = v === true || v === 'true' || v === 1 || v === '1';
          return { known: true, value: truthy };
        }
      }
      return { known: false, value: false };
    };

    const fetchDetails = async () => {
      try {
        const base = documents.slice(0, 5);
        const detailed = await Promise.all(
          base.map(async (d) => {
            const local = getLocalVip(d);
            if (local.known) return { ...d, vipFlag: local.value };
            try {
              if (!d?.documentId) return { ...d, vipFlag: false };
              const res = await getDocumentById(d.documentId);
              const dd = res?.data || {};
              const fromDetail = getLocalVip(dd);
              return { ...d, vipFlag: fromDetail.known ? fromDetail.value : false };
            } catch {
              return { ...d, vipFlag: false };
            }
          })
        );
        if (mounted) {
          const cacheKey = documents.slice(0, 5).map(d => d.documentId).join(',');
          setAugDocs(detailed);
          globalVipCache[cacheKey] = detailed;
          isFetchingRef.current = false;
        }
      } catch {
        isFetchingRef.current = false;
      }
    };
    
    fetchDetails();
    return () => { 
      mounted = false;
      isFetchingRef.current = false;
    };
  }, [documents]);

  const docsToRender = augDocs.length > 0 ? augDocs : documents.slice(0, 5);
  const isVipDoc = (d) => d?.vipFlag === true || [d?.isVipOnly, d?.IsVipOnly, d?.isVip, d?.IsVip, d?.vipOnly, d?.VipOnly]
    .some((v) => v === true || v === 'true' || v === 1 || v === '1');

  return (
    <div className="top-interest-documents-card">
      <div className="top-interest-header">
        <h5 className="top-interest-title">
          <FontAwesomeIcon icon={faChartLine} /> Tài liệu được quan tâm
        </h5>
      </div>
      <div className="top-interest-body">
        {isLoading ? (
          <div className="loading-box">
            <div className="spinner-custom-sm"></div>
            <p className="loading-text-small">Đang tải...</p>
          </div>
        ) : !docsToRender?.length ? (
          <p className="empty-text">Chưa có tài liệu nổi bật nào.</p>
        ) : (
          <ul className="top-interest-list">
            {docsToRender.map((doc, i) => (
              <li
                key={doc.documentId || i}
                className={`top-interest-item ${isVipDoc(doc) ? 'vip' : ''}`}
              >
                <span className="item-rank">{i + 1}</span>
                <Link to={`/document/${doc.documentId}`} className="item-link">
                  <div className="item-thumb">
                    <img
                      src={getFullImageUrl(doc.coverImageUrl)}
                      alt={doc.title}
                      className="item-image"
                      onError={(e) => (e.target.src = getFullImageUrl(null))}
                    />
                    {isVipDoc(doc) && (
                      <span className="vip-badge-interest" title="Tài liệu Premium">
                        <FontAwesomeIcon icon={faStar} />
                      </span>
                    )}
                  </div>
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
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: chỉ re-render khi documents hoặc isLoading thực sự thay đổi
  return (
    JSON.stringify(prevProps.documents) === JSON.stringify(nextProps.documents) &&
    prevProps.isLoading === nextProps.isLoading
  );
});

function Home() {
  const { user } = useContext(AuthContext);
  const { cache, setCache } = useHomeCache();
  const [documents, setDocuments] = useState(cache.documents || []);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(cache.searchTerm || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(cache.searchTerm || '');
  const [selectedCategory, setSelectedCategory] = useState(cache.selectedCategory || '');

  const [categories, setCategories] = useState(cache.categories || []);
  const [currentPage, setCurrentPage] = useState(cache.currentPage || 1);
  const [totalPages, setTotalPages] = useState(cache.totalPages || 1);
  const documentsPerPage = 10;

  const [topCommenter, setTopCommenter] = useState(cache.topCommenter || null);
  const [topUploader, setTopUploader] = useState(cache.topUploader || null);
  const [topDownloadedDoc, setTopDownloadedDoc] = useState(cache.topDownloadedDoc || null);
  const [topInterestDocuments, setTopInterestDocuments] = useState(cache.topInterestDocuments || []);
  const [loadingTopInterest, setLoadingTopInterest] = useState(false);
  const skipInitialFetchRef = useRef(false);

  // Hydrate from cache once
  useEffect(() => {
    if (cache && (cache.documents?.length || cache.categories?.length || cache.topCommenter || cache.topUploader || cache.topDownloadedDoc || cache.topInterestDocuments?.length)) {
      skipInitialFetchRef.current = true; // prevent first fetches
    }
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      const data = res.data;
      let list = [];
      if (Array.isArray(data)) list = data; else if (data?.$values) list = data.$values; else list = [];
      setCategories(list);
      setCache(prev => ({ ...prev, categories: list }));
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
        // sortBy theo backend: 'newest' | 'popular' | default (title)
        SortBy: 'newest',
        Page: currentPage,
        PageSize: documentsPerPage,
      };
      const res = await searchDocuments(params);
      const { documents: docs = [], total = 0 } = res.data;
      
      // Chỉ hiển thị tài liệu đã được duyệt (Approved hoặc SemiApproved) và không bị khóa
      const approvedDocs = docs.filter((d) => (d.approvalStatus === 'Approved' || d.approvalStatus === 'SemiApproved') && !d.isLock);
      
      setDocuments(approvedDocs);
      const pages = Math.ceil(total / documentsPerPage);
      setTotalPages(pages);
      setCache(prev => ({
        ...prev,
        documents: approvedDocs,
        totalPages: pages,
        searchTerm: debouncedSearchTerm,
        selectedCategory,
        currentPage,
        hydratedAt: Date.now(),
      }));
    } catch {
      toast.error('Không thể tải tài liệu.');
      setDocuments([]);
      setTotalPages(1);
      setCache(prev => ({ ...prev, documents: [], totalPages: 1 }));
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

      const uploaderRes = await getTopUploader();
      let uploaderData = uploaderRes.data;
      if (Array.isArray(uploaderData)) {
        uploaderData = uploaderData[0] || null;
      } else if (uploaderData?.$values && Array.isArray(uploaderData.$values)) {
        uploaderData = uploaderData.$values[0] || null;
      }
      setTopUploader(uploaderData);

      const topDocRes = await getTopDownloadedDocument();
      let topDocData = topDocRes.data;
      if (Array.isArray(topDocData?.$values))
        topDocData = topDocData.$values[0] || null;
      setTopDownloadedDoc(topDocData);

      const topInterestRes = await getTopDownloadedDocumentsList(5);
      let topInterestData = topInterestRes.data;
      if (Array.isArray(topInterestData?.$values)) {
        setTopInterestDocuments(topInterestData.$values);
      } else if (Array.isArray(topInterestData)) {
        setTopInterestDocuments(topInterestData);
      } else setTopInterestDocuments([]);
      setCache(prev => ({
        ...prev,
        topCommenter: commenterData,
        topUploader: uploaderData,
        topDownloadedDoc: topDocData,
        topInterestDocuments: Array.isArray(topInterestData?.$values) ? topInterestData.$values : (Array.isArray(topInterestData) ? topInterestData : []),
      }));
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
    if (skipInitialFetchRef.current) {
      // Skip one run để không fetch lại ngay sau khi hydrate từ cache
      skipInitialFetchRef.current = false;
      return;
    }

    // Nếu bộ lọc/từ khóa/trang thay đổi so với cache → luôn fetch mới
    const paramsChanged =
      (cache.searchTerm || '') !== (debouncedSearchTerm || '') ||
      (cache.selectedCategory || '') !== (selectedCategory || '') ||
      (cache.currentPage || 1) !== (currentPage || 1);

    // Cache quá cũ thì cũng refetch
    const cacheTooOld = Date.now() - (cache.hydratedAt || 0) > 60000; // 60 giây

    if (paramsChanged || !cache.hydratedAt || cacheTooOld) {
      fetchDocuments();
    }
  }, [debouncedSearchTerm, selectedCategory, currentPage]);


  useEffect(() => {
    const needsCategories = !(cache?.categories?.length);
    const needsHomeData = !(cache?.topCommenter || cache?.topDownloadedDoc || (cache?.topInterestDocuments?.length));
    if (needsCategories) fetchCategories();
    if (needsHomeData) fetchHomePageData();
  }, []);

  const scrollToGridTop = () => {
    const el = document.querySelector('.main-area');
    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      scrollToGridTop();
      setCurrentPage(currentPage + 1);
    }
  };
  const handlePrevPage = () => {
    if (currentPage > 1) {
      scrollToGridTop();
      setCurrentPage(currentPage - 1);
    }
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
            {(doc.isVipOnly || doc.IsVipOnly) && (
              <span className="vip-badge" title="Tài liệu Premium">
                <FontAwesomeIcon icon={faStar} />
              </span>
            )}
            {doc.approvalStatus === 'SemiApproved' && (
              <span className="status-label semi-approved">Chưa kiểm duyệt</span>
            )}
            {doc.approvalStatus === 'Approved' && (
              <span className="status-label approved">Đã kiểm duyệt</span>
            )}
            {doc.approvalStatus === 'Pending' && (
              <span className="status-label pending">Đang chờ duyệt</span>
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

  const ContributorColumn = ({ title, data, statLabel, statValue, linkTo }) => {
    const ref = useRef(null);
    const isVisible = useOnScreen(ref);
    return (
      <div ref={ref} className={`contributor-column fade-in ${isVisible ? 'visible' : ''}`}>
        <h4 className="column-title">{title}</h4>
        {data ? (
          <div className="contributor-card">
            {linkTo ? (
              <>
                <Link to={linkTo}>
                  <img
                    src={getFullImageUrl(data.coverImageUrl)}
                    alt={data.title}
                    className="contributor-image"
                    onError={(e) => (e.target.src = getFullImageUrl(null))}
                  />
                </Link>
                <Link to={linkTo} className="contributor-name-link">
                  {data.title}
                </Link>
                <p className="contributor-stat">{statLabel}: {statValue}</p>
                <Link to={linkTo} className="contributor-link">Xem chi tiết</Link>
              </>
            ) : (
              <>
                <Link to={data.userId ? `/profile/${data.userId}` : '/profile'}>
                  <img
                    src={getFullAvatarUrl(data.avatarUrl)}
                    alt={data.fullName || 'User Avatar'}
                    className="contributor-avatar"
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = getFullAvatarUrl(null); }}
                  />
                </Link>
                <Link 
                  to={data.userId ? `/profile/${data.userId}` : '/profile'} 
                  className="contributor-name-link"
                >
                  {data.fullName || data.email}
                </Link>
                <p className="contributor-stat">{statLabel}: {statValue}</p>
              </>
            )}
          </div>
        ) : <p className="contributor-empty">Không có dữ liệu</p>}
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
              {documents.length ? (
                <>
                  <div className={`documents-grid ${loading ? 'is-loading' : 'is-loaded'}`}>
                    {documents.slice(0, 10).map((doc) => (
                      <DocumentCard key={doc.documentId} doc={doc} />
                    ))}
                    {loading && (
                      <div className="grid-loading-overlay" aria-hidden="true">
                        <div className="spinner-custom"></div>
                      </div>
                    )}
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
              ) : loading ? (
                <div className="loading-view">
                  <div className="spinner-custom"></div>
                  <p className="loading-text">Đang tải tài liệu...</p>
                </div>
              ) : (
                <div className="empty-view">
                  <FontAwesomeIcon icon={faCircleExclamation} size="2x" />
                  <p>Không có tài liệu nào để hiển thị.</p>
                </div>
              )}
            </main>
          </div>

          {/* VIP Banner - Giữa trang */}
          <div className="vip-horizontal-banner-wrapper">
            {!user?.isVip ? (
              <Link to="/upgrade-account" className="vip-horizontal-banner">
                <div className="vip-horizontal-left">
                  <div className="vip-horizontal-badge">
                    <FontAwesomeIcon icon={faStar} /> ĐẶC QUYỀN PREMIUM
                  </div>
                  <h2 className="vip-horizontal-title">
                    Nâng Cấp Premium - Mở Khóa Toàn Bộ Tính Năng
                  </h2>
                  <p className="vip-horizontal-subtitle">
                    Tăng giới hạn lượt tải • Tài liệu Premium • Không quảng cáo • Hỗ trợ ưu tiên 24/7
                  </p>
                  <div className="vip-horizontal-features">
                    <div className="vip-h-feature">
                      <FontAwesomeIcon icon={faDownload} />
                      <span>Tăng giới hạn lượt tải</span>
                    </div>
                    <div className="vip-h-feature">
                      <FontAwesomeIcon icon={faStar} />
                      <span>Premium Content</span>
                    </div>
                    <div className="vip-h-feature">
                      <FontAwesomeIcon icon={faRocket} />
                      <span>Không Quảng Cáo</span>
                    </div>
                  </div>
                </div>
                <div className="vip-horizontal-right">
                  <div className="vip-horizontal-icon-wrapper">
                    <FontAwesomeIcon icon={faCrown} className="vip-horizontal-icon" />
                  </div>
                  <button className="vip-horizontal-button">
                    <FontAwesomeIcon icon={faArrowRight} /> Nâng Cấp Ngay
                  </button>
                  <div className="vip-horizontal-price">
                    Chỉ từ <span className="price-highlight">49K</span>/tháng
                  </div>
                </div>
              </Link>
            ) : (
              <div className="vip-welcome-horizontal-banner">
                <div className="vip-welcome-left">
                  <div className="vip-welcome-badge">
                    <FontAwesomeIcon icon={faCrown} /> THÀNH VIÊN PREMIUM
                  </div>
                  <h2 className="vip-welcome-title">
                    Chào mừng {user.fullName || user.email}! 🎉
                  </h2>
                  <p className="vip-welcome-subtitle">
                    Bạn đang tận hưởng tất cả đặc quyền Premium của chúng tôi
                  </p>
                  <div className="vip-welcome-stats">
                    <div className="vip-stat">
                      <FontAwesomeIcon icon={faDownload} />
                      <span>13 files/ngày</span>
                    </div>
                    <div className="vip-stat">
                      <FontAwesomeIcon icon={faBook} />
                      <span>15 trang PDF</span>
                    </div>
                    <div className="vip-stat">
                      <FontAwesomeIcon icon={faStar} />
                      <span>Nội dung Premium</span>
                    </div>
                  </div>
                </div>
                <div className="vip-welcome-right">
                  <div className="vip-welcome-icon-wrapper">
                    <FontAwesomeIcon icon={faCrown} className="vip-welcome-icon" />
                  </div>
                  <Link to="/upgrade-account" className="vip-manage-button">
                    Quản Lý Gói Premium
                  </Link>
                  <div className="vip-welcome-message">
                    Cảm ơn bạn đã ủng hộ! ❤️
                  </div>
                </div>
              </div>
            )}
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
                title="Người đóng góp nhiều nhất"
                data={topUploader}
                icon={<FontAwesomeIcon icon={faUpload} />}
                statLabel="Số tài liệu"
                statValue={topUploader?.value}
              />
            </div>
            <div className="contrib-box">
              <ContributorColumn
                title="Tài liệu được tải nhiều nhất"
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

          <div className="divider-section">
            <span className="divider-text">📚 Về Chúng Tôi 📚</span>
          </div>

          <div className="about-section">
            <h2 className="about-title">Tại Sao Chọn Chúng Tôi?</h2>
            <p className="about-intro">
              Nền tảng chia sẻ tài liệu học tập hàng đầu cho sinh viên và người học tại Việt Nam
            </p>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <FontAwesomeIcon icon={faBook} />
                </div>
                <h3 className="feature-title">Kho Tài Liệu Phong Phú</h3>
                <p className="feature-description">
                  Hàng nghìn tài liệu chất lượng cao từ nhiều lĩnh vực khác nhau, 
                  được cập nhật liên tục bởi cộng đồng.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <h3 className="feature-title">Cộng Đồng Năng Động</h3>
                <p className="feature-description">
                  Kết nối với hàng ngàn người học, chia sẻ kiến thức và 
                  cùng nhau phát triển.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <FontAwesomeIcon icon={faCrown} />
                </div>
                <h3 className="feature-title">Tài Liệu Premium</h3>
                <p className="feature-description">
                  Truy cập tài liệu độc quyền chất lượng cao với gói Premium, 
                  giúp bạn học tập hiệu quả hơn.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <FontAwesomeIcon icon={faRocket} />
                </div>
                <h3 className="feature-title">Dễ Dàng & Nhanh Chóng</h3>
                <p className="feature-description">
                  Tìm kiếm thông minh, tải xuống nhanh chóng, 
                  và quản lý tài liệu một cách dễ dàng.
                </p>
              </div>
            </div>

            {!user && (
              <div className="cta-section">
                <h3 className="cta-title">Sẵn Sàng Bắt Đầu?</h3>
                <p className="cta-description">
                  Tham gia cùng hàng ngàn người học khác và khám phá kho tài liệu phong phú của chúng tôi ngay hôm nay!
                </p>
                <div className="cta-buttons">
                  <Link to="/register" className="btn-cta-primary">
                    <FontAwesomeIcon icon={faUpload} /> Đăng Ký Ngay
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
