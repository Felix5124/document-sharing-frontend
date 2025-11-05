import api from '../services/api';

// Ảnh mặc định lấy từ Azure blob thật
const DEFAULT_BLOB_BASE = 'https://docsharestorage0.blob.core.windows.net';
const DEFAULT_PLACEHOLDER_URL = `${DEFAULT_BLOB_BASE}/covers/default-cover.png`;

export const getFullImageUrl = (relativePath) => {
  // 1. Nếu không có path → trả ảnh mặc định
  if (!relativePath || typeof relativePath !== 'string' || relativePath.trim() === '') {
    return DEFAULT_PLACEHOLDER_URL;
  }

  // 2. Nếu path đã là URL tuyệt đối → trả nguyên xi
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  // 3. Nếu là blob container (covers, avatars, documents) → nối vào blob Azure
  if (
    relativePath.startsWith('covers/') ||
    relativePath.startsWith('avatars/') ||
    relativePath.startsWith('documents/')
  ) {
    return `${DEFAULT_BLOB_BASE}/${relativePath}`;
  }

  // 4. Còn lại mới nối vào backend (VD: ảnh static trong wwwroot)
  let apiBaseUrl = '';
  try {
    if (api && api.defaults && typeof api.defaults.baseURL === 'string') {
      apiBaseUrl = api.defaults.baseURL.replace('/api', '');
    }
  } catch (e) {
    console.warn('Không thể lấy baseURL của API:', e);
  }

  const cleanApiBaseUrl = apiBaseUrl.endsWith('/')
    ? apiBaseUrl.slice(0, -1)
    : apiBaseUrl;

  const cleanRelativePath = relativePath.startsWith('/')
    ? relativePath.substring(1)
    : relativePath;

  return `${cleanApiBaseUrl}/${cleanRelativePath}`;
};
