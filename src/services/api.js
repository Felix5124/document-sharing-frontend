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
    // Extra debug: if sending FormData (multipart) log its contents (but do not log token)
    try {
      const method = (config.method || '').toLowerCase();
      const isDocumentEndpoint = config.url && config.url.toString().includes('/documents');
      const isMultipart = (config.headers && config.headers['Content-Type'] && config.headers['Content-Type'].includes('multipart/form-data')) || (typeof FormData !== 'undefined' && config.data instanceof FormData);
      if (isMultipart && (method === 'post' || method === 'put') && isDocumentEndpoint) {
        try {
          // Ensure axios/browser will set the correct multipart boundary by removing any preset JSON Content-Type
          try {
            if (config.headers) {
              delete config.headers['Content-Type'];
              delete config.headers['content-type'];
            }
          } catch (hdrErr) {
            console.warn('[api] Could not remove Content-Type header', hdrErr);
          }
          console.log('[api] Sending multipart FormData to', config.url, 'method', method);
          if (config.data && typeof config.data.entries === 'function') {
            for (const pair of config.data.entries()) {
              const key = pair[0];
              const value = pair[1];
              if (value && typeof value === 'object' && value instanceof File) {
                console.log(`[api] FormData file field: ${key} -> name=${value.name}, size=${value.size}, type=${value.type}`);
              } else if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'File') {
                console.log(`[api] FormData file field: ${key} -> name=${value.name}, size=${value.size}, type=${value.type}`);
              } else {
                console.log(`[api] FormData field: ${key} ->`, value);
              }
            }
          }
        } catch (fdErr) {
          console.warn('[api] Failed to enumerate FormData entries', fdErr);
        }
      }
    } catch (e) {
      console.warn('[api] Request debug logging failed', e);
    }

    return config;
  },
  (error) => {
    console.error("Interceptor request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to log errors and helpful debug info
apiClient.interceptors.response.use(
  (response) => {
    // Log document update/create responses for debugging
    try {
      const url = response.config?.url || '';
      if (url.includes('/documents') && (response.config.method === 'post' || response.config.method === 'put')) {
        console.log('[api] Document response:', response.status, url, response.data);
      }
    } catch (e) {
      // ignore
    }
    return response;
  },
  (error) => {
    try {
      const config = error.config || {};
      const url = config.url || '';
      if (url.includes('/documents')) {
        console.error('[api] Document request failed:', url, error.response?.status, error.response?.data || error.message);
      } else {
        console.error('[api] Request failed:', url, error.response?.status, error.response?.data || error.message);
      }
    } catch (e) {
      console.error('[api] Response interceptor error logging failed', e);
    }
    return Promise.reject(error);
  }
);

// --- API cho người dùng ---
// (Giữ nguyên các API người dùng, không thay đổi)
export const register = (data) => apiClient.post("/users/register", data);
export const verifyEmail = (token, email) => apiClient.post("/users/verify-email", { token, email });
export const getUserByFirebaseUid = (uid) =>
  apiClient.get(`/Users/by-uid/${uid}`);
export const createBackendUserForAuthProvider = async (payload) => {
  try {
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
export const changePassword = (data) => apiClient.post("/users/change-password", data);
export const forgotPassword = (data) => apiClient.post("/users/forgot-password", data);
export const resetPassword = (data) => apiClient.post("/users/reset-password", data);

// --- API cho tài liệu ---
export const getDocuments = (params) => apiClient.get("/documents", { params });
export const getDocumentById = (id, userId) => {
  const params = userId ? { userId } : {};
  return apiClient.get(`/documents/${id}`, { params });
};
export const uploadDocument = (data) => apiClient.post("/documents/upload", data);
export const updateDocument = (id, data) => apiClient.put(`/documents/${id}`, data);

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

export const checkUserHasDownloaded = (documentId, userId) => {
  return apiClient.get(`/documents/${documentId}/check-downloaded`, {
    params: { userId },
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
export const lockDocument = (id, isLocked) =>
  apiClient.put(`/documents/${id}/lock`, { isLocked });
export const getAdminDocuments = (params) =>
  apiClient.get('/documents/admin/list', { params });

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
export const markAllNotificationsAsRead = (userId) =>
  apiClient.put(`/notifications/mark-all-read`, null, { params: { userId } });
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
export const getTopUploader = () => apiClient.get("/users/rankings/uploads?limit=1");
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

// --- API cho Payment ---
export const createPayment = (data) =>
  apiClient.post("/payments/create", data);

export const checkPaymentStatus = (orderCode) =>
  apiClient.get(`/payments/check/${orderCode}`);

export const getPendingPayments = () =>
  apiClient.get("/payments/pending");

export const confirmPayment = (data) =>
  apiClient.post("/payments/confirm", data);

export const cancelPayment = (paymentId, data) =>
  apiClient.post(`/payments/cancel/${paymentId}`, data);

export const getUserPayments = (userId) =>
  apiClient.get(`/payments/user/${userId}`);

export const getAllPayments = (page = 1, pageSize = 20) =>
  apiClient.get(`/payments/all?page=${page}&pageSize=${pageSize}`);

export const getAdminPaymentsList = (params) =>
  apiClient.get('/payments/admin/list', { params });

// --- API cho Báo cáo Vi phạm ---
export const createReport = (data) => apiClient.post("/reports", data);
// API cho quản trị viên lấy danh sách người dùng với phân trang và lọc
export const getAdminUsers = (params) => apiClient.get('/users/admin/list', { params });

// (Tùy chọn - Dành cho trang quản trị)
export const getAllReports = (params) => apiClient.get("/reports", { params });
export const getProcessedReports = (params) => apiClient.get("/reports/processed", { params });
export const updateReportStatus = (id, status) => apiClient.put(`/reports/${id}/status`, { status });
export const resetDocumentReports = (documentId) => apiClient.put(`/documents/${documentId}/reset-reports`);
export const getReportsByDocumentId = (documentId) => apiClient.get(`/reports/document/${documentId}`);

export const getStatistics = () => apiClient.get("/documents/statistics");
