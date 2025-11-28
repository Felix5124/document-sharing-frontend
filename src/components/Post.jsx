import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { getPosts, createPost, getPostComments, addPostComment } from '../services/api';
import '../styles/components/Post.css';
import '../styles/layouts/PageWithSidebar.css';
import { getFullAvatarUrl } from '../utils/avatarUtils';
import VipPromoBanner from './VipPromoBanner';
import VipWelcomeBanner from './VipWelcomeBanner';
import RightSidebar from './RightSidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEyeSlash, faEye } from '@fortawesome/free-solid-svg-icons';

const Post = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '', userId: user?.userId || null });
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [error, setError] = useState('');
  const [hideLeftSidebar, setHideLeftSidebar] = useState(false);
  const [hideRightSidebar, setHideRightSidebar] = useState(false);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, type: '' });

  // Handle context menu
  const handleContextMenu = (e, type) => {
    if (!user?.isVip) return;
    e.preventDefault();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, type });
  };

  const handleToggleSidebar = (type) => {
    if (type === 'left') {
      setHideLeftSidebar(!hideLeftSidebar);
    } else if (type === 'right') {
      setHideRightSidebar(!hideRightSidebar);
    }
    setContextMenu({ show: false, x: 0, y: 0, type: '' });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu({ show: false, x: 0, y: 0, type: '' });
    if (contextMenu.show) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.show]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
  const response = await getPosts();
  setPosts(response.data?.$values || response.data || []);
      } catch (err) {
        setError('Không thể tải bài viết.');
        toast.error('Không thể tải bài viết.');
      }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
    setNewPost(prev => ({ ...prev, userId: user?.userId || null }));
  }, [user]);

  const fetchComments = async (postId) => {
    try {
      const response = await getPostComments(postId);
      const arr = response.data?.$values || response.data || [];
      setComments(prev => ({
        ...prev,
        [postId]: arr,
      }));
    } catch (err) {
      toast.error('Không thể tải bình luận.');
    }
  };

  const toggleComments = (postId) => {
    if (comments[postId]) {
      setComments(prev => {
        const copy = { ...prev };
        delete copy[postId];
        return copy;
      });
    } else {
      fetchComments(postId);
    }
  };

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
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), response.data],
      }));
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      toast.success('Bình luận thành công!');
    } catch (err) {
      toast.error('Không thể đăng bình luận.');
    }
  };

  return (
    <div className="all-container">
      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="sidebar-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={() => handleToggleSidebar(contextMenu.type)}>
            {(contextMenu.type === 'left' && hideLeftSidebar) || (contextMenu.type === 'right' && hideRightSidebar) 
              ? '👁️ Hiển thị' 
              : '🚫 Ẩn'}
          </button>
        </div>
      )}

      <div className={`page-layout-with-sidebar ${user?.isVip ? 'no-left-sidebar' : ''}`}>
        {/* Sidebar VIP Banner */}
        {user && !user.isVip && (
          <aside className="page-sidebar">
            <VipPromoBanner variant="forum" />
          </aside>
        )}
        {user?.isVip && (
          <aside 
            className="page-sidebar"
            onContextMenu={(e) => handleContextMenu(e, 'left')}
            style={{ cursor: 'context-menu' }}
          >
            {!hideLeftSidebar && <VipWelcomeBanner />}
          </aside>
        )}

        {/* Main Content */}
        <div className="page-main-content">
          <div className="all-container-card">
            <h2 className="upload-title">
              Diễn đàn
            </h2>

            {error && (
              <p className="error-text center-text">{error}</p>
            )}

            {/* Form đăng bài */}
            {user && (
          <form onSubmit={handleCreatePost} className="post-form">
            <div className="form-item">
              <label className="form-label">Tiêu đề bài viết</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Tiêu đề bài viết"
                  value={newPost.title}
                  onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                  className="form-input-no-icon"
                  required
                />
              </div>
            </div>

            <div className="form-item">
              <label className="form-label">Nội dung</label>
              <div className="input-wrapper">
                <textarea
                  placeholder="Bạn đang nghĩ gì?"
                  value={newPost.content}
                  onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                  className="form-input-no-icon"
                  rows="3"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-submit full-width">
              Đăng bài
            </button>
          </form>
        )}

        <div className="post-list">
          {posts.map(post => (
            <div key={post.postId} className="post-card">
              <div className="post-header">
                <Link to={post.userId ? `/profile/${post.userId}` : '/profile'}>
                  <img
                    src={getFullAvatarUrl(post.user?.avatarUrl)}
                    alt={post.user?.fullName || post.user?.email || 'Avatar'}
                    className="post-avatar"
                    onError={e => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getFullAvatarUrl(null);
                    }}
                  />
                </Link>
                <div className="post-user-info">
                  <p className="post-user-email">
                    {post.userId ? (
                      <Link to={`/profile/${post.userId}`}>{post.user?.fullName || post.user?.email}</Link>
                    ) : (
                      (post.user?.fullName || post.user?.email || 'Ẩn danh')
                    )}
                  </p>
                  <p className="post-date">{new Date(post.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>

              <h3 className="post-title">{post.title}</h3>
              <p className="post-content">{post.content}</p>

              <button
                className="btn-comment"
                onClick={() => toggleComments(post.postId)}
              >
                {comments[post.postId] ? 'Ẩn bình luận' : 'Xem bình luận'}
              </button>

              {comments[post.postId] && (
                <div className="comments-wrapper">
                  {comments[post.postId].map(comment => (
                    <div key={comment.postCommentId} className="comment-item">
                      <Link to={comment.userId ? `/profile/${comment.userId}` : '/profile'}>
                        <img
                          src={getFullAvatarUrl(comment.user?.avatarUrl)}
                          alt={comment.user?.fullName || comment.user?.email || 'Avatar'}
                          className="comment-avatar"
                          onError={e => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getFullAvatarUrl(null);
                          }}
                        />
                      </Link>
                      <div className="comment-content-wrapper">
                        <div className="comment-bubble">
                          <p className="comment-user-email">
                            {comment.userId ? (
                              <Link to={`/profile/${comment.userId}`}>{comment.user?.fullName || comment.user?.email}</Link>
                            ) : (
                              (comment.user?.fullName || comment.user?.email || 'Ẩn danh')
                            )}
                          </p>
                          <p className="comment-content">{comment.content}</p>
                        </div>
                        <p className="comment-date">{new Date(comment.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  ))}
                  {user ? (
                    <div className="comment-form">
                      <div className="form-item">
                        <label className="form-label">Bình luận của bạn</label>
                        <div className="input-wrapper">
                          <textarea
                            placeholder="Viết bình luận..."
                            value={newComment[post.postId] || ''}
                            onChange={e =>
                              setNewComment({ ...newComment, [post.postId]: e.target.value })
                            }
                            className="form-input-no-icon"
                            rows="2"
                          />
                        </div>
                      </div>
                      <div className="submit-wrapper">
                        <button
                          onClick={() => handleAddComment(post.postId)}
                          className="btn-submit-comment"
                        >
                          Gửi bình luận
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="error-text">
                      Vui lòng{' '}
                      <a href="/login" className="link-primary">
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

        {/* Right Sidebar */}
        <aside 
          className="page-sidebar-right"
          onContextMenu={(e) => handleContextMenu(e, 'right')}
          style={{ cursor: user?.isVip ? 'context-menu' : 'default' }}
        >
          {!hideRightSidebar && <RightSidebar variant="forum" />}
        </aside>
      </div>
    </div>
  );
};

export default Post;
