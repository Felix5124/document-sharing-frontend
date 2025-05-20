import { Document, Page, pdfjs } from 'react-pdf';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocumentById, getCommentsByDocument, downloadDocument, previewDocument, follow, getUserFollowing, addComment } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Modal, Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useEffect, useState, useContext } from 'react';

// Cấu hình workerSrc cho Vite, sử dụng pdf.worker.mjs
const workerUrl = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
console.log('Worker URL:', workerUrl);
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

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

  useEffect(() => {
    fetchDocument();
    fetchComments();
  }, [id]);

  useEffect(() => {
    if (user && user.userId && doc?.uploadedBy) {
      checkFollowStatus();
    }
  }, [user, doc]);

  const fetchDocument = async () => {
    try {
      const response = await getDocumentById(id);
      setDoc(response.data);
    } catch (error) {
      console.error('Lỗi khi tải tài liệu:', error);
      setErrorMessage('Không thể tải thông tin tài liệu.');
      setShowErrorModal(true);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await getCommentsByDocument(id);
      let data = response.data;
      if (Array.isArray(data)) {
        data = data;
      } else if (data && Array.isArray(data.$values)) {
        data = data.$values;
      } else {
        data = [];
      }

      const comments = data.map((item) => ({
        CommentId: item.commentId,
        Content: item.content,
        Rating: item.rating != null ? parseInt(item.rating) : 0,
        CreatedAt: item.createdAt,
        UserId: item.userId,
        UserEmail: item.userEmail || 'Ẩn danh',
      }));
      setComments(comments);
    } catch (error) {
      console.error('Lỗi khi tải bình luận:', error.response?.data || error.message);
      setErrorMessage('Không thể tải bình luận.');
      setShowErrorModal(true);
      setComments([]);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const response = await getUserFollowing(user.userId);
      const follows = Array.isArray(response.data) ? response.data : [];
      const isAlreadyFollowing = follows.some(follow => follow.followedUserId === doc.uploadedBy);
      setIsFollowing(isAlreadyFollowing);
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái theo dõi:', error);
      setErrorMessage('Không thể kiểm tra trạng thái theo dõi.');
      setShowErrorModal(true);
    }
  };

  const handleDownload = () => {
    if (!user || !user.userId) {
      setErrorMessage('Vui lòng đăng nhập để tải tài liệu.');
      setShowErrorModal(true);
      navigate('/login');
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
      const blob = new Blob([response.data], { type: `application/${doc.fileType || 'pdf'}` });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${doc.title}.${doc.fileType || 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDoc((prevDoc) => ({
        ...prevDoc,
        downloadCount: prevDoc.downloadCount + 1,
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
        message = error.response.data.message || error.response.data || message;
      }
      setErrorMessage(message);
      setShowErrorModal(true);
    }
  };

  const handleConfirmDownload = () => {
    setShowConfirmModal(false);
    performDownload();
  };

  const handleCancelDownload = () => {
    setShowConfirmModal(false);
  };

  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  const handlePreview = async () => {
    try {
      const response = await previewDocument(id, { responseType: 'arraybuffer' });
      if (response.data instanceof ArrayBuffer) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        console.log('PDF URL:', url); // Kiểm tra URL của PDF
        setPdfData(url);
      } else {
        const text = new TextDecoder().decode(response.data);
        const json = JSON.parse(text);
        setErrorMessage(json.Message || 'Không thể xem trước: Định dạng response không hợp lệ.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Lỗi khi xem trước tài liệu:', error);
      setErrorMessage('Không thể xem trước: ' + (error.response?.data?.Message || error.message));
      setShowErrorModal(true);
      setPdfData(null);
    }
  };

  const handleClosePreview = () => {
    setPdfData(null);
    if (pdfData) window.URL.revokeObjectURL(pdfData);
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  const handleViewAllComments = () => {
    navigate(`/postcommentdetail/${id}`);
  };

  const handleFollowAuthor = async () => {
    if (!user || !user.userId) {
      setErrorMessage('Vui lòng đăng nhập để theo dõi tác giả.');
      setShowErrorModal(true);
      navigate('/login');
      return;
    }

    if (!doc.uploadedBy) {
      setErrorMessage('Không tìm thấy thông tin tác giả.');
      setShowErrorModal(true);
      return;
    }

    setLoadingFollow(true);
    try {
      const followData = {
        UserId: user.userId,
        FollowedUserId: doc.uploadedBy,
      };
      await follow(followData);
      setIsFollowing(true);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Không thể theo dõi tác giả.';
      setErrorMessage(errorMessage);
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

    try {
      const commentData = {
        DocumentId: id,
        Content: comment.Content,
        Rating: comment.Rating,
        UserId: user.userId,
      };
      await addComment(commentData);
      toast.success('Bình luận đã được gửi.');
      setComment({ Content: '', Rating: 5 });
      fetchComments();
    } catch (error) {
      console.error('Lỗi khi gửi bình luận:', error.response?.data || error.message);
      toast.error('Không thể gửi bình luận.');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    console.log('Number of pages:', numPages); // Thêm log để debug
    setNumPages(numPages);
  };

  if (!doc) return <div>Đang tải...</div>;

  return (
    <div className="document-container">
      <div className="document-card">
        <h2 className="document-title">
          <i className="bi bi-file-earmark-text me-2"></i> {doc.title}
        </h2>
        <p className="document-description">
          <i className="bi bi-document me-2"></i> Mô tả: {doc.description}
        </p>
        <p className="document-points">
          <i className="bi bi-star me-2"></i> Điểm yêu cầu: {doc.pointsRequired}
        </p>
        <p className="document-downloads">
          <i className="bi bi-download me-2"></i> Lượt tải: {doc.downloadCount}
        </p>
        <div className="document-author">
          <p>
            <i className="bi bi-person me-2"></i> Tác giả: {doc.email || 'Ẩn danh'}
          </p>
          {user && user.userId !== doc.uploadedBy && (
            <button
              className={`action-button follow-button ${isFollowing ? 'followed' : ''}`}
              onClick={handleFollowAuthor}
              disabled={isFollowing || loadingFollow}
            >
              <i className={`bi ${isFollowing ? 'bi-person-check' : 'bi-person-plus'} me-2`}></i>
              {isFollowing ? 'Đã theo dõi' : loadingFollow ? 'Đang xử lý...' : 'Theo dõi'}
            </button>
          )}
        </div>
        <div className="document-actions">
          {user ? (
            <button className="action-button download-button" onClick={handleDownload}>
              <i className="bi bi-download me-2"></i> Tải xuống
            </button>
          ) : (
            <button className="action-button login-button" onClick={handleLoginRedirect}>
              <i className="bi bi-box-arrow-in-right me-2"></i> Đăng nhập để tải
            </button>
          )}
          {doc.fileType === 'pdf' && (
            <button className="action-button preview-button" onClick={handlePreview}>
              <i className="bi bi-eye me-2"></i> Xem trước
            </button>
          )}
        </div>

        {pdfData && (
          <div className="preview-section">
            <div className="preview-header">
              <h4>Xem trước (2 trang đầu)</h4>
              <button className="close-preview-button" onClick={handleClosePreview}>
                <i className="bi bi-x"></i> Đóng
              </button>
            </div>
            <div className="preview-content">
              <Document file={pdfData} onLoadSuccess={onDocumentLoadSuccess}>
                {numPages && (
                  <>
                    <Page pageNumber={1} width={600} renderTextLayer={false} />
                    {numPages > 1 && <Page pageNumber={2} width={600} renderTextLayer={false} />}
                  </>
                )}
              </Document>
            </div>
          </div>
        )}

        <hr className="document-divider" />
        <h4 className="comments-title">
          <i className="bi bi-chat-left-text me-2"></i> Bình luận
        </h4>
        <form onSubmit={handleCommentSubmit} className="comment-form">
          <div className="form-group">
            <div className="input-wrapper">
              <i className="bi bi-pen input-icon"></i>
              <textarea
                className="form-input"
                value={comment.Content}
                onChange={(e) => setComment({ ...comment, Content: e.target.value })}
                placeholder="Viết bình luận..."
                disabled={!user}
              ></textarea>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Đánh giá</label>
            <select
              className="form-select"
              value={comment.Rating}
              onChange={(e) => setComment({ ...comment, Rating: parseInt(e.target.value) })}
              disabled={!user}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <option key={star} value={star}>{star} sao</option>
              ))}
            </select>
          </div>
          <button type="submit" className="submit-button" disabled={!user}>
            <i className="bi bi-send me-2"></i> Gửi bình luận
          </button>
        </form>
        <div className="comments-list">
          {Array.isArray(comments) && comments.length > 0 ? (
            <>
              {comments.slice(0, 2).map((cmt, index) => (
                <div key={`comment-${cmt.CommentId}-${index}`} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-user">
                      <i className="bi bi-person me-2"></i>
                      {cmt.UserEmail}
                    </span>
                  </div>
                  <div className="comment-body">
                    <p className="comment-content">{cmt.Content}</p>
                  </div>
                  <div className="comment-footer">
                    <span className="comment-rating">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`bi ${i < cmt.Rating ? 'bi-star-fill' : 'bi-star'} me-1`}
                        ></i>
                      ))}
                      <span className="rating-text">
                        {cmt.Rating != null && !isNaN(cmt.Rating) ? `${cmt.Rating}/5` : 'Chưa có đánh giá'}
                      </span>
                    </span>
                    <span className="comment-meta">
                      <i className="bi bi-clock me-2"></i>
                      {cmt.CreatedAt ? (
                        new Date(cmt.CreatedAt).toLocaleString()
                      ) : (
                        <span style={{ color: 'red' }}>Ngày không hợp lệ</span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
              {comments.length > 2 && (
                <button className="view-more-button" onClick={handleViewAllComments}>
                  <i className="bi bi-plus-circle me-2"></i> Xem thêm bình luận
                </button>
              )}
            </>
          ) : (
            <p className="comments-empty">
              <i className="bi bi-chat-left me-2"></i> Không có bình luận nào để hiển thị.
            </p>
          )}
        </div>
      </div>

      <Modal show={showConfirmModal} onHide={handleCancelDownload}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận tải tài liệu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có muốn dùng {doc?.pointsRequired} điểm để tải tài liệu này không?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelDownload}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleConfirmDownload}>
            Xác nhận
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showErrorModal} onHide={handleCloseErrorModal}>
        <Modal.Header closeButton>
          <Modal.Title>Thông báo</Modal.Title>
        </Modal.Header>
        <Modal.Body>{errorMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleCloseErrorModal}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default DocumentDetail;