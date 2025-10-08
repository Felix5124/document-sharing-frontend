// icons.js - File quản lý tập trung các icon Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { faEnvelope, faLock, faUser, faSpinner, faSignInAlt, faSearch, faDownload, faFolder, faEye, faThumbsUp, faBell, faHome, faBookmark } from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faFacebook } from '@fortawesome/free-brands-svg-icons';

// Thêm các icon vào thư viện để sử dụng toàn cục
library.add(
  // Solid Icons
  faEnvelope, faLock, faUser, faSpinner, faSignInAlt, faSearch, 
  faDownload, faFolder, faEye, faThumbsUp, faBell, faHome, faBookmark,
  
  // Brand Icons
  faGoogle, faFacebook
);

// Export các icon riêng lẻ để sử dụng khi cần
export {
  faEnvelope, faLock, faUser, faSpinner, faSignInAlt, faSearch,
  faDownload, faFolder, faEye, faThumbsUp, faBell, faHome, faBookmark,
  faGoogle, faFacebook
};