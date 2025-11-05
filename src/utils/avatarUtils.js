import api from '../services/api';

// Cấu hình Azure Blob cho avatars
const DEFAULT_BLOB_BASE = 'https://docsharestorage0.blob.core.windows.net';
const DEFAULT_AVATAR_URL = `${DEFAULT_BLOB_BASE}/avatars/default-avatar.png`;

/**
 * Hàm lấy URL đầy đủ của ảnh đại diện user
 * @param {string} relativePath Đường dẫn tương đối được trả về từ BE (vd: "avatars/abc.jpg" hoặc "abc.jpg")
 * @returns {string} URL hoàn chỉnh để hiển thị
 */
export const getFullAvatarUrl = (relativePath) => {
  // Nếu BE chưa gán avatar (null, undefined, rỗng)
  if (!relativePath || typeof relativePath !== 'string' || relativePath.trim() === '') {
    return DEFAULT_AVATAR_URL;
  }

  // Nếu BE đã trả về URL đầy đủ (có http hoặc https) => dùng luôn
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  // Là đường dẫn tương đối: xử lý các trường hợp blob và static
  const cleanRelativePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;

  // 1) Nếu có prefix container 'avatars/' -> trả về link blob thực
  if (cleanRelativePath.startsWith('avatars/')) {
    return `${DEFAULT_BLOB_BASE}/${cleanRelativePath}`;
  }

  // 2) Nếu chỉ là tên file (không có "/") -> giả định thuộc container avatars
  if (!cleanRelativePath.includes('/')) {
    return `${DEFAULT_BLOB_BASE}/avatars/${cleanRelativePath}`;
  }

  // 3) Còn lại: nối vào backend base (trường hợp ảnh static trong wwwroot)
  let apiBaseUrl = '';

  try {
    if (api && api.defaults && typeof api.defaults.baseURL === 'string') {
      apiBaseUrl = api.defaults.baseURL.replace('/api', '');
    } else {
      console.warn('API base URL không được cấu hình. Dùng fallback local path.');
      return `/${cleanRelativePath}`;
    }
  } catch (e) {
    console.error('Lỗi khi lấy API base URL cho avatar:', e);
    return `/${cleanRelativePath}`;
  }

  const cleanApiBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  return `${cleanApiBaseUrl}/${cleanRelativePath}`;
};
