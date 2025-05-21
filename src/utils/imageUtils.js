import api from '../services/api'; 

const defaultImageRelativePath = 'ImageCovers/cat.jpg';

export const getFullImageUrl = (relativePath) => {
  let apiBaseUrl = '';
  try {
    if (api && api.defaults && typeof api.defaults.baseURL === 'string') {
      apiBaseUrl = api.defaults.baseURL.replace('/api', '');
    } else {
      console.warn('API base URL không được cấu hình. Đường dẫn ảnh có thể không chính xác.');
      const imagePath = (relativePath && typeof relativePath === 'string' && relativePath.trim() !== '') ? relativePath : defaultImageRelativePath;
      return `/${imagePath.startsWith('/') ? imagePath.substring(1) : imagePath}`;
    }
  } catch (e) {
    console.error("Lỗi khi lấy API base URL cho ảnh:", e);
    const imagePath = (relativePath && typeof relativePath === 'string' && relativePath.trim() !== '') ? relativePath : defaultImageRelativePath;
    return `/${imagePath.startsWith('/') ? imagePath.substring(1) : imagePath}`;
  }

  if (!relativePath || typeof relativePath !== 'string' || relativePath.trim() === '') {
    const separator = apiBaseUrl.endsWith('/') ? '' : '/';
    return `${apiBaseUrl}${separator}${defaultImageRelativePath}`;
  }
  
  const cleanApiBaseUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  const cleanRelativePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  
  return `${cleanApiBaseUrl}/${cleanRelativePath}`;
};