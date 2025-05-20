import axios from 'axios';
import { toast } from 'react-toastify';
import qs from 'qs';

const api = axios.create({
  baseURL: 'https://localhost:7013/api',
  paramsSerializer: (params) => {
    return qs.stringify(params, { skipNulls: false });
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && typeof token === 'string') {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No valid token found in localStorage');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.data) {
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          error.response.data = text ? JSON.parse(text) : text;
        } catch (e) {
          console.error('Error parsing Blob response:', e);
          error.response.data = 'Lỗi không xác định từ server';
        }
      } else {
        error.response.data = error.response.data.toString();
      }
    }
    return Promise.reject(error);
  }
);

// API cho người dùng
export const register = (data) => api.post('/users/register', data);
export const login = (data) => api.post('/users/login', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const getUser = (id) => api.get(`/users/${id}`);
export const getAllUsers = () => api.get('/users/all');
export const lockUser = (userId, isLocked) => api.put(`/users/${userId}/lock`, { isLocked });

// API cho tài liệu
export const getDocuments = () => api.get('/documents');
export const getDocumentById = (id) => api.get(`/documents/${id}`);
export const uploadDocument = (data) =>
  api.post('/documents/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateDocument = (id, data) =>
  api.put(`/documents/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteDocument = (id) => api.delete(`/documents/${id}`);
export const searchDocuments = (params) => {
  const filteredParams = {};
  if (params.Keyword !== undefined && params.Keyword !== '') {
    filteredParams.Keyword = params.Keyword;
  }
  if (params.CategoryId !== undefined && params.CategoryId !== 0) {
    filteredParams.CategoryId = params.CategoryId;
  }
  if (params.FileType !== undefined && params.FileType !== '') {
    filteredParams.FileType = params.FileType;
  }
  if (params.SortBy !== undefined) {
    filteredParams.SortBy = params.SortBy;
  }
  if (params.Page !== undefined) {
    filteredParams.Page = params.Page;
  }
  if (params.PageSize !== undefined) {
    filteredParams.PageSize = params.PageSize;
  }
  console.log('Sending search params:', filteredParams);
  return api.get('/documents/search', { params: filteredParams });
};
export const downloadDocument = (id, userId) =>
  api.get(`/documents/${id}/download`, {
    params: { userId },
    responseType: 'blob',
  });
export const previewDocument = (id) =>
  api.get(`/documents/${id}/preview`, { responseType: 'arraybuffer' });
export const getUploadCount = (userId) => api.get('/documents/upload-count', { params: { userId } });

// API cho danh mục
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// API cho bình luận
export const getCommentsByDocument = (documentId) =>
  api.get(`/comments/document/${documentId}`);
export const addComment = (data) => api.post('/comments', data);
export const deleteComment = (id) => api.delete(`/comments/${id}`);
export const getCommentCount = (userId) => api.get('/comments/count', { params: { userId } });

// API cho bài viết (diễn đàn)
export const getPosts = () => api.get('/posts');
export const createPost = (data) => api.post('/posts', data);
export const getPostComments = (postId) => api.get(`/postcomments/post/${postId}`);
export const addPostComment = (data) => api.post('/postcomments', data);

// API cho quản trị
export const getPendingDocuments = () => api.get('/documents/pending');
export const approveDocument = (id) => api.put(`/documents/${id}/approve`);
export const lockDocument = (id, isLocked) => api.put(`/documents/${id}/lock`, { isLocked }); // Thêm API khóa/mở khóa tài liệu

// API cho tài liệu của người dùng
export const getUploads = () => api.get('/UserDocuments/uploads');
export const getDownloads = (userId) => api.get('/UserDocuments/downloads', { params: { userId } });

// API cho thông báo
export const getUserNotifications = (userId) => api.get('/notifications', { params: { userId } });
export const getNotificationById = (notificationId) => api.get(`/notifications/${notificationId}`);
export const markNotificationAsRead = (notificationId) => api.put(`/notifications/${notificationId}/read`);
export const deleteNotification = (notificationId) => api.delete(`/notifications/${notificationId}`);

// API cho theo dõi
export const getUserFollowing = (userId) => api.get('/follows', { params: { userId } });
export const getUserFollows = (followedUserId) => api.get('/follows/followers', { params: { followedUserId } });
export const follow = (data) => api.post('/follows', data);
export const unfollow = (id) => api.delete(`/follows/${id}`);

// API cho huy hiệu
export const getAllBadges = () => api.get('/badges');
export const getUserBadges = (userId) => api.get('/userbadges', { params: { userId } });

// API cho avatar
export const uploadAvatar = (userId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/users/${userId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// API cho Bảng xếp hạng (Top đóng góp)
export const getTopCommenter = () => api.get('/users/top-commenter');
export const getTopPointsUser = () => api.get('/users/top-points');
export const getTopDownloadedDocument = () => api.get('/documents/top-downloaded');

export default api;