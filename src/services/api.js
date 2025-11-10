import axios from "axios";
import qs from "qs";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: "repeat", skipNulls: false });
  },
});

// Helper: get token from sessionStorage; migrate from localStorage if found
const getSessionToken = () => {
  try {
    let token = sessionStorage.getItem('token');
    if (!token) {
      const legacy = localStorage.getItem('token');
      if (legacy) {
        sessionStorage.setItem('token', legacy);
        localStorage.removeItem('token');
        token = legacy;
      }
    }
    return token;
  } catch {
    return null;
  }
};

apiClient.interceptors.request.use(
  (config) => {
    const token = getSessionToken();

    if (token) {
      // Original conditions:
      const condition1 = config.url && config.url.startsWith(API_BASE_URL) && !config.headers.Authorization;
      const condition2 = (!config.url || !config.url.startsWith('http')) && config.baseURL === API_BASE_URL && !config.headers.Authorization; // Corrected this slightly from your original for relative paths

      if (condition1) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (condition2) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Conditions to set Authorization header not met (rare path)
      }
    }
    return config;
  },
  (error) => {
    console.error("Interceptor request error:", error);
    return Promise.reject(error);
  }
);

// --- API cho người dùng ---
// (Giữ nguyên các API người dùng, không thay đổi)
export const register = (data) => apiClient.post("/users/register", data);
export const getUserByFirebaseUid = (uid) =>
  apiClient.get(`/Users/by-uid/${uid}`);
export const createBackendUserForAuthProvider = async (payload) => {
  try {
    console.log(
      "API Call: Sending payload to /users/authprovider-register:",
      payload
    );
    const response = await apiClient.post(
      "/users/authprovider-register",
      payload
    );
    return response.data;
  } catch (error) {
    console.error(
      "Error in createBackendUserForAuthProvider:",
      error.response?.data
    );
    throw error;
  }
};
export const updateUser = (id, data) => apiClient.put(`/users/${id}`, data);
export const getUser = (id) => apiClient.get(`/users/${id}`);
export const getAllUsers = () => apiClient.get("/users/all");
export const lockUser = (userId, isLocked) =>
  apiClient.put(`/users/${userId}/lock`, { isLocked });
export const uploadAvatar = (userId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post(`/users/${userId}/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// --- API cho tài liệu ---
export const getDocuments = (params) => apiClient.get("/documents", { params });
export const getDocumentById = (id, userId) => {
  const params = userId ? { userId } : {};
  return apiClient.get(`/documents/${id}`, { params });
};
export const uploadDocument = (data) =>
  apiClient.post("/documents/upload", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export const updateDocument = (id, data) =>
  apiClient.put(`/documents/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const getRelatedDocumentsByTags = (
  tagNames,
  excludeDocumentId,
  limit = 5
) => {
  return apiClient.get("/documents/related-by-tags", {
    params: {
      tagNames: tagNames,
      excludeDocumentId,
      limit,
    },
  });
};

export const deleteDocument = (id) => apiClient.delete(`/documents/${id}`);
export const searchDocuments = (params) => {
  const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (
      value !== undefined &&
      value !== "" &&
      (typeof value !== "number" || value !== 0)
    ) {
      acc[key] = value;
    }
    return acc;
  }, {});
  return apiClient.get("/documents/search", { params: filteredParams });
};
export const downloadDocument = (id, userId) =>
  apiClient.get(`/documents/${id}/download`, {
    params: { userId },
  });

export const adminDownloadDocument = (id, userId) =>
  apiClient.get(`/documents/${id}/admin-download`, {
    params: { userId },
  });
export const previewDocument = (id) =>
  apiClient.get(`/documents/${id}/preview`);
export const getUploadCount = (userId) =>
  apiClient.get("/documents/upload-count", { params: { userId } });
export const getRelatedDocuments = (documentId, count = 4) => {
  return apiClient.get(`/documents/${documentId}/related`, {
    params: { count },
  });
};

// --- API cho danh mục ---
export const getCategories = () => apiClient.get("/categories");
export const createCategory = (data) => apiClient.post("/categories", data);
export const updateCategory = (id, data) =>
  apiClient.put(`/categories/${id}`, data);
export const deleteCategory = (id) => apiClient.delete(`/categories/${id}`);

// --- API cho bình luận ---
export const getCommentsByDocument = (documentId) =>
  apiClient.get(`/comments/document/${documentId}`);
export const addComment = (data) => apiClient.post("/comments", data);
export const deleteComment = (id) => apiClient.delete(`/comments/${id}`);
export const getCommentCount = (userId) =>
  apiClient.get("/comments/count", { params: { userId } });

// --- API cho bài viết (diễn đàn) ---
export const getPosts = () => apiClient.get("/posts");
export const createPost = (data) => apiClient.post("/posts", data);
export const getPostComments = (postId) =>
  apiClient.get(`/postcomments/post/${postId}`);
export const addPostComment = (data) => apiClient.post("/postcomments", data);

// --- API cho quản trị ---
export const getPendingDocuments = () => apiClient.get("/documents/pending");
export const getSemiApprovedDocuments = () => apiClient.get("/documents/semiapproved");
export const approveDocument = (id) =>
  apiClient.put(`/documents/${id}/approve`);
export const lockDocument = (id, isLocked) =>
  apiClient.put(`/documents/${id}/lock`, { isLocked });

// --- API cho tài liệu của người dùng ---
export const getUploads = () => apiClient.get("/UserDocuments/uploads");
export const getDownloads = (userId) =>
  apiClient.get("/UserDocuments/downloads", { params: { userId } });

// --- API cho thông báo ---
export const getUserNotifications = (userId) =>
  apiClient.get("/notifications", { params: { userId } });
export const getNotificationById = (notificationId) =>
  apiClient.get(`/notifications/${notificationId}`);
export const markNotificationAsRead = (notificationId) =>
  apiClient.put(`/notifications/${notificationId}/read`);
export const deleteNotification = (notificationId) =>
  apiClient.delete(`/notifications/${notificationId}`);

// --- API cho theo dõi ---
export const getUserFollowing = (userId) =>
  apiClient.get("/follows/following", { params: { userId } });
export const getUserFollows = (followedUserId) =>
  apiClient.get("/follows/followers", { params: { followedUserId } });
export const follow = (data) => apiClient.post("/follows", data);
export const unfollow = (followId) => apiClient.delete(`/follows/${followId}`);
// --- API cho huy hiệu ---
export const getAllBadges = () => apiClient.get("/badges");
export const getUserBadges = (userId) =>
  apiClient.get("/userbadges", { params: { userId } });

// --- API cho bảng xếp hạng ---
export const getTopCommenter = () => apiClient.get("/users/top-commenter");
export const getTopPointsUser = () => apiClient.get("/users/top-points");
export const getTopDownloadedDocument = () =>
  apiClient.get("/documents/top-downloaded");
export const getTopDownloadedDocumentsList = (limit = 5) => {
  return apiClient.get(`/documents/rankings/top-downloads?limit=${limit}`);
};

// --- API cho trường học ---
export const getSchools = () => apiClient.get("/schools");
export const createSchool = async (schoolData) => {
  const formData = new FormData();
  formData.append("Name", schoolData.name);
  formData.append("Logo", schoolData.logo);
  formData.append("ExternalUrl", schoolData.externalUrl);
  return await apiClient.post("/schools", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const updateSchool = async (id, schoolData) => {
  const formData = new FormData();
  formData.append("Name", schoolData.name);
  if (schoolData.logo) {
    formData.append("Logo", schoolData.logo);
  }
  formData.append("ExternalUrl", schoolData.externalUrl);
  return await apiClient.put(`/schools/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
export const deleteSchool = async (id) => {
  return await apiClient.delete(`/schools/${id}`);
};

// Chatbot
export const sendChatbotQuery = (data) =>
  apiClient.post("/chatbot/query", data);

export default apiClient;
// --- API cho VIP ---
export const subscribeVip = (data) =>
  apiClient.post("/VipSubscriptions/subscribe", data);

export const getUserVipSubscriptions = (userId) =>
  apiClient.get(`/VipSubscriptions/user/${userId}`);

export const getActiveVipSubscription = (userId) =>
  apiClient.get(`/VipSubscriptions/user/${userId}/active`);

export const checkAndUpdateExpiredSubscriptions = () =>
  apiClient.post("/VipSubscriptions/check-expiry");

// --- API cho Báo cáo Vi phạm ---
export const createReport = (data) => apiClient.post("/reports", data);

// (Tùy chọn - Dành cho trang quản trị)
export const getAllReports = (params) => apiClient.get("/reports", { params });
export const getProcessedReports = (params) => apiClient.get("/reports/processed", { params });
export const updateReportStatus = (id, status) => apiClient.put(`/reports/${id}/status`, { status });
export const resetDocumentReports = (documentId) => apiClient.put(`/documents/${documentId}/reset-reports`);
export const getReportsByDocumentId = (documentId) => apiClient.get(`/reports/document/${documentId}`);
