import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { getPosts, createPost, getPostComments, addPostComment } from '../services/api';

const Post = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '', userId: user?.userId || null });
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [error, setError] = useState('');

  // Lấy danh sách bài viết
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await getPosts();
        setPosts(response.data.$values || response.data);
      } catch (err) {
        setError('Không thể tải bài viết.');
        toast.error('Không thể tải bài viết.');
      }
    };
    fetchPosts();
  }, []);

  // Cập nhật userId khi user thay đổi
  useEffect(() => {
    setNewPost((prev) => ({ ...prev, userId: user?.userId || null }));
  }, [user]);

  // Lấy bình luận cho một bài viết
  const fetchComments = async (postId) => {
    try {
      const response = await getPostComments(postId);
      setComments((prev) => ({
        ...prev,
        [postId]: response.data.$values || response.data,
      }));
    } catch (err) {
      toast.error('Không thể tải bình luận.');
    }
  };

  // Toggle bình luận
  const toggleComments = (postId) => {
    if (comments[postId]) {
      setComments((prev) => {
        const newComments = { ...prev };
        delete newComments[postId];
        return newComments;
      });
    } else {
      fetchComments(postId);
    }
  };

  // Tạo bài viết mới
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để đăng bài viết.');
      return;
    }
    try {
      const response = await createPost({ ...newPost, userId: user.userId });
      setPosts([response.data, ...posts]);
      setNewPost({ title: '', content: '', userId: user.userId });
      toast.success('Đăng bài viết thành công!');
    } catch (err) {
      setError('Không thể đăng bài viết.');
      toast.error('Không thể đăng bài viết.');
    }
  };

  // Tạo bình luận mới
  const handleAddComment = async (postId) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để bình luận.');
      return;
    }
    const content = newComment[postId]?.trim();
    if (!content) {
      toast.error('Bình luận không được để trống.');
      return;
    }
    try {
      const response = await addPostComment({
        postId,
        content,
        userId: user.userId,
      });
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), response.data],
      }));
      setNewComment((prev) => ({ ...prev, [postId]: '' }));
      toast.success('Bình luận thành công!');
    } catch (err) {
      toast.error('Không thể đăng bình luận.');
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h2 className="upload-title">
          <i className="bi bi-chat-square-text me-2"></i> Diễn đàn
        </h2>
        {error && (
          <p className="error-text text-center mb-4">{error}</p>
        )}

        {/* Form tạo bài viết */}
        {user && (
          <form onSubmit={handleCreatePost} className="mb-5 post-form">
            <div className="form-group">
              <label className="form-label">Tiêu đề bài viết</label>
              <div className="input-wrapper">
                <i className="bi bi-fonts input-icon"></i>
                <input
                  type="text"
                  placeholder="Tiêu đề bài viết"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Nội dung</label>
              <div className="input-wrapper">
                <i className="bi bi-text-paragraph input-icon"></i>
                <textarea
                  placeholder="Bạn đang nghĩ gì?"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="form-input"
                  rows="4"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="submit-button w-100"
            >
              <i className="bi bi-cloud-upload me-2"></i> Đăng bài
            </button>
          </form>
        )}

        {/* Danh sách bài viết */}
        <div className="post-list">
          {posts.map((post) => (
            <div
              key={post.postId}
              className="post-card"
            >
              <div className="post-header">
                <img
                  src={post.user?.avatarUrl ? `https://localhost:7013${post.user.avatarUrl}` : '/assets/images/default-avatar.png'}
                  alt="Avatar"
                  className="post-avatar"
                  onError={(e) => (e.target.src = '/assets/images/default-avatar.png')}
                />
                <div className="post-user-info">
                  <p className="post-user-email">{post.user?.email || 'Ẩn danh'}</p>
                  <p className="post-date">
                    {new Date(post.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              <h3 className="post-title">{post.title}</h3>
              <p className="post-content">{post.content}</p>

              {/* Nút xem bình luận */}
              <button
                className="comment-toggle"
                onClick={() => toggleComments(post.postId)}
              >
                {comments[post.postId] ? 'Ẩn bình luận' : 'Xem bình luận'}
              </button>

              {/* Hiển thị bình luận */}
              {comments[post.postId] && (
                <div className="comment-section">
                  {comments[post.postId].map((comment) => (
                    <div
                      key={comment.postCommentId}
                      className="comment-item"
                    >
                      <div className="comment-header">
                        <img
                          src={
                            comment.user?.avatarUrl
                              ? `https://localhost:7013${comment.user.avatarUrl}`
                              : '/assets/images/default-avatar.png'
                          }
                          alt="Avatar"
                          className="comment-avatar"
                          onError={(e) => (e.target.src = '/assets/images/default-avatar.png')}
                        />
                        <div className="comment-user-info">
                          <p className="comment-user-email">{comment.user?.email || 'Ẩn danh'}</p>
                          <p className="comment-date">
                            {new Date(comment.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <p className="comment-content">{comment.content}</p>
                    </div>
                  ))}
                  {/* Form bình luận */}
                  {user ? (
                    <div className="comment-form">
                      <div className="form-group">
                        <label className="form-label">Bình luận của bạn</label>
                        <div className="input-wrapper">
                          <i className="bi bi-text-paragraph input-icon"></i>
                          <textarea
                            placeholder="Viết bình luận..."
                            value={newComment[post.postId] || ''}
                            onChange={(e) =>
                              setNewComment({ ...newComment, [post.postId]: e.target.value })
                            }
                            className="form-input"
                            rows="2"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddComment(post.postId)}
                        className="submit-button"
                      >
                        Gửi bình luận
                      </button>
                    </div>
                  ) : (
                    <p className="error-text">
                      Vui lòng{' '}
                      <a href="/login" className="text-primary">
                        đăng nhập
                      </a>{' '}
                      để bình luận.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Post;