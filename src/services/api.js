import axios from 'axios';

// baseURL bây giờ là https://localhost:your_port (ví dụ: https://localhost:7013)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Interceptor để thêm token nếu có
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Giả sử token được lưu ở đây
    // console.log('Interceptor: Sending token:', token); // Bỏ comment nếu cần debug token
    if (token && typeof token === 'string') {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // console.warn('Interceptor: No valid token found in localStorage. Request will proceed without Authorization header.');
    }
    return config;
  },
  (error) => {
    console.error('Interceptor: Request error:', error);
    return Promise.reject(error);
  }
);

// API cho người dùng
// Tất cả các đường dẫn endpoint bây giờ bắt đầu bằng '/api'
export const register = (data) => api.post('/api/users/register', data);
export const exchangeFirebaseIdToken = (idToken) => api.post('/api/users/login', { idToken });

export const updateUser = (id, data) => api.put(`/api/users/${id}`, data);
export const getUser = (id) => api.get(`/api/users/${id}`);
export const getAllUsers = () => api.get('/api/users/all');
export const getMe = () => api.get('/api/users/me');

// API cho tài liệu
export const getDocuments = (params) => api.get('/api/documents', { params });
export const getDocumentById = (id) => api.get(`/api/documents/${id}`);
export const uploadDocument = (data) =>
  api.post('/api/documents/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const searchDocuments = (params) => {
  const filteredParams = {
    Keyword: params.Keyword || '',
    CategoryId: params.CategoryId || undefined,
    FileType: params.FileType || '',
    SortBy: params.SortBy || 'UploadedAt',
    Page: params.Page || 1,
    PageSize: params.PageSize || 10,
  };
  return api.get('/api/documents/search', { params: filteredParams });
};
export const downloadDocument = (id) =>
  api.get(`/api/documents/${id}/download`, {
    responseType: 'blob',
  });
export const previewDocument = (id) => api.get(`/api/documents/${id}/preview`);

// API cho danh mục
export const getCategories = () => api.get('/api/categories');
export const createCategory = (data) => api.post('/api/categories', data); // Thêm hàm tạo category
export const updateCategory = (id, data) => api.put(`/api/categories/${id}`, data); // Thêm hàm cập nhật category
export const deleteCategory = (id) => api.delete(`/api/categories/${id}`); // Thêm hàm xóa category


// API cho bình luận
export const getCommentsByDocument = (documentId) => api.get(`/api/comments/document/${documentId}`);
export const addComment = (data) => api.post('/api/comments', data);
export const deleteComment = (id) => api.delete(`/api/comments/${id}`);

// API cho bài viết (diễn đàn)
export const getPosts = () => api.get('/api/posts');
export const createPost = (data) => api.post('/api/posts', data);
export const getPostComments = (postId) => api.get(`/api/postcomments/post/${postId}`);
export const addPostComment = (data) => api.post('/api/postcomments', data);

// API cho quản trị
export const getPendingDocuments = () => api.get('/api/documents/pending');
export const approveDocument = (id) => api.put(`/api/documents/${id}/approve`);

// API cho tài liệu của người dùng
export const getUploads = () => api.get('/api/UserDocuments/uploads');
export const getDownloads = () => api.get('/api/UserDocuments/downloads');

// API cho Huy hiệu (Badges)
export const getAllBadges = () => api.get('/api/badges'); // Thêm hàm lấy tất cả badges
export const createBadge = (data) => api.post('/api/badges', data); // THÊM HÀM NÀY

export default api;
