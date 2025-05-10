import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocumentById, getCommentsByDocument, addComment, downloadDocument, previewDocument } from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [doc, setDoc] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState({ Content: '', Rating: 5 });

  useEffect(() => {
    fetchDocument();
    fetchComments();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const response = await getDocumentById(id);
      console.log('Document response:', response);
      const data = response.data;
      console.log('Parsed data:', data);
      setDoc(data);
    } catch (error) {
      console.error('Error fetching document:', error);
      toast.error('Không thể tải thông tin tài liệu.');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await getCommentsByDocument(id);
      console.log('Comments response:', response.data);
      let data = response.data;
      if (Array.isArray(data)) {
        data = data;
      } else if (data && Array.isArray(data.$values)) {
        data = data.$values;
      } else {
        data = [];
      }

      const comments = data.map((item) => ({
        CommentId: item.commentId || null,
        Content: item.content || 'Nội dung không hợp lệ',
        Rating: item.rating != null ? parseInt(item.rating) : 0,
        CreatedAt: item.createdAt || null,
        UserId: item.userId || null,
        UserEmail: item.userEmail || 'Ẩn danh',
      }));
      console.log('Mapped comments:', comments);
      setComments(comments);
    } catch (error) {
      console.error('Error fetching comments:', error.response?.data || error.message);
      toast.error('Không thể tải bình luận.');
      setComments([]);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      await addComment({ DocumentId: id, ...comment });
      toast.success('Bình luận đã được gửi.');
      setComment({ Content: '', Rating: 5 });
      fetchComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast.error('Không thể gửi bình luận.');
    }
  };

  const handleDownload = async () => {
    try {
      console.log('Downloading document with ID:', id, 'Doc data:', doc, 'FileUrl:', doc.fileUrl);
      const response = await downloadDocument(id);
      if (!response.data) throw new Error('No file data received');

      // Cập nhật downloadCount trong state sau khi tải thành công
      setDoc((prevDoc) => ({
        ...prevDoc,
        downloadCount: prevDoc.downloadCount + 1,
      }));

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${doc.title}.${doc.fileType || 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Tải tài liệu thành công!');
    } catch (error) {
      console.error('Download error:', error.response?.data || error.message);
      toast.error('Tài liệu không tìm thấy. Kiểm tra FileUrl hoặc file trên server.');
    }
  };

  const handlePreview = async () => {
    try {
      const response = await previewDocument(id);
      toast.info(`Preview: ${response.data.previewText}`);
    } catch (error) {
      console.error('Error previewing document:', error);
      toast.error('Không thể xem trước.');
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  if (!doc) return <div>Loading...</div>;

  return (
    <div className="document-container">
      <div className="document-card">
        <h2 className="document-title">
          <i className="bi bi-file-earmark-text me-2"></i> {doc.title}
        </h2>
        <p className="document-description">{doc.description}</p>
        <p className="document-points">
          <i className="bi bi-star me-2"></i> Điểm yêu cầu: {doc.pointsRequired}
        </p>
        <p className="document-downloads">
          <i className="bi bi-download me-2"></i> Lượt tải: {doc.downloadCount}
        </p>
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
              ></textarea>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Đánh giá</label>
            <select
              className="form-select"
              value={comment.Rating}
              onChange={(e) => setComment({ ...comment, Rating: parseInt(e.target.value) })}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <option key={star} value={star}>{star} sao</option>
              ))}
            </select>
          </div>
          <button type="submit" className="submit-button">
            <i className="bi bi-send me-2"></i> Gửi bình luận
          </button>
        </form>
        <div className="comments-list">
          {Array.isArray(comments) && comments.length > 0 ? (
            comments.map((cmt, index) => (
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
            ))
          ) : (
            <p className="comments-empty">
              <i className="bi bi-chat-left me-2"></i> Không có bình luận nào để hiển thị.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DocumentDetail;