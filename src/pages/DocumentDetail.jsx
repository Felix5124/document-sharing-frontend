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
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useEffect, useState, useContext } from 'react';
import { getFullImageUrl } from '../utils/imageUtils';

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
    <span className="d-inline-flex align-items-center">
      {[...Array(fullStars)].map((_, i) => <i key={`full-${i}`} className="bi bi-star-fill text-warning"></i>)}
      {halfStar && <i className="bi bi-star-half text-warning"></i>}
      {[...Array(emptyStars)].map((_, i) => <i key={`empty-${i}`} className="bi bi-star text-warning"></i>)}
      {totalReviews > 0 && <span className="ms-2">{rating}/5</span>}
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
          <i
            key={starValue}
            className={`bi bi-star${(hoverRating || rating) >= starValue ? '-fill' : ''} text-warning`}
            style={{ cursor: 'pointer', fontSize: '1.2rem', marginRight: '4px' }}
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
          ></i>
        );
      })}
      <span className="ms-2">{rating} sao</span>
    </div>
  );
};

function DocumentDetail() {
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
          } catch (error) {
            setRelatedDocsByCategory([]);
          }
        }

        if (doc.tags && doc.tags.length > 0) {
          const tagNames = doc.tags.map(t => t.name);
          try {
            const responseTags = await getRelatedDocumentsByTags(tagNames, doc.documentId, 4);
            let dataArrayTags = responseTags.data?.$values || responseTags.data || [];
            setRelatedDocsByTag(Array.isArray(dataArrayTags) ? dataArrayTags : []);
          } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
        } catch (parseError) {
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
        } catch (e) {
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

  if (!doc) return <div className="container text-center py-5"><h4>Đang tải...</h4><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;

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
    <div className="container my-4 document-detail-page">
      <div className="row">
        <div className="col-lg-4 mb-4">
          <img
            src={getFullImageUrl(doc.coverImageUrl)}
            alt={doc.title}
            className="img-fluid rounded shadow-sm mb-3 w-100"
            style={{ maxHeight: '500px', objectFit: 'contain', border: '1px solid #eee' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = getFullImageUrl(null);
            }}
          />
          <div className="d-grid gap-2">
            <Button variant="primary" onClick={handlePreview} disabled={doc.fileType?.toLowerCase() !== 'pdf' && !pdfData}>
              <i className="bi bi-eye me-2"></i> {pdfData ? "Đóng Xem Trước" : "Xem Online (PDF)"}
            </Button>
            <Button variant="outline-secondary" onClick={handleDownload}>
              <i className="bi bi-download me-2"></i>
              {doc.fileType ? doc.fileType.toUpperCase() : 'Tải File'}, {formatFileSize(doc.fileSize || 0)}
            </Button>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="d-flex align-items-center mb-1">
            <h1 className="h2 mb-0" style={{ flex: 1 }}>{doc.title}</h1>
            {doc.school?.logoUrl && (
              <img
                src={getFullImageUrl(doc.school.logoUrl)}
                alt={doc.school.name || 'School Logo'}
                className="school-logo"
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid white',
                  backgroundColor: 'white',
                  marginLeft: '10px',
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getFullImageUrl('default-school-logo.png');
                }}
              />
            )}
          </div>
          <div className="mb-3 text-muted">
            <span>Tác giả: {doc.email || 'Ẩn danh'}</span>
            {user && user.userId !== doc.uploadedBy && doc.uploadedBy && (
              <Button
                variant={isFollowing ? "success" : "outline-success"}
                size="sm"
                onClick={handleFollowAuthor}
                disabled={loadingFollow}
                className="ms-3"
              >
                <i className={`bi ${isFollowing ? 'bi-person-check-fill' : 'bi-person-plus'} me-1`}></i>
                {isFollowing ? 'Đã theo dõi' : loadingFollow ? 'Đang xử lý...' : 'Theo dõi'}
              </Button>
            )}
          </div>

          <div className="mb-3 d-flex align-items-center" style={{ gap: '0.5rem' }}>
            {totalRatedComments > 0 ? <StarRatingDisplay rating={averageRating} totalReviews={totalRatedComments} /> : <span>Chưa có đánh giá</span>}
            <span className="text-muted">|</span>
            <span className="text-muted">{comments.length} bình luận</span>
            {doc.fileType && <><span className="text-muted">|</span> <span className="text-muted">Định dạng: {doc.fileType.toUpperCase()}</span></>}
          </div>

          <p className="text-muted mb-1">Mô tả:</p>
          <div style={{ whiteSpace: 'pre-line', overflowWrap: 'break-word' }}>
            {finalDisplayDescription}
            {shouldShowReadMoreButton && (
              <Button
                variant="link"
                size="sm"
                onClick={toggleDescription}
                className="p-0 ms-1 d-inline"
              >
                {isDescriptionExpanded ? 'Thu gọn' : 'Đọc thêm'}
              </Button>
            )}
          </div>
          <hr />
          <div className="document-meta mb-3">
            <p className="mb-1"><strong>Danh mục:</strong> {doc.category?.name || 'Không có'}</p>
            <p className="mb-1"><strong>Loại file:</strong> {doc.fileType?.toUpperCase() || 'N/A'}, {formatFileSize(doc.fileSize || 0)}</p>
            {doc.uploadedAt && <p className="mb-1"><strong>Năm xuất bản/tải lên:</strong> {new Date(doc.uploadedAt).getFullYear()}</p>}
            <p className="mb-1"><strong>Lượt tải:</strong> {doc.downloadCount || 0}</p>
            <p className="mb-1"><strong>Điểm yêu cầu:</strong> {doc.pointsRequired || 0}</p>
            {doc.tags && doc.tags.length > 0 && (
              <div className="mb-2">
                <strong>Tags: </strong>
                {doc.tags.map(tag => (
                  <Link
                    key={tag.tagId || tag.name}
                    to={`/search?tags=${encodeURIComponent(tag.name)}`}
                    className="badge bg-primary me-1 mb-1 text-decoration-none"
                    style={{ cursor: 'pointer', fontSize: '0.85em' }}
                    title={`Tìm tài liệu với tag "${tag.name}"`}
                  >
                    <i className="bi bi-tag-fill me-1"></i>{tag.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {pdfData && (
            <div className="preview-section mt-4 p-3 border rounded">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Xem trước tài liệu (2 trang đầu)</h5>
                <Button variant="outline-danger" size="sm" onClick={handleClosePreview}>
                  <i className="bi bi-x-lg"></i> Đóng
                </Button>
              </div>
              <div className="preview-content text-center bg-light p-2" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <Document file={pdfData} onLoadSuccess={onDocumentLoadSuccess} loading="Đang tải bản xem trước...">
                  {numPages && (
                    <>
                      <Page pageNumber={1} width={Math.min(document.querySelector('.preview-content')?.clientWidth * 0.95 || 550, 550)} renderTextLayer={false} renderAnnotationLayer={false} />
                      {numPages > 1 && <Page pageNumber={2} width={Math.min(document.querySelector('.preview-content')?.clientWidth * 0.95 || 550, 550)} renderTextLayer={false} renderAnnotationLayer={false} />}
                    </>
                  )}
                  {!numPages && <p>Không thể tải trang.</p>}
                </Document>
              </div>
            </div>
          )}

          {relatedDocsByTag && relatedDocsByTag.length > 0 && (
            <div className="related-documents-section mt-4 pt-3">
              <h4 className="mb-3">
                <i className="bi bi-tags-fill me-2"></i> Các tài liệu liên quan
              </h4>
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3"> 
                {relatedDocsByTag.map(relatedDoc => (
                  <div key={`tag-${relatedDoc.documentId}`} className="col">
                    <div className="card h-100 shadow-sm related-doc-card">
                      <Link to={`/document/${relatedDoc.documentId}`}>
                        <img
                          src={getFullImageUrl(relatedDoc.coverImageUrl)}
                          className="card-img-top"
                          alt={relatedDoc.title}
                          style={{
                            height: '150px', // Slightly smaller height for these cards
                            objectFit: 'cover',
                            borderBottom: '1px solid #eee',
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getFullImageUrl(null);
                          }}
                        />
                      </Link>
                      <div className="card-body p-2 d-flex flex-column">
                        <h6 className="card-title mb-1" style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>
                          <Link
                            to={`/document/${relatedDoc.documentId}`}
                            className="text-decoration-none text-dark stretched-link"
                            title={relatedDoc.title}
                          >
                            {relatedDoc.title.length > 50 ? relatedDoc.title.substring(0, 50) + '...' : relatedDoc.title}
                          </Link>
                        </h6>
                        {relatedDoc.uploaderFullName && (
                           <p className="card-text text-muted small mb-0 mt-auto" style={{fontSize: '0.75rem'}}>
                             <i className="bi bi-person me-1"></i>{relatedDoc.uploaderFullName}
                           </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {relatedDocsByCategory && relatedDocsByCategory.length > 0 && (
            <div className="related-documents-section mt-4 pt-3">
              <hr />
              <h4 className="mb-3">
                <i className="bi bi-files me-2"></i> Có thể quan tâm
              </h4>
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3"> 
                {relatedDocsByCategory.map(relatedDoc => (
                  <div key={relatedDoc.documentId} className="col">
                    <div className="card h-100 shadow-sm related-doc-card">
                      <Link to={`/document/${relatedDoc.documentId}`}>
                        <img
                          src={getFullImageUrl(relatedDoc.coverImageUrl)}
                          className="card-img-top"
                          alt={relatedDoc.title}
                          style={{
                            height: '160px',
                            objectFit: 'cover',
                            borderBottom: '1px solid #eee',
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = getFullImageUrl(null);
                          }}
                        />
                      </Link>
                      <div className="card-body p-2 d-flex flex-column">
                        <h6 className="card-title mb-1" style={{ fontSize: '0.9rem', lineHeight: '1.3' }}>
                          <Link
                            to={`/document/${relatedDoc.documentId}`}
                            className="text-decoration-none text-dark stretched-link"
                            title={relatedDoc.title}
                          >
                            {relatedDoc.title.length > 40 ? relatedDoc.title.substring(0, 40) + '...' : relatedDoc.title}
                          </Link>
                        </h6>
                         {relatedDoc.uploadedByEmail && (
                           <p className="card-text text-muted small mb-0 mt-auto" style={{fontSize: '0.75rem'}}>
                             <i className="bi bi-person me-1"></i>{relatedDoc.uploadedByEmail}
                           </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <hr className="my-4" />
          <h4 className="mb-3">
            <i className="bi bi-chat-left-text me-2"></i> Bình luận ({comments.length})
          </h4>
          <Form onSubmit={handleCommentSubmit} className="mb-4 p-3 border rounded bg-light">
            <Form.Group className="mb-3">
              <Form.Label htmlFor="commentContent">Viết bình luận của bạn</Form.Label>
              <Form.Control
                as="textarea"
                id="commentContent"
                rows={3}
                value={comment.Content}
                onChange={(e) => setComment({ ...comment, Content: e.target.value })}
                placeholder={user ? "Chia sẻ ý kiến của bạn..." : "Vui lòng đăng nhập để bình luận"}
                disabled={!user}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Đánh giá (sao)</Form.Label>
              <StarRatingInput
                rating={comment.Rating}
                onChange={(rating) => setComment({ ...comment, Rating: rating })}
              />
            </Form.Group>
            <div className="comment-submit">
              <Button type="submit" variant="primary" disabled={!user || !comment.Content.trim()}>
                <i className="bi bi-send me-2"></i> Gửi bình luận
              </Button>
            </div>
          </Form>

          <div className="comments-list">
            {comments.length > 0 ? (
              comments.slice(0, pdfData ? 1 : 3).map((cmt) => (
                <div key={cmt.CommentId || cmt.UserId + cmt.CreatedAt} className="comment-item mb-3 p-3 border rounded">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong className="text-primary"><i className="bi bi-person-circle me-2"></i>{cmt.UserEmail}</strong>
                    <small className="text-muted">{cmt.CreatedAt ? new Date(cmt.CreatedAt).toLocaleString() : 'N/A'}</small>
                  </div>
                  <p className="mb-1" style={{ whiteSpace: 'pre-line' }}>{cmt.Content}</p>
                  {cmt.Rating > 0 && (
                    <div className="comment-rating">
                      <StarRatingDisplay rating={cmt.Rating} totalReviews={1} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted">Chưa có bình luận nào cho tài liệu này.</p>
            )}
            {comments.length > (pdfData ? 1 : 3) && (
              <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/postcommentdetail/${id}`)} className="mt-2">
                <i className="bi bi-plus-circle me-2"></i> Xem tất cả {comments.length} bình luận
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal show={showConfirmModal} onHide={handleCancelDownload} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận tải tài liệu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có muốn dùng {doc?.pointsRequired || 0} điểm để tải tài liệu này không?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelDownload}>Hủy</Button>
          <Button variant="primary" onClick={handleConfirmDownload}>Xác nhận</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showErrorModal} onHide={handleCloseErrorModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Thông báo lỗi</Modal.Title>
        </Modal.Header>
        <Modal.Body>{errorMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseErrorModal}>Đóng</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default DocumentDetail;