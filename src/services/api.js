import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm token Firebase vào header cho các yêu cầu cần xác thực
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý lỗi (ví dụ: 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Có thể redirect về trang đăng nhập
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Badges
export const getBadges = () => api.get("/badges");
export const createBadge = (badge) => api.post("/badges", badge);

// Categories
export const getCategories = () => api.get("/categories");
export const getCategoryById = (id) => api.get(`/categories/${id}`);
export const createCategory = (category) => api.post("/categories", category);
export const updateCategory = (id, category) => api.put(`/categories/${id}`, category);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Comments
export const getCommentsByDocument = (documentId) => api.get(`/comments/document/${documentId}`);
export const createComment = (comment) => api.post("/comments", comment);
export const deleteComment = (id) => api.delete(`/comments/${id}`);

// Documents
export const getDocuments = (params) => api.get("/documents", { params });
export const getDocumentById = (id) => api.get(`/documents/${id}`);
export const createDocument = (document) => api.post("/documents", document);
export const updateDocument = (id, document) => api.put(`/documents/${id}`, document);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);
export const uploadDocument = (formData) => api.post("/documents/upload", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const searchDocuments = (params) => api.get("/documents/search", { params });
export const getPendingDocuments = () => api.get("/documents/pending");
export const approveDocument = (id) => api.put(`/documents/${id}/approve`);
export const downloadDocument = (id) => api.get(`/documents/${id}/download`);
export const previewDocument = (id) => api.get(`/documents/${id}/preview`);

// Follows
export const getFollows = () => api.get("/follows");
export const createFollow = (follow) => api.post("/follows", follow);
export const deleteFollow = (id) => api.delete(`/follows/${id}`);

// Notifications
export const getNotifications = () => api.get("/notifications");
export const markNotificationAsRead = (id) => api.put(`/notifications/${id}/read`);

// Post Comments
export const getPostComments = (postId) => api.get(`/postcomments/post/${postId}`);
export const createPostComment = (comment) => api.post("/postcomments", comment);
export const deletePostComment = (id) => api.delete(`/postcomments/${id}`);

// Posts
export const getPosts = () => api.get("/posts");
export const getPostById = (id) => api.get(`/posts/${id}`);
export const createPost = (post) => api.post("/posts", post);
export const deletePost = (id) => api.delete(`/posts/${id}`);

// Recommendations
export const getRecommendations = () => api.get("/recommendations");

// User Badges
export const getUserBadges = () => api.get("/userbadges");

// Users
export const registerUser = (user) => api.post("/users/register", user);
export const loginUser = (credentials) => api.post("/users/login", credentials);
export const getUserById = (id) => api.get(`/users/${id}`);
export const updateUser = (id, user) => api.put(`/users/${id}`, user);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const updateUserPoints = (id, points) => api.post(`/users/${id}/points`, points);
export const getRanking = (params) => api.get("/users/ranking", { params });

export default api;