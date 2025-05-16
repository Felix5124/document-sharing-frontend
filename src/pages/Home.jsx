import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDocuments } from '../services/api'; // Đảm bảo đường dẫn này đúng
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext'; // Đảm bảo đường dẫn này đúng
import '../css/Home.css';

function Home() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { user: apiUser, loadingAuth } = useContext(AuthContext);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 9;

    const fetchDocuments = useCallback(async (pageToFetch = 1, currentSearchTerm = '') => {
        setLoading(true);
        try {
            const response = await getDocuments({ page: pageToFetch, pageSize: pageSize, keyword: currentSearchTerm });
            const apiResponseData = response.data;

            if (apiResponseData && (apiResponseData.Data || apiResponseData.data)) {
                const documentsArray = apiResponseData.Data?.$values || apiResponseData.Data || apiResponseData.data?.$values || apiResponseData.data || [];
                
                const mappedDocuments = documentsArray.map(doc => ({
                    documentId: doc.documentId || doc.id,
                    title: doc.title || 'Không có tiêu đề',
                    description: doc.description || 'Không có mô tả.',
                    coverImageUrl: doc.coverImageUrl || null, // QUAN TRỌNG: Lấy đường dẫn ảnh từ API
                    uploadedAt: doc.uploadedAt,
                    downloadCount: doc.downloadCount || 0,
                    uploadedByEmail: doc.uploadedByEmail || 'Không xác định',
                    categoryName: doc.categoryName || 'Chưa phân loại',
                }));
                setDocuments(mappedDocuments);

                setTotalItems(apiResponseData.TotalItems || apiResponseData.totalItems || 0);
                setTotalPages(Math.ceil((apiResponseData.TotalItems || apiResponseData.totalItems || 0) / (apiResponseData.PageSize || apiResponseData.pageSize || pageSize)));
                setCurrentPage(apiResponseData.Page || apiResponseData.page || pageToFetch);
            } else {
                setDocuments([]);
                setTotalItems(0);
                setTotalPages(1);
                setCurrentPage(1);
            }
        } catch (error) {
            console.error('Home.jsx - Error fetching documents:', error);
            toast.error('Không thể tải tài liệu. Vui lòng thử lại.');
            setDocuments([]);
            setTotalItems(0);
            setTotalPages(1);
            setCurrentPage(1);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        if (loadingAuth) return;
        if (apiUser && apiUser.isAdmin) {
            navigate('/admin');
            return;
        }
        if (!apiUser?.isAdmin) {
            fetchDocuments(currentPage, searchTerm);
        }
    }, [apiUser, navigate, loadingAuth, fetchDocuments, currentPage, searchTerm]);


    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
            setCurrentPage(newPage);
        }
    };

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    // Dòng console.log này sẽ chỉ chạy một lần khi component render hoặc API_BASE_URL thay đổi (thường là không)
    // Bạn có thể giữ hoặc bỏ nó nếu đã chắc chắn VITE_API_BASE_URL đúng.
    // console.log("VITE_API_BASE_URL_CHECK (outside map):", API_BASE_URL);


    if (loadingAuth) {
        return (
            <div className="loading-container d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                <p className="loading-text ms-3 fs-5">Đang kiểm tra xác thực...</p>
            </div>
        );
    }
    
    if (apiUser && apiUser.isAdmin) {
        return (
             <div className="loading-container d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <p className="loading-text fs-5">Đang chuyển hướng đến trang quản trị...</p>
            </div>
        );
    }
    
    const documentsToDisplay = searchTerm
        ? documents.filter(doc =>
            (doc.title && doc.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (doc.uploadedByEmail && doc.uploadedByEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (doc.categoryName && doc.categoryName.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : documents;

    return (
        <div className="home-container container mt-4 mb-5">
            <div className="header-section d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div className="title-group mb-3 mb-md-0">
                    <h2 className="main-title">Tài liệu học tập</h2>
                    <h4 className="sub-title text-muted">Danh sách tài liệu đã được duyệt</h4>
                </div>
                <div className="search-wrapper input-group" style={{ maxWidth: '400px' }}>
                    <span className="input-group-text"><i className="bi bi-search"></i></span>
                    <input
                        type="text"
                        className="form-control search-input"
                        placeholder="Tìm kiếm tiêu đề, mô tả..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-container text-center my-5">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                    <p className="loading-text mt-2 fs-5">Đang tải tài liệu...</p>
                </div>
            ) : documentsToDisplay.length > 0 ? (
                <>
                    <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                        {documentsToDisplay.map((doc) => {
                            // --- THÊM CONSOLE.LOG Ở ĐÂY ---
                            console.log(`Doc ID [${doc.documentId}] - Original coverImageUrl from API:`, doc.coverImageUrl);

                            let imageUrl = "placeholder_or_default_url"; // Giá trị mặc định nếu không có ảnh
                            if (doc.coverImageUrl && API_BASE_URL) {
                                imageUrl = doc.coverImageUrl.startsWith('http')
                                    ? doc.coverImageUrl
                                    : `${API_BASE_URL}/${doc.coverImageUrl.startsWith('/') ? doc.coverImageUrl.substring(1) : doc.coverImageUrl}`;
                            } else if (doc.coverImageUrl) { // Trường hợp có coverImageUrl nhưng không có API_BASE_URL (ít xảy ra nếu cấu hình đúng)
                                imageUrl = doc.coverImageUrl; // Dùng trực tiếp nếu nó có vẻ là URL tuyệt đối hoặc không có base để ghép
                            }
                            console.log(`Doc ID [${doc.documentId}] - Constructed imageUrl for <img> src:`, imageUrl);
                            // --- KẾT THÚC CONSOLE.LOG ---

                            return (
                                <div key={doc.documentId} className="col d-flex">
                                    <div className="card h-100 shadow-sm document-card-detailed">
                                        {doc.coverImageUrl && API_BASE_URL ? ( // Chỉ render img nếu có coverImageUrl và API_BASE_URL
                                            <Link to={`/document/${doc.documentId}`} className="document-card-image-link">
                                                <img
                                                    src={imageUrl} // Sử dụng imageUrl đã được tạo
                                                    className="card-img-top document-card-image"
                                                    alt={`Bìa tài liệu ${doc.title}`}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        const placeholder = e.target.nextSibling;
                                                        if(placeholder && placeholder.classList.contains('document-card-image-placeholder')){
                                                            placeholder.style.display = 'flex';
                                                        } else {
                                                            const parentLink = e.target.parentElement;
                                                            if (parentLink) {
                                                                const actualPlaceholder = parentLink.querySelector('.document-card-image-placeholder');
                                                                if (actualPlaceholder) actualPlaceholder.style.display = 'flex';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <div className="card-img-top document-card-image document-card-image-placeholder" style={{display: 'none'}}>
                                                    <i className="bi bi-book fs-1 text-muted"></i>
                                                </div>
                                            </Link>
                                        ) : ( // Fallback nếu không có coverImageUrl hoặc API_BASE_URL
                                            <Link to={`/document/${doc.documentId}`} className="document-card-image-link">
                                                <div className="card-img-top document-card-image document-card-image-placeholder" style={{display: 'flex'}}>
                                                    <i className="bi bi-book fs-1 text-muted"></i>
                                                </div>
                                            </Link>
                                        )}
                                        <div className="card-body d-flex flex-column">
                                            <h5 className="card-title document-card-title text-primary fw-bold" title={doc.title}>
                                                <Link to={`/document/${doc.documentId}`} className="text-decoration-none text-primary">
                                                    {doc.title}
                                                </Link>
                                            </h5>
                                            <p className="card-text document-card-description small text-muted flex-grow-1">
                                                {doc.description}
                                            </p>
                                            <div className="card-meta mt-auto pt-2 border-top">
                                                <small className="text-muted d-block mb-1" title={`Người tải: ${doc.uploadedByEmail}`}>
                                                    <i className="bi bi-person-circle me-1"></i>
                                                    <span className="text-truncate d-inline-block" style={{maxWidth: '150px'}}>{doc.uploadedByEmail}</span>
                                                </small>
                                                <small className="text-muted d-block mb-1" title={`Thể loại: ${doc.categoryName}`}>
                                                    <i className="bi bi-bookmark-star me-1"></i>
                                                    {doc.categoryName}
                                                </small>
                                                <small className="text-muted d-block mb-1">
                                                    <i className="bi bi-calendar3 me-1"></i>
                                                    {new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}
                                                </small>
                                                <small className="text-muted d-block">
                                                    <i className="bi bi-download me-1"></i>
                                                    {doc.downloadCount} lượt tải
                                                </small>
                                            </div>
                                            <Link to={`/document/${doc.documentId}`} className="btn btn-outline-primary btn-sm mt-3 w-100">
                                                Xem chi tiết
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <nav aria-label="Page navigation" className="mt-5 d-flex justify-content-center">
                            <ul className="pagination">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                                        <i className="bi bi-chevron-left"></i> Trước
                                    </button>
                                </li>
                                {[...Array(totalPages).keys()].map(num => {
                                    const pageNum = num + 1;
                                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                        return (
                                            <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => handlePageChange(pageNum)}>
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    }
                                    if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                        return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                                    }
                                    return null;
                                })}
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                                        Sau <i className="bi bi-chevron-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                     <p className="text-center text-muted mt-3">Trang {currentPage}/{totalPages} (Tổng số {totalItems} tài liệu)</p>
                </>
            ) : (
                <div className="empty-state text-center my-5 py-5">
                    <i className="bi bi-cloud-slash display-1 text-muted"></i>
                     <p className="mt-3 fs-5">
                        {searchTerm ? `Không tìm thấy tài liệu nào cho "${searchTerm}".` : "Chưa có tài liệu nào."}
                    </p>
                    {searchTerm && <p className="text-muted">Hãy thử với từ khóa khác.</p>}
                </div>
            )}
        </div>
    );
}

export default Home;