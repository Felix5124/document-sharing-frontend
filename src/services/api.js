import axios from 'axios';
import qs from 'qs';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: 'repeat', skipNulls: false });
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Kiểm tra kỹ hơn URL trước khi đính kèm token
      // Ví dụ: chỉ đính kèm nếu URL bắt đầu bằng API_BASE_URL thực sự
      if (config.url && config.url.startsWith(API_BASE_URL) && !config.headers.Authorization) {
         config.headers.Authorization = `Bearer ${token}`;
      } else if (!config.url && config.baseURL === API_BASE_URL && !config.headers.Authorization) {
        // Trường hợp config.url không được set nhưng baseURL là API của chúng ta
         config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- API cho người dùng ---
export const register = (data) => apiClient.post('/users/register', data);

// export const login = (data) => apiClient.post('/users/login', data); // Endpoint này có thể không cần thiết nếu chỉ dùng Firebase client auth

export const getUserByFirebaseUid = (uid) => apiClient.get(`/Users/by-uid/${uid}`);

// Hàm mới để tạo người dùng backend cho Auth Provider (ví dụ: Google)
export const createBackendUserForAuthProvider = async (firebaseUser) => {
  const payload = {
    FirebaseUid: firebaseUser.uid,
    Email: firebaseUser.email,
    FullName: firebaseUser.displayName || firebaseUser.email, // Lấy FullName, nếu không có thì dùng email làm fallback
    // AvatarUrl: firebaseUser.photoURL, // Tùy chọn: bạn có thể gửi và lưu URL ảnh đại diện từ Google
  };
  console.log("API Call: Sending payload to /users/authprovider-register:", payload);
  // POST request đến endpoint bạn đã tạo trong UsersController.cs
  const response = await apiClient.post('/users/authprovider-register', payload);
  return response.data; // Trả về thông tin người dùng đã được tạo (hoặc đã tồn tại) từ backend
};


export const updateUser = (id, data) => apiClient.put(`/users/${id}`, data);
export const getUser = (id) => apiClient.get(`/users/${id}`);
export const getAllUsers = () => apiClient.get('/users/all');
export const lockUser = (userId, isLocked) => apiClient.put(`/users/${userId}/lock`, { isLocked });
export const uploadAvatar = (userId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post(`/users/${userId}/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// --- API cho tài liệu ---
// ... (giữ nguyên các hàm API khác của bạn) ...
export const getDocuments = (params) => apiClient.get('/documents', { params });
export const getDocumentById = (id) => apiClient.get(`/documents/${id}`);
export const uploadDocument = (data) =>
  apiClient.post('/documents/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateDocument = (id, data) =>
  apiClient.put(`/documents/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteDocument = (id) => apiClient.delete(`/documents/${id}`);
export const searchDocuments = (params) => {
  const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== '' && (typeof value !== 'number' || value !== 0)) {
      acc[key] = value;
    }
    return acc;
  }, {});
  console.log('Sending search params:', filteredParams);
  return apiClient.get('/documents/search', { params: filteredParams });
};
export const downloadDocument = (id, userId) =>
  apiClient.get(`/documents/${id}/download`, {
    params: { userId },
    responseType: 'blob',
  });
export const previewDocument = (id) =>
  apiClient.get(`/documents/${id}/preview`, { responseType: 'arraybuffer' });
export const getUploadCount = (userId) => apiClient.get('/documents/upload-count', { params: { userId } });
export const getRelatedDocuments = (documentId, count = 4) => {
  return apiClient.get(`/documents/${documentId}/related`, { params: { count } });
};


// --- API cho danh mục ---
export const getCategories = () => apiClient.get('/categories');
export const createCategory = (data) => apiClient.post('/categories', data);
export const updateCategory = (id, data) => apiClient.put(`/categories/${id}`, data);
export const deleteCategory = (id) => apiClient.delete(`/categories/${id}`);

// --- API cho bình luận ---
export const getCommentsByDocument = (documentId) =>
  apiClient.get(`/comments/document/${documentId}`);
export const addComment = (data) => apiClient.post('/comments', data);
export const deleteComment = (id) => apiClient.delete(`/comments/${id}`);
export const getCommentCount = (userId) => apiClient.get('/comments/count', { params: { userId } });

// --- API cho bài viết (diễn đàn) ---
export const getPosts = () => apiClient.get('/posts');
export const createPost = (data) => apiClient.post('/posts', data);
export const getPostComments = (postId) => apiClient.get(`/postcomments/post/${postId}`);
export const addPostComment = (data) => apiClient.post('/postcomments', data);

// --- API cho quản trị ---
export const getPendingDocuments = () => apiClient.get('/documents/pending');
export const approveDocument = (id) => apiClient.put(`/documents/${id}/approve`);
export const lockDocument = (id, isLocked) => apiClient.put(`/documents/${id}/lock`, { isLocked });

// --- API cho tài liệu của người dùng ---
export const getUploads = () => apiClient.get('/UserDocuments/uploads');
export const getDownloads = (userId) => apiClient.get('/UserDocuments/downloads', { params: { userId } });

// --- API cho thông báo ---
export const getUserNotifications = (userId) => apiClient.get('/notifications', { params: { userId } });
export const getNotificationById = (notificationId) => apiClient.get(`/notifications/${notificationId}`);
export const markNotificationAsRead = (notificationId) => apiClient.put(`/notifications/${notificationId}/read`);
export const deleteNotification = (notificationId) => apiClient.delete(`/notifications/${notificationId}`);

// --- API cho theo dõi ---
export const getUserFollowing = (userId) => apiClient.get('/follows', { params: { userId } });
export const getUserFollows = (followedUserId) => apiClient.get('/follows/followers', { params: { followedUserId } });
export const follow = (data) => apiClient.post('/follows', data);
export const unfollow = (followerId, followedUserId) => apiClient.delete(`/follows`, { params: { followerId, followedUserId } });

// --- API cho huy hiệu ---
export const getAllBadges = () => apiClient.get('/badges');
export const getUserBadges = (userId) => apiClient.get('/userbadges', { params: { userId } });


// --- API cho Bảng xếp hạng (Top đóng góp) ---
export const getTopCommenter = () => apiClient.get('/users/top-commenter');
export const getTopPointsUser = () => apiClient.get('/users/top-points');
export const getTopDownloadedDocument = () => apiClient.get('/documents/top-downloaded');


export default apiClient;