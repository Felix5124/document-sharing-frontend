import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCommentsByDocument, addComment, getDocumentById } from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

function PostCommentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState({ Content: '', Rating: 5 });
  const [doc, setDoc] = useState(null); // Thêm state để lưu thông tin tài liệu

  useEffect(() => {
    fetchDocument(); // Fetch tài liệu để lấy title
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
      setDoc(null); // Đặt doc là null nếu có lỗi
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
  CommentId: item.commentId,
  Content: item.content,
  Rating: item.rating != null ? parseInt(item.rating) : 0,
  CreatedAt: item.createdAt,
  UserId: item.userId,
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
      console.log('Submitting comment with data:', commentData);
      await addComment(commentData);
      toast.success('Bình luận đã được gửi.');
      setComment({ Content: '', Rating: 5 });
      fetchComments();
    } catch (error) {
      console.error('Error submitting comment:', error.response?.data || error.message);
      toast.error('Không thể gửi bình luận.');
    }
  };

  return (
    <div className="post-comment-container">
      <div className="post-comment-card">
        <h2 className="post-comment-title">
          <i className="bi bi-chat-left-text me-2"></i> Tất cả bình luận cho tài liệu {doc ? doc.title : 'Đang tải...'}
        </h2>
        <hr className="post-comment-divider" />
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

export default PostCommentDetail;