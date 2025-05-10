import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7013/api',
});

// Interceptor để thêm token nếu có
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Sending token:', token);
    if (token && typeof token === 'string') {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No valid token found in localStorage');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API cho người dùng
export const register = (data) => api.post('/users/register', data);
export const login = (data) => api.post('/users/login', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const getUser = (id) => api.get(`/users/${id}`);
export const getAllUsers = () => api.get('/users/all');

// API cho tài liệu
export const getDocuments = () => api.get('/documents');
export const getDocumentById = (id) => api.get(`/documents/${id}`);
export const uploadDocument = (data) =>
  api.post('/documents/upload', data, {
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
  return api.get('/documents/search', { params: filteredParams });
};
export const downloadDocument = (id) =>
  api.get(`/documents/${id}/download`, {
    responseType: 'blob',
  });
export const previewDocument = (id) => api.get(`/documents/${id}/preview`);

// API cho danh mục
export const getCategories = () => api.get('/categories');

// API cho bình luận
export const getCommentsByDocument = (documentId) => api.get(`/comments/document/${documentId}`);
export const addComment = (data) => api.post('/comments', data);
export const deleteComment = (id) => api.delete(`/comments/${id}`);

// API cho bài viết (diễn đàn)
export const getPosts = () => api.get('/posts');
export const createPost = (data) => api.post('/posts', data);
export const getPostComments = (postId) => api.get(`/postcomments/post/${postId}`);
export const addPostComment = (data) => api.post('/postcomments', data);

// API cho quản trị
export const getPendingDocuments = () => api.get('/documents/pending');
export const approveDocument = (id) => api.put(`/documents/${id}/approve`);

// API cho tài liệu của người dùng
export const getUploads = () => api.get('/UserDocuments/uploads');
export const getDownloads = () => api.get('/UserDocuments/downloads');

export default api;