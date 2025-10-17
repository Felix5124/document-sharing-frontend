import { Document, Page, pdfjs } from 'react-pdf';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getDocumentById,
  getCommentsByDocument,
  downloadDocument,
  previewDocument,
  follow,
  getUserFollowing,
  addComment,
  getRelatedDocumentsByTags,
  getRelatedDocuments
} from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useEffect, useState, useContext } from 'react';
import { getFullImageUrl } from '../utils/imageUtils';
import '../styles/pages/DocumentDetail.css';

// ... (Các phần code không đổi từ workerUrl đến FormControl giữ nguyên) ...
let workerUrl;
try {
  workerUrl = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
} catch (e) {
  workerUrl = '/pdf.worker.min.js';
}
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0 || i >= sizes.length) return '0 Bytes';
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const StarRatingDisplay = ({ rating, totalReviews }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (halfStar ? 1 : 0));

  return (
    <span className="star-rating-display">
      {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`} className="star-icon star-filled"></span>)}
      {halfStar && <span className="star-icon star-half"></span>}
      {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} className="star-icon star-empty"></span>)}
      {totalReviews > 0 && <span className="rating-value">{rating}/5</span>}
    </span>
  );
};

const StarRatingInput = ({ rating, onChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="star-rating-input">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <span
            key={starValue}
            className={`star-icon ${(hoverRating || rating) >= starValue ? 'star-filled' : 'star-empty'}`}
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
          ></span>
        );
      })}
      <span className="rating-text">{rating} sao</span>
    </div>
  );
};

// Custom Modal Component
const CustomModal = ({ show, onHide, title, children, footer }) => {
  if (!show) return null;

  return (
    <div className="custom-modal-overlay" onClick={onHide}>
      <div className="custom-modal" onClick={e => e.stopPropagation()}>
        <div className="custom-modal-header">
          <h5 className="custom-modal-title">{title}</h5>
          <button type="button" className="custom-modal-close" onClick={onHide}>&times;</button>
        </div>
        <div className="custom-modal-body">
          {children}
        </div>
        {footer && (
          <div className="custom-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Custom Button Component
const CustomButton = ({ variant = "primary", size, onClick, disabled, type, children, className = "" }) => {
  const btnClass = `custom-btn btn-${variant}${size ? ` btn-${size}` : ""} ${className}`;
  return (
    <button
      className={btnClass}
      onClick={onClick}
      disabled={disabled}
      type={type || "button"}
    >
      {children}
    </button>
  );
};

// Custom Form Components
const CustomForm = ({ onSubmit, className = "", children }) => {
  return (
    <form onSubmit={onSubmit} className={`custom-form ${className}`}>
      {children}
    </form>
  );
};

const FormGroup = ({ className = "", children }) => {
  return <div className={`form-group ${className}`}>{children}</div>;
};

const FormLabel = ({ htmlFor, children }) => {
  return <label className="form-label" htmlFor={htmlFor}>{children}</label>;
};

const FormControl = ({ as, id, value, onChange, placeholder, rows }) => {
  if (as === "textarea") {
    return (
      <textarea
        className="form-control"
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows || 3}
      />
    );
  }

  return (
    <input
      className="form-control"
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
};


function DocumentDetail() {
  // ... (Toàn bộ hooks và functions xử lý logic giữ nguyên, không thay đổi) ...
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [doc, setDoc] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState({ Content: '', Rating: 5 });
  const [pdfData, setPdfData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [numPages, setNumPages] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatedComments, setTotalRatedComments] = useState(0);
  const [relatedDocsByCategory, setRelatedDocsByCategory] = useState([]);
  const [relatedDocsByTag, setRelatedDocsByTag] = useState([]);


  useEffect(() => {
    setDoc(null);
    setComments([]);
    setPdfData(null);
    setRelatedDocsByCategory([]);
    setRelatedDocsByTag([]);
    setIsDescriptionExpanded(false);
    setAverageRating(0);
    setTotalRatedComments(0);
    setIsFollowing(false);
    fetchDocument();
    fetchComments();
  }, [id]);

  useEffect(() => {
    if (user && user.userId && doc?.uploadedBy) {
      checkFollowStatus();
    }
  }, [user, doc]);

  useEffect(() => {
    if (comments && comments.length > 0) {
      const validCommentsWithRating = comments.filter(c => c.Rating != null && !isNaN(parseInt(c.Rating)) && c.Rating > 0);
      if (validCommentsWithRating.length > 0) {
        const sum = validCommentsWithRating.reduce((acc, curr) => acc + parseInt(curr.Rating), 0);
        setAverageRating(parseFloat((sum / validCommentsWithRating.length).toFixed(1)));
        setTotalRatedComments(validCommentsWithRating.length);
      } else {
        setAverageRating(0);
        setTotalRatedComments(0);
      }
    } else {
      setAverageRating(0);
      setTotalRatedComments(0);
    }
  }, [comments]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (doc && doc.documentId) {
        if (doc.categoryId) {
          try {
            const responseCategory = await getRelatedDocuments(doc.documentId, 4);
            let dataArrayCategory = responseCategory.data?.$values || responseCategory.data || [];
            setRelatedDocsByCategory(Array.isArray(dataArrayCategory) ? dataArrayCategory : []);
          } catch {
            setRelatedDocsByCategory([]);
          }
        }

        if (doc.tags && doc.tags.length > 0) {
          const tagNames = doc.tags.map(t => t.name);
          try {
            const responseTags = await getRelatedDocumentsByTags(tagNames, doc.documentId, 4);
            let dataArrayTags = responseTags.data?.$values || responseTags.data || [];
            setRelatedDocsByTag(Array.isArray(dataArrayTags) ? dataArrayTags : []);
          } catch {
            setRelatedDocsByTag([]);
          }
        } else {
          setRelatedDocsByTag([]);
        }
      }
    };

    if (doc) {
      fetchRelated();
    }
  }, [doc]);



  const fetchDocument = async () => {
    try {
      const response = await getDocumentById(id);
      setDoc(response.data);
    } catch {
      setErrorMessage('Không thể tải thông tin tài liệu. Tài liệu có thể không tồn tại hoặc đã bị xóa.');
      setShowErrorModal(true);
      setDoc(null);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await getCommentsByDocument(id);
      let data = response.data;
      if (data && Array.isArray(data.$values)) {
        data = data.$values;
      } else if (!Array.isArray(data)) {
        data = [];
      }
      const fetchedComments = data.map((item) => ({
        CommentId: item.commentId,
        Content: item.content,
        Rating: item.rating != null ? parseInt(item.rating) : 0,
        CreatedAt: item.createdAt,
        UserId: item.userId,
        UserEmail: item.userEmail || 'Ẩn danh',
      }));
      setComments(fetchedComments);
    } catch {
      setComments([]);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !user.userId || !doc || !doc.uploadedBy) return;
    try {
      const response = await getUserFollowing(user.userId);
      const follows = Array.isArray(response.data?.$values) ? response.data.$values : (Array.isArray(response.data) ? response.data : []);
      const isAlreadyFollowing = follows.some(follow => follow.followedUserId === doc.uploadedBy);
      setIsFollowing(isAlreadyFollowing);
    } catch {
      // Ignore follow status check errors
    }
  };

  const handleDownload = () => {
    if (!user || !user.userId) {
      setErrorMessage('Vui lòng đăng nhập để tải tài liệu.');
      setShowErrorModal(true);
      return;
    }
    const userPoints = user.points || 0;
    if (doc.pointsRequired > 0 && userPoints < doc.pointsRequired) {
      setErrorMessage(`Bạn không đủ điểm để tải tài liệu. Cần ${doc.pointsRequired} điểm, bạn hiện có ${userPoints} điểm.`);
      setShowErrorModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  const performDownload = async () => {
    try {
      const response = await downloadDocument(id, user.userId);
      const blob = new Blob([response.data], { type: `application/${doc.fileType || 'octet-stream'}` });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${doc.title || 'document'}.${doc.fileType || 'bin'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDoc((prevDoc) => ({
        ...prevDoc,
        downloadCount: (prevDoc.downloadCount || 0) + 1,
      }));
    } catch (error) {
      let message = 'Đã xảy ra lỗi khi tải tài liệu.';
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const parsed = JSON.parse(text);
          message = parsed.message || text || message;
        } catch {
          message = text || message;
        }
      } else if (error.response?.data) {
        message = error.response.data.message || error.response.data.toString() || message;
      }
      setErrorMessage(message);
      setShowErrorModal(true);
    }
  };

  const handleConfirmDownload = () => {
    setShowConfirmModal(false);
    performDownload();
  };
  const handleCancelDownload = () => setShowConfirmModal(false);
  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  const handlePreview = async () => {
    if (doc.fileType?.toLowerCase() !== 'pdf') {
      setErrorMessage('Chức năng xem trước chỉ hỗ trợ file PDF.');
      setShowErrorModal(true);
      setPdfData(null);
      return;
    }
    if (pdfData) {
      setPdfData(null);
      if (pdfData) window.URL.revokeObjectURL(pdfData);
      return;
    }
    try {
      const response = await previewDocument(id, { responseType: 'arraybuffer' });
      if (response.data instanceof ArrayBuffer) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        setPdfData(url);
      } else {
        const text = new TextDecoder().decode(response.data);
        const json = JSON.parse(text);
        setErrorMessage(json.Message || 'Không thể xem trước: Định dạng response không hợp lệ.');
        setShowErrorModal(true);
        setPdfData(null);
      }
    } catch (error) {
      let msg = 'Không thể xem trước tài liệu.';
      if (error.response && error.response.data) {
        try {
          if (error.response.data instanceof ArrayBuffer) {
            const decodedError = new TextDecoder().decode(error.response.data);
            if (decodedError.trim().startsWith('{')) {
              const jsonError = JSON.parse(decodedError);
              msg = jsonError.Message || jsonError.message || msg;
            } else {
              msg = decodedError.substring(0, 200) + "...";
            }
          } else if (typeof error.response.data === 'object' && error.response.data.Message) {
            msg = error.response.data.Message;
          } else if (typeof error.response.data === 'string') {
            msg = error.response.data;
          }
        } catch {
          // Ignore JSON parsing errors for error response
        }
      } else if (error.message) {
        msg = error.message;
      }
      setErrorMessage(msg);
      setShowErrorModal(true);
      setPdfData(null);
    }
  };

  const handleClosePreview = () => {
    setPdfData(null);
    if (pdfData) window.URL.revokeObjectURL(pdfData);
  };

  const toggleDescription = () => setIsDescriptionExpanded(!isDescriptionExpanded);

  const handleFollowAuthor = async () => {
    if (!user || !user.userId) {
      setErrorMessage('Vui lòng đăng nhập để theo dõi tác giả.');
      setShowErrorModal(true);
      return;
    }
    if (!doc?.uploadedBy) {
      setErrorMessage('Không tìm thấy thông tin tác giả.');
      setShowErrorModal(true);
      return;
    }
    setLoadingFollow(true);
    try {
      const followData = { UserId: user.userId, FollowedUserId: doc.uploadedBy };
      await follow(followData);
      const currentlyFollowing = isFollowing;
      setIsFollowing(!currentlyFollowing);
      toast.success(!currentlyFollowing ? 'Đã theo dõi tác giả.' : 'Đã hủy theo dõi tác giả.');
    } catch (error) {
      const errData = error.response?.data;
      let msg = 'Không thể thực hiện hành động theo dõi.';
      if (typeof errData === 'string') msg = errData;
      else if (errData?.detail) msg = errData.detail;
      else if (errData?.message) msg = errData.message;
      setErrorMessage(msg);
      setShowErrorModal(true);
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.userId) {
      toast.error('Vui lòng đăng nhập để bình luận.');
      navigate('/login');
      return;
    }
    if (!comment.Content.trim()) {
      toast.error('Nội dung bình luận không được để trống.');
      return;
    }
    try {
      const commentData = {
        DocumentId: parseInt(id),
        Content: comment.Content,
        Rating: comment.Rating,
        UserId: user.userId,
      };
      await addComment(commentData);
      toast.success('Bình luận đã được gửi.');
      setComment({ Content: '', Rating: 5 });
      fetchComments();
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data || 'Không thể gửi bình luận.');
    }
  };

  const onDocumentLoadSuccess = ({ numPages: loadedNumPages }) => {
    setNumPages(loadedNumPages);
  };

  if (!doc) return <div className="loading-container"><h4>Đang tải...</h4><div className="loading-spinner" role="status"></div></div>;

  const MAX_INITIAL_LINES = 3;
  const MAX_CHARS_WHEN_FEW_LINES = 220;
  let finalDisplayDescription;
  let shouldShowReadMoreButton = false;

  if (doc.description && typeof doc.description === 'string' && doc.description.trim() !== '') {
    const lines = doc.description.split('\n');
    let needsCollapsingFeature = false;
    if (lines.length > MAX_INITIAL_LINES) {
      needsCollapsingFeature = true;
    } else if (doc.description.length > MAX_CHARS_WHEN_FEW_LINES) {
      needsCollapsingFeature = true;
    }
    if (needsCollapsingFeature) {
      shouldShowReadMoreButton = true;
      if (isDescriptionExpanded) {
        finalDisplayDescription = doc.description;
      } else {
        if (lines.length > MAX_INITIAL_LINES) {
          finalDisplayDescription = lines.slice(0, MAX_INITIAL_LINES).join('\n') + '...';
        } else {
          finalDisplayDescription = doc.description.substring(0, MAX_CHARS_WHEN_FEW_LINES) + '...';
        }
      }
    } else {
      finalDisplayDescription = doc.description;
      shouldShowReadMoreButton = false;
    }
  } else {
    finalDisplayDescription = "Không có mô tả.";
    shouldShowReadMoreButton = false;
  }
  
  return (
    <div className="document-detail-page">
      <div className="document-detail-container">
        {/* === MAIN LAYOUT GRID: Image/Preview and Info === */}
        <div className="layout-grid top-section">

          {/* === LEFT COLUMN: Cover Image & Actions === */}
          <div className="layout-column left-column">
            <div className="document-cover-container">
              <div className="document-cover-section">
                <div className="cover-image-wrapper">
                  <img
                    src={getFullImageUrl(doc.coverImageUrl)}
                    alt={doc.title}
                    className="document-cover-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getFullImageUrl(null);
                    }}
                  />
                  <div className="cover-image-overlay">
                    <div className="document-type-badge">
                      {doc.fileType ? doc.fileType.toUpperCase() : 'FILE'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="action-buttons-section">
                <div className="action-buttons-grid">
                  <CustomButton
                    variant="outline-secondary"
                    onClick={handleDownload}
                    className="action-btn download-btn"
                  >
                    <span className="icon-download"></span>
                    <div className="btn-content">
                      <span className="btn-text">Tải xuống</span>
                      <span className="file-info">{formatFileSize(doc.fileSize || 0)}</span>
                    </div>
                  </CustomButton>

                  <CustomButton
                    variant="primary"
                    onClick={handlePreview}
                    disabled={doc.fileType?.toLowerCase() !== 'pdf'}
                    className="action-btn preview-btn"
                  >
                    <span className="icon-eye"></span>
                    <span className="btn-text">Xem Online (PDF)</span>
                  </CustomButton>
                </div>

                {doc.pointsRequired > 0 && (
                  <div className="points-required-banner">
                    <span className="icon-coin"></span>
                    Cần {doc.pointsRequired} điểm để tải
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* === RIGHT COLUMN: PDF Preview === */}
          <div className="layout-column right-column preview-wrapper">
            {pdfData ? (
              <div className="document-preview-section">
                <div className="preview-header">
                  <div className="preview-title">
                    <span className="icon-eye"></span>
                    <h5>Xem trước tài liệu (cuộn để xem)</h5>
                  </div>
                  <CustomButton variant="outline-danger" size="sm" onClick={handleClosePreview} className="preview-close-btn">
                    <span className="icon-x-lg"></span>
                    <span>Đóng</span>
                  </CustomButton>
                </div>
                <div className="preview-container">
                  {/* === THAY ĐỔI Ở ĐÂY === */}
                  <Document file={pdfData} onLoadSuccess={onDocumentLoadSuccess} loading="Đang tải bản xem trước...">
                    <div className="pdf-pages-container">
                      {/* Lặp qua để render tối đa 2 trang, cho phép cuộn bên trong */}
                      {numPages && Array.from(new Array(Math.min(numPages, 2)), (el, index) => (
                          <Page
                            key={`page_${index + 1}`}
                            pageNumber={index + 1}
                            width={570}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="pdf-page"
                          />
                      ))}
                    </div>
                    {!numPages && <div className="preview-loading">Không thể tải trang.</div>}
                  </Document>
                  {/* === KẾT THÚC THAY ĐỔI === */}
                </div>
              </div>
            ) : (
              <div className="preview-placeholder">
                <div className="preview-placeholder-content">
                  <div className="preview-placeholder-icon">
                    <span className="icon-eye"></span>
                  </div>
                  <h6>Chức năng xem trước PDF</h6>
                  <p>Khi bạn nhấn nút "Xem Online (PDF)", tài liệu sẽ hiển thị ở đây</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* === MAIN CONTENT SECTION === */}
        <div className="layout-grid main-content-section">
          <div className="layout-column full-width">
            <div className="document-header-section">
              <div className="document-title-row">
                <div className="document-title-wrapper">
                  <h1 className="detail-document-title">{doc.title}</h1>
                </div>
                {doc.school?.logoUrl && (
                  <div className="school-logo-container">
                    <img
                      src={getFullImageUrl(doc.school.logoUrl)}
                      alt={doc.school.name || 'School Logo'}
                      className="school-logo"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getFullImageUrl('default-school-logo.png');
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="document-meta-row">
                <div className="author-info">
                  <span className="author-label">Tác giả:</span>
                  <span className="author-name">{doc.email || 'Ẩn danh'}</span>
                  {user && user.userId !== doc.uploadedBy && doc.uploadedBy && (
                    <CustomButton
                      variant={isFollowing ? "success" : "outline-success"}
                      size="sm"
                      onClick={handleFollowAuthor}
                      disabled={loadingFollow}
                      className="follow-btn"
                    >
                      <span className={`follow-icon ${isFollowing ? 'icon-person-check' : 'icon-person-plus'}`}></span>
                      {isFollowing ? 'Đã theo dõi' : loadingFollow ? 'Đang xử lý...' : 'Theo dõi'}
                    </CustomButton>
                  )}
                </div>
              </div>

              <div className="document-stats-row">
                <div className="stats-item">
                  {totalRatedComments > 0 ? (
                    <div className="rating-display">
                      <StarRatingDisplay rating={averageRating} totalReviews={totalRatedComments} />
                      <span className="rating-text">({totalRatedComments} đánh giá)</span>
                    </div>
                  ) : (
                    <span className="no-rating">Chưa có đánh giá</span>
                  )}
                </div>
                <div className="stats-separator">|</div>
                <div className="stats-item">
                  <span className="icon-chat-left-text"></span>
                  <span>{comments.length} bình luận</span>
                </div>
                <div className="stats-separator">|</div>
                <div className="stats-item">
                  <span className="icon-files"></span>
                  <span>{doc.fileType ? doc.fileType.toUpperCase() : 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="document-description-section">
              <div className="description-header">
                <span className="description-label">Mô tả:</span>
              </div>
              <div className="description-content">
                <div className="description-text">
                  {finalDisplayDescription}
                </div>
                {shouldShowReadMoreButton && (
                  <CustomButton
                    variant="link"
                    size="sm"
                    onClick={toggleDescription}
                    className="read-more-btn"
                  >
                    {isDescriptionExpanded ? 'Thu gọn' : 'Đọc thêm'}
                  </CustomButton>
                )}
              </div>
            </div>
            
            <div className="document-details-card">
              <div className="details-header">
                <h3>Thông tin chi tiết</h3>
              </div>
              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-icon">
                    <span className="icon-folder"></span>
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Danh mục</div>
                    <div className="detail-value">{doc.category?.name || 'Không có'}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <span className="icon-file-earmark"></span>
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Loại file</div>
                    <div className="detail-value">{doc.fileType?.toUpperCase() || 'N/A'}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <span className="icon-database"></span>
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Kích thước</div>
                    <div className="detail-value">{formatFileSize(doc.fileSize || 0)}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <span className="icon-calendar"></span>
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Năm tải lên</div>
                    <div className="detail-value">{doc.uploadedAt ? new Date(doc.uploadedAt).getFullYear() : 'N/A'}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <span className="icon-download"></span>
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Lượt tải</div>
                    <div className="detail-value">{doc.downloadCount || 0}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <span className="icon-coin"></span>
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Điểm yêu cầu</div>
                    <div className="detail-value">{doc.pointsRequired || 0}</div>
                  </div>
                </div>
              </div>

              {doc.tags && doc.tags.length > 0 && (
                <div className="tags-section">
                  <div className="tags-label">Tags:</div>
                  <div className="tags-container">
                    {doc.tags.map(tag => (
                      <Link
                        key={tag.tagId || tag.name}
                        to={`/search?tags=${encodeURIComponent(tag.name)}`}
                        className="tag-item"
                        title={`Tìm tài liệu với tag "${tag.name}"`}
                      >
                        <span className="icon-tag-fill"></span>
                        <span className="tag-text">{tag.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* ... Các section Tài liệu liên quan và Bình luận ... */}
            {relatedDocsByTag && relatedDocsByTag.length > 0 && (
              <div className="related-documents-section">
                  <div className="section-header">
                      <div className="section-icon">
                          <span className="icon-tags-fill"></span>
                      </div>
                      <h3 className="section-title">Các tài liệu liên quan</h3>
                      <div className="section-subtitle">Tài liệu cùng chủ đề và tags</div>
                  </div>

                  <div className="related-documents-grid">
                      {relatedDocsByTag.map(relatedDoc => (
                          <div key={`tag-${relatedDoc.documentId}`} className="related-document-card">
                              <Link to={`/document/${relatedDoc.documentId}`} className="card-link">
                                  <div className="card-image-container">
                                      <img
                                          src={getFullImageUrl(relatedDoc.coverImageUrl)}
                                          className="card-image"
                                          alt={relatedDoc.title}
                                          onError={(e) => {
                                              e.target.onerror = null;
                                              e.target.src = getFullImageUrl(null);
                                          }}
                                      />
                                      <div className="card-overlay">
                                          <div className="overlay-icon">
                                              <span className="icon-arrow-right"></span>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="card-content">
                                      <h6 className="card-title" title={relatedDoc.title}>
                                          {relatedDoc.title.length > 45 ? relatedDoc.title.substring(0, 45) + '...' : relatedDoc.title}
                                      </h6>
                                      {relatedDoc.uploaderFullName && (
                                          <div className="card-author">
                                              <span className="icon-person"></span>
                                              <span className="author-name">{relatedDoc.uploaderFullName}</span>
                                          </div>
                                      )}
                                  </div>
                              </Link>
                          </div>
                      ))}
                  </div>
              </div>
            )}
            
            {relatedDocsByCategory && relatedDocsByCategory.length > 0 && (
                <div className="related-documents-section">
                    <div className="section-divider"></div>
                    <div className="section-header">
                        <div className="section-icon">
                            <span className="icon-files"></span>
                        </div>
                        <h3 className="section-title">Có thể bạn quan tâm</h3>
                        <div className="section-subtitle">Tài liệu cùng danh mục</div>
                    </div>

                    <div className="related-documents-grid">
                        {relatedDocsByCategory.map(relatedDoc => (
                            <div key={relatedDoc.documentId} className="related-document-card">
                                <Link to={`/document/${relatedDoc.documentId}`} className="card-link">
                                    <div className="card-image-container">
                                        <img
                                            src={getFullImageUrl(relatedDoc.coverImageUrl)}
                                            className="card-image"
                                            alt={relatedDoc.title}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = getFullImageUrl(null);
                                            }}
                                        />
                                        <div className="card-overlay">
                                            <div className="overlay-icon">
                                                <span className="icon-arrow-right"></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-content">
                                        <h6 className="card-title" title={relatedDoc.title}>
                                            {relatedDoc.title.length > 40 ? relatedDoc.title.substring(0, 40) + '...' : relatedDoc.title}
                                        </h6>
                                        {relatedDoc.uploadedByEmail && (
                                            <div className="card-author">
                                                <span className="icon-person"></span>
                                                <span className="author-name">{relatedDoc.uploadedByEmail}</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="comments-section">
                <div className="comments-header">
                    <div className="comments-title">
                        <span className="icon-chat-left-text"></span>
                        <h3>Bình luận và đánh giá</h3>
                        <span className="comments-count">({comments.length})</span>
                    </div>
                </div>

                <div className="comment-form-card">
                    <div className="comment-form-header">
                        <h5>Chia sẻ đánh giá của bạn</h5>
                    </div>
                    <CustomForm onSubmit={handleCommentSubmit} className="comment-form">
                        <div className="comment-form-row">
                            <div className="comment-form-column">
                                <FormGroup className="comment-form-group">
                                    <FormLabel htmlFor="commentContent">Nội dung bình luận</FormLabel>
                                    <FormControl
                                        as="textarea"
                                        id="commentContent"
                                        rows={4}
                                        value={comment.Content}
                                        onChange={(e) => setComment({ ...comment, Content: e.target.value })}
                                        placeholder={user ? "Chia sẻ ý kiến và đánh giá của bạn về tài liệu này..." : "Vui lòng đăng nhập để bình luận"}
                                        disabled={!user}
                                        className="comment-textarea"
                                    />
                                </FormGroup>
                            </div>
                        </div>

                        <div className="comment-form-row">
                            <div className="comment-form-column">
                                <FormGroup className="comment-form-group rating-group">
                                    <FormLabel>Đánh giá (sao)</FormLabel>
                                    <div className="rating-input-wrapper">
                                        <StarRatingInput
                                            rating={comment.Rating}
                                            onChange={(rating) => setComment({ ...comment, Rating: rating })}
                                        />
                                    </div>
                                </FormGroup>
                            </div>
                        </div>

                        <div className="form-actions">
                            <CustomButton
                                type="submit"
                                variant="primary"
                                disabled={!user || !comment.Content.trim()}
                                className="submit-comment-btn"
                            >
                                <span className="icon-send"></span>
                                <span>Gửi bình luận</span>
                            </CustomButton>
                        </div>
                    </CustomForm>
                </div>
                
                <div className="comments-display">
                    {comments.length > 0 ? (
                        <div className="comments-container">
                            {comments.slice(0, pdfData ? 1 : 5).map((cmt) => (
                                <div key={cmt.CommentId || cmt.UserId + cmt.CreatedAt} className="comment-card">
                                    <div className="comment-header">
                                        <div className="comment-author">
                                            <div className="author-avatar">
                                                <span className="icon-person-circle"></span>
                                            </div>
                                            <div className="author-info-comment">
                                                <div className="author-name-comment">{cmt.UserEmail}</div>
                                                <div className="comment-date">
                                                    {cmt.CreatedAt ? new Date(cmt.CreatedAt).toLocaleString('vi-VN') : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="comment-content">
                                        <div className="comment-text">
                                            {cmt.Content}
                                        </div>
                                        {cmt.Rating > 0 && (
                                            <div className="comment-rating">
                                                <div className="rating-label">Đánh giá:</div>
                                                <StarRatingDisplay rating={cmt.Rating} totalReviews={1} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {comments.length > (pdfData ? 1 : 5) && (
                                <div className="view-more-comments">
                                    <CustomButton
                                        variant="outline-secondary"
                                        size="sm"
                                        onClick={() => navigate(`/postcommentdetail/${id}`)}
                                        className="view-all-btn"
                                    >
                                        <span className="icon-plus-circle"></span>
                                        <span>Xem tất cả {comments.length} bình luận</span>
                                    </CustomButton>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="no-comments">
                            <div className="no-comments-icon">
                                <span className="icon-chat-left-text"></span>
                            </div>
                            <div className="no-comments-text">
                                <h5>Chưa có bình luận nào</h5>
                                <p>Hãy là người đầu tiên chia sẻ đánh giá về tài liệu này!</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

          </div>
        </div>
      </div>

      <CustomModal
        show={showConfirmModal}
        onHide={handleCancelDownload}
        title="Xác nhận tải tài liệu"
        footer={<>
          <CustomButton variant="secondary" onClick={handleCancelDownload}>Hủy</CustomButton>
          <CustomButton variant="primary" onClick={handleConfirmDownload}>Xác nhận</CustomButton>
        </>}
      >
        Bạn có muốn dùng {doc?.pointsRequired || 0} điểm để tải tài liệu này không?
      </CustomModal>

      <CustomModal
        show={showErrorModal}
        onHide={handleCloseErrorModal}
        title="Thông báo lỗi"
        footer={<CustomButton variant="primary" onClick={handleCloseErrorModal}>Đóng</CustomButton>}
      >
        {errorMessage}
      </CustomModal>
    </div>
  );
}


export default DocumentDetail;