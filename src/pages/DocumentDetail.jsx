import { Document, Page } from 'react-pdf';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getDocumentById,
  getCommentsByDocument,
  downloadDocument,
  prepareDownload,
  confirmDownload,
  previewDocument,
  follow,
  unfollow,
  getUserFollowing,
  addComment,
  getRelatedDocuments,
  checkUserHasDownloaded,
  getUser
} from '../services/api';
import { getActiveVipSubscription } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faDownload, faFolder, faFile, faDatabase, faCalendar, faTags, faArrowRight, faUser, faPaperPlane, faCommentDots, faPlusCircle, faFlag, faCircleExclamation, faExclamationTriangle, faClock, faLock, faCheckCircle, faSpinner } from '@fortawesome/free-solid-svg-icons';

import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useEffect, useState, useContext } from 'react';
import { getFullImageUrl } from '../utils/imageUtils';
import { getFullAvatarUrl } from '../utils/avatarUtils';
import '../config/pdfConfig';
import { formatFileSize } from '../utils/fileUtils';
import StarRatingDisplay from '../components/DocumentDetail/StarRatingDisplay';
import StarRatingInput from '../components/DocumentDetail/StarRatingInput';
import CustomModal from '../components/DocumentDetail/CustomModal';
import CustomButton from '../components/DocumentDetail/CustomButton';
import CustomForm, { FormGroup, FormLabel, FormControl } from '../components/DocumentDetail/CustomForm';
import ReportModal from '../components/ReportModal';
import VipPromoBanner from '../components/VipPromoBanner';
import VipWelcomeBanner from '../components/VipWelcomeBanner';
import RightSidebar from '../components/RightSidebar';
import '../styles/pages/DocumentDetail.css';
import '../styles/layouts/PageWithSidebar.css';



function DocumentDetail() {
  // ... (Toàn bộ hooks và functions xử lý logic giữ nguyên, không thay đổi) ...
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUserContext } = useContext(AuthContext);
  const [loadingState, setLoadingState] = useState('loading'); // Các giá trị có thể là: 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [doc, setDoc] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState({ Content: '', Rating: 5 });
  const [pdfData, setPdfData] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followId, setFollowId] = useState(null); // Store follow ID for unfollow
  const [loadingFollow, setLoadingFollow] = useState(false);
  const [loadingFollowStatus, setLoadingFollowStatus] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatedComments, setTotalRatedComments] = useState(0);
  const [relatedDocsByCategory, setRelatedDocsByCategory] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [hasAlreadyReported, setHasAlreadyReported] = useState(false); // <-- STATE MỚI
  const [hasActiveVip, setHasActiveVip] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [downloadReady, setDownloadReady] = useState(false);
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);
  const [preparedDownloadData, setPreparedDownloadData] = useState(null);
  const [hideLeftSidebar, setHideLeftSidebar] = useState(false);
  const [hideRightSidebar, setHideRightSidebar] = useState(false);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, type: '' });


  // Handle context menu
  const handleContextMenu = (e, type) => {
    if (!user?.isVip) return;
    e.preventDefault();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, type });
  };

  const handleToggleSidebar = (type) => {
    if (type === 'left') {
      setHideLeftSidebar(!hideLeftSidebar);
    } else if (type === 'right') {
      setHideRightSidebar(!hideRightSidebar);
    }
    setContextMenu({ show: false, x: 0, y: 0, type: '' });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu({ show: false, x: 0, y: 0, type: '' });
    if (contextMenu.show) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.show]);

  useEffect(() => {
    setDoc(null);
    setComments([]);
    clearPdfData();
    setRelatedDocsByCategory([]);
    setIsDescriptionExpanded(false);
    setAverageRating(0);
    setTotalRatedComments(0);
    setIsFollowing(false);
    setFollowId(null); // Reset follow ID
    setLoadingFollowStatus(true); // Reset loading status
    setHasDownloaded(false);

    // --- BẮT ĐẦU THAY ĐỔI ---
    // Chỉ fetch dữ liệu khi có ID và thông tin user đã sẵn sàng (hoặc user là null cho khách)
    // Việc thêm `user` vào dependency array sẽ tự động gọi lại fetchDocument khi user được xác thực.
    fetchDocument();
    // --- KẾT THÚC THAY ĐỔI ---

    fetchComments(); // fetchComments có thể chạy độc lập
  }, [id, user]); // THAY ĐỔI QUAN TRỌNG: Thêm `user` vào dependency array

  // Lock body scroll when preview modal is open
  useEffect(() => {
    if (isPreviewOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original || '';
      };
    }
  }, [isPreviewOpen]);

  // Check active VIP when preview opens or user changes
  useEffect(() => {
    const checkVip = async () => {
      try {
        if (user && user.userId) {
          const res = await getActiveVipSubscription(user.userId);
          const data = res?.data;
          // Accept a few possible shapes
          const active = !!(data && (data.isActive === true || data.active === true || Object.keys(data).length > 0));
          setHasActiveVip(active);
        } else {
          setHasActiveVip(false);
        }
      } catch {
        setHasActiveVip(false);
      }
    };
    if (isPreviewOpen) {
      checkVip();
    }
  }, [isPreviewOpen, user]);

  useEffect(() => {
    if (user && user.userId && doc?.uploadedBy) {
      checkFollowStatus();
    }
  }, [user, doc]);

  useEffect(() => {
    const checkDownloadStatus = async () => {
      if (user && user.userId && doc?.documentId) {
        try {
          const response = await checkUserHasDownloaded(doc.documentId, user.userId);
          const downloaded = response.data.hasDownloaded || false;

          setHasDownloaded(downloaded);
        } catch (error) {
          console.error('Error checking download status:', error);
          setHasDownloaded(false);
        }
      } else {
        setHasDownloaded(false);
      }
    };
    checkDownloadStatus();
  }, [user, doc]);

  useEffect(() => {
    if (comments && comments.length > 0) {
      const validCommentsWithRating = comments.filter(c => c.Rating != null && !isNaN(parseInt(c.Rating)) && c.Rating > 0);
      if (validCommentsWithRating.length > 0) {
        const sum = validCommentsWithRating.reduce((acc, curr) => acc + parseInt(curr.Rating), 0);
        setAverageRating(parseFloat((sum / validCommentsWithRating.length).toFixed(1)));
        setTotalRatedComments(validCommentsWithRating.length);
      } else {
        setAverageRating(0);
        setTotalRatedComments(0);
      }
    } else {
      setAverageRating(0);
      setTotalRatedComments(0);
    }
  }, [comments]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (doc && doc.documentId && doc.categoryId) {
        try {
          const responseCategory = await getRelatedDocuments(doc.documentId, 4);
          let dataArrayCategory = responseCategory.data?.$values || responseCategory.data || [];
          setRelatedDocsByCategory(Array.isArray(dataArrayCategory) ? dataArrayCategory : []);
        } catch {
          setRelatedDocsByCategory([]);
        }
      }
    };

    if (doc) {
      fetchRelated();
    }
  }, [doc]);

  const fetchDocument = async () => {
    setLoadingState('loading'); // Bắt đầu với trạng thái loading
    try {
      // --- THAY ĐỔI CÁCH GỌI API ---
      const response = user
        ? await getDocumentById(id, user.userId)
        : await getDocumentById(id);


      setDoc(response.data);

      // --- CẬP NHẬT STATE MỚI ---
      setHasAlreadyReported(response.data.hasReported || false);
      setLoadingState('success'); // Chuyển sang trạng thái thành công
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setErrorMessage('Tài liệu bạn tìm kiếm không tồn tại, đã bị xóa, hoặc đã bị khóa bởi quản trị viên.');
      } else {
        setErrorMessage('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.');
      }
      setLoadingState('error'); // Chuyển sang trạng thái lỗi
      setDoc(null);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await getCommentsByDocument(id);
      let data = response.data;
      if (data && Array.isArray(data.$values)) {
        data = data.$values;
      } else if (!Array.isArray(data)) {
        data = [];
      }
      const fetchedComments = data.map((item) => ({
        CommentId: item.commentId,
        Content: item.content,
        Rating: item.rating != null ? parseInt(item.rating) : 0,
        CreatedAt: item.createdAt,
        UserId: item.userId,
        UserEmail: item.userEmail || 'Ẩn danh',
        UserFullName: item.userFullName || null,
        AvatarUrl: item.avatarUrl || null,
      }));
      setComments(fetchedComments);
    } catch {
      setComments([]);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !user.userId || !doc || !doc.uploadedBy) {
      setLoadingFollowStatus(false);
      return;
    }
    setLoadingFollowStatus(true);
    try {
      const response = await getUserFollowing(user.userId);
      const follows = Array.isArray(response.data?.$values) ? response.data.$values : (Array.isArray(response.data) ? response.data : []);
      const currentFollow = follows.find(follow => follow.followedUserId === doc.uploadedBy);
      if (currentFollow) {
        setIsFollowing(true);
        setFollowId(currentFollow.followId); // Store follow ID for unfollow
      } else {
        setIsFollowing(false);
        setFollowId(null);
      }
    } catch {
      // Ignore follow status check errors
    } finally {
      setLoadingFollowStatus(false);
    }
  };

  // Hàm kiểm tra xem user có thể tải không
  const canUserDownload = () => {
    if (!user || !user.userId) {
      return { canDownload: false, reason: 'Vui lòng đăng nhập để tải tài liệu.' };
    }

    // Kiểm tra nếu là tài liệu VIP mà user không phải VIP
    if (doc?.isVipOnly && !user.isVip) {
      return { canDownload: false, reason: 'Đây là tài liệu Premium. Vui lòng nâng cấp tài khoản để tải.' };
    }

    // Tính lượt tải còn lại
    const now = new Date();
    const lastReset = user.lastDownloadResetDate ? new Date(user.lastDownloadResetDate) : null;
    const isSameDay = lastReset && 
      now.getFullYear() === lastReset.getFullYear() &&
      now.getMonth() === lastReset.getMonth() &&
      now.getDate() === lastReset.getDate();

    let dailyUsed, bonusCount, dailyLimit, remaining;
    
    if (doc?.isVipOnly) {
      // Tài liệu Premium
      dailyUsed = isSameDay ? (user.vipDownloadsUsedToday || 0) : 0;
      bonusCount = user.vipBonusDownloads || 0;
      dailyLimit = user.isVip ? 10 : 0;
      remaining = Math.max(0, dailyLimit - dailyUsed) + bonusCount;
      
      console.log('🔍 Check Premium download:', { dailyUsed, bonusCount, dailyLimit, remaining, isSameDay, user });
      
      if (remaining <= 0) {
        return { canDownload: false, reason: 'Bạn đã hết lượt tải tài liệu Premium.' };
      }
    } else {
      // Tài liệu thường
      dailyUsed = isSameDay ? (user.regularDownloadsUsedToday || 0) : 0;
      bonusCount = user.regularBonusDownloads || 0;
      dailyLimit = user.isVip ? 10 : 2;
      remaining = Math.max(0, dailyLimit - dailyUsed) + bonusCount;
      
      console.log('🔍 Check Regular download:', { dailyUsed, bonusCount, dailyLimit, remaining, isSameDay, user });
      
      if (remaining <= 0) {
        return { canDownload: false, reason: 'Bạn đã hết lượt tải tài liệu thường.' };
      }
    }

    return { canDownload: true, reason: '' };
  };

  const handleDownload = () => {
    const { canDownload, reason } = canUserDownload();
    
    if (!canDownload) {
      setErrorMessage(reason);
      setShowErrorModal(true);
      return;
    }
    
    // Không dùng modal nữa, gọi trực tiếp performDownload
    performDownload();
  };

  const performDownload = async () => {
    try {
      setIsPreparingDownload(true);
      setDownloadReady(false);

      // Gọi API prepare (KHÔNG trừ lượt)
      const response = await prepareDownload(id, user.userId);

      // Backend trả JSON với url và fileName
      const { url, fileName } = response.data;

      if (!url) {
        setErrorMessage('Không thể lấy URL tải xuống từ server.');
        setShowErrorModal(true);
        setIsPreparingDownload(false);
        return;
      }

      // Download file từ SAS URL
      const fileResponse = await fetch(url);
      if (!fileResponse.ok) {
        throw new Error(`Không thể tải file: ${fileResponse.status} ${fileResponse.statusText}`);
      }

      const blob = await fileResponse.blob();

      // Tạo download link và lưu sẵn
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Lưu dữ liệu để dùng khi user xác nhận
      setPreparedDownloadData({
        downloadUrl,
        fileName: fileName || `${doc.title || 'document'}.${doc.fileType || 'bin'}`
      });
      
      setIsPreparingDownload(false);
      setDownloadReady(true);
      
      // Hiển thị modal xác nhận tải xuống
      setShowConfirmModal(true);

    } catch (error) {
      let message = 'Đã xảy ra lỗi khi tải tài liệu.';
      if (error.response?.data) {
        message = error.response.data.message || error.response.data.toString() || message;
      } else if (error.message) {
        message = error.message;
      }
      setErrorMessage(message);
      setShowErrorModal(true);
      setIsPreparingDownload(false);
      setDownloadReady(false);
    }
  };

  const handleConfirmDownload = async () => {
    if (!preparedDownloadData) return;
    
    setShowConfirmModal(false);
    
    try {
      // GỌI API XÁC NHẬN TẢI (TRỪ LƯỢT)
      await confirmDownload(id, user.userId);
      
      // Thực hiện tải xuống
      const link = document.createElement('a');
      link.href = preparedDownloadData.downloadUrl;
      link.setAttribute('download', preparedDownloadData.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(preparedDownloadData.downloadUrl);

      setDoc((prevDoc) => ({
        ...prevDoc,
        downloadCount: (prevDoc.downloadCount || 0) + 1,
      }));
      setHasDownloaded(true);
      
      // Refresh user data to update download counts
      if (user?.userId) {
        try {
          const userResponse = await getUser(user.userId);
          if (userResponse?.data) {
            updateUserContext(userResponse.data);
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }
      
      // Cleanup
      setPreparedDownloadData(null);
      setDownloadReady(false);
    } catch (error) {
      console.error('Lỗi khi xác nhận tải:', error);
      toast.error('Không thể xác nhận tải xuống. Vui lòng thử lại.');
      
      // Cleanup on error
      if (preparedDownloadData?.downloadUrl) {
        window.URL.revokeObjectURL(preparedDownloadData.downloadUrl);
      }
      setPreparedDownloadData(null);
      setDownloadReady(false);
    }
  };
  
  const handleCancelDownload = () => {
    setShowConfirmModal(false);
    
    // Cleanup prepared download data
    if (preparedDownloadData?.downloadUrl) {
      window.URL.revokeObjectURL(preparedDownloadData.downloadUrl);
    }
    setPreparedDownloadData(null);
    setDownloadReady(false);
  };
  const handleCloseErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  const clearPdfData = () => {
    setPdfData(null);
    try {
      if (pdfData) window.URL.revokeObjectURL(pdfData);
    } catch {
      // Ignore URL revocation errors
    }
  };

  const handlePreview = async () => {
    if (doc.fileType?.toLowerCase() !== 'pdf') {
      setErrorMessage('Chức năng xem trước chỉ hỗ trợ file PDF.');
      setShowErrorModal(true);
      return;
    }
    if (pdfData) {
      setIsPreviewOpen(true);
      return;
    }
    try {
      setIsLoadingPreview(true);
      const response = await previewDocument(id);

      // Backend trả JSON với url
      if (response.data && response.data.url) {
        const { url } = response.data;

        // Fetch file từ SAS URL
        const fileResponse = await fetch(url);
        if (!fileResponse.ok) {
          throw new Error(`Không thể tải file preview: ${fileResponse.status} ${fileResponse.statusText}`);
        }

        const arrayBuffer = await fileResponse.arrayBuffer();

        // Tạo blob URL cho PDF viewer
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const pdfUrl = window.URL.createObjectURL(blob);
        setPdfData(pdfUrl);
        setIsPreviewOpen(true);
      } else {
        setErrorMessage('Không thể lấy URL xem trước từ server.');
        setShowErrorModal(true);
      }
    } catch (error) {
      let msg = 'Không thể xem trước tài liệu.';
      if (error.response?.data?.message) {
        msg = error.response.data.message;
      } else if (error.message) {
        msg = error.message;
      }
      setErrorMessage(msg);
      setShowErrorModal(true);
      setPdfData(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };

  const toggleDescription = () => setIsDescriptionExpanded(!isDescriptionExpanded);

  const handleFollowAuthor = async () => {
    if (!user || !user.userId) {
      setErrorMessage('Vui lòng đăng nhập để theo dõi tác giả.');
      setShowErrorModal(true);
      return;
    }
    if (!doc?.uploadedBy) {
      setErrorMessage('Không tìm thấy thông tin tác giả.');
      setShowErrorModal(true);
      return;
    }
    setLoadingFollow(true);
    try {
      if (isFollowing && followId) {
        // Unfollow
        await unfollow(followId);
        setIsFollowing(false);
        setFollowId(null);
        toast.success('Đã hủy theo dõi tác giả.');
      } else {
        // Follow
        const followData = { UserId: user.userId, FollowedUserId: doc.uploadedBy };
        const response = await follow(followData);
        setIsFollowing(true);
        // Extract follow ID from response
        if (response.data && response.data.followId) {
          setFollowId(response.data.followId);
        }
        toast.success('Đã theo dõi tác giả.');
      }
    } catch (error) {
      const errData = error.response?.data;
      let msg = 'Không thể thực hiện hành động theo dõi.';
      if (typeof errData === 'string') msg = errData;
      else if (errData?.detail) msg = errData.detail;
      else if (errData?.message) msg = errData.message;
      setErrorMessage(msg);
      setShowErrorModal(true);
    } finally {
      setLoadingFollow(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user || !user.userId) {
      toast.error('Vui lòng đăng nhập để bình luận.');
      navigate('/login');
      return;
    }
    if (!hasDownloaded) {
      return;
    }
    if (!comment.Content.trim()) {
      toast.error('Nội dung bình luận không được để trống.');
      return;
    }
    try {
      const commentData = {
        DocumentId: parseInt(id),
        Content: comment.Content,
        Rating: comment.Rating,
        UserId: user.userId,
      };
      await addComment(commentData);
      toast.success('Bình luận đã được gửi.');
      setComment({ Content: '', Rating: 5 });
      fetchComments();
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data || 'Không thể gửi bình luận.');
    }
  };

  const onDocumentLoadSuccess = ({ numPages: loadedNumPages }) => {
    setNumPages(loadedNumPages);
  };

  // Số trang preview tối đa theo loại tài khoản
  const getPreviewLimit = () => {
    if (hasActiveVip || (user && user.isVip)) return 15;
    return 2;
  };
  const previewLimit = getPreviewLimit();

  if (loadingState === 'loading') {
    return (
      <div className="loading-container">
        <h4>Đang tải...</h4>
        <div className="loading-spinner" role="status"></div>
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="all-container">
        <div className="error-display-card">
          <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="error-icon" />
          <h3>Không thể truy cập tài liệu</h3>
          <p>{errorMessage}</p>
          <button onClick={() => navigate('/')} className="back-to-home-btn">
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const MAX_INITIAL_LINES = 3;
  const MAX_CHARS_WHEN_FEW_LINES = 220;
  let finalDisplayDescription;
  let shouldShowReadMoreButton = false;

  if (doc.description && typeof doc.description === 'string' && doc.description.trim() !== '') {
    const lines = doc.description.split('\n');
    let needsCollapsingFeature = false;
    if (lines.length > MAX_INITIAL_LINES) {
      needsCollapsingFeature = true;
    } else if (doc.description.length > MAX_CHARS_WHEN_FEW_LINES) {
      needsCollapsingFeature = true;
    }
    if (needsCollapsingFeature) {
      shouldShowReadMoreButton = true;
      if (isDescriptionExpanded) {
        finalDisplayDescription = doc.description;
      } else {
        if (lines.length > MAX_INITIAL_LINES) {
          finalDisplayDescription = lines.slice(0, MAX_INITIAL_LINES).join('\n') + '...';
        } else {
          finalDisplayDescription = doc.description.substring(0, MAX_CHARS_WHEN_FEW_LINES) + '...';
        }
      }
    } else {
      finalDisplayDescription = doc.description;
      shouldShowReadMoreButton = false;
    }
  } else {
    finalDisplayDescription = "Không có mô tả.";
    shouldShowReadMoreButton = false;
  }

  return (
    <div className="all-container">
      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          className="sidebar-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={() => handleToggleSidebar(contextMenu.type)}>
            {(contextMenu.type === 'left' && hideLeftSidebar) || (contextMenu.type === 'right' && hideRightSidebar) 
              ? '👁️ Hiển thị' 
              : '🚫 Ẩn'}
          </button>
        </div>
      )}

      <div className={`page-layout-with-sidebar ${user?.isVip ? 'no-left-sidebar' : ''}`}>
        {/* Left Sidebar - VIP Banner */}
        {!user && (
          <aside className="page-sidebar">
            <VipPromoBanner variant="document" />
          </aside>
        )}
        {user && !user.isVip && (
          <aside className="page-sidebar">
            <VipPromoBanner variant="document" />
          </aside>
        )}
        {user?.isVip && (
          <aside 
            className="page-sidebar"
            onContextMenu={(e) => handleContextMenu(e, 'left')}
            style={{ cursor: 'context-menu' }}
          >
            {!hideLeftSidebar && <VipWelcomeBanner />}
          </aside>
        )}

        {/* Main Content */}
        <div className="page-main-content">
          <div className="document-detail-page">
            <div className="document-detail-container">
        {/* === MAIN CONTENT SECTION === */}
        <div className="layout-grid main-content-section">
          <div className="layout-column full-width">
            {/* THÊM MỚI: Banner thông báo */}
            {doc.approvalStatus === 'SemiApproved' && (
              <div className="status-banner semi-approved">
                <FontAwesomeIcon icon={faCircleExclamation} />
                <span>Tài liệu này đã qua kiểm tra tự động nhưng chưa được cộng đồng xác thực hoàn toàn.</span>
              </div>
            )}
            {doc.approvalStatus === 'Approved' && (
              <div className="status-banner approved">
                <FontAwesomeIcon icon={faCircleExclamation} />
                <span>Tài liệu này đã được cộng đồng kiểm duyệt và xác thực.</span>
              </div>
            )}
            {doc.approvalStatus === 'Pending' && (
              <div className="status-banner pending">
                <FontAwesomeIcon icon={faClock} />
                <span>Tài liệu này đang chờ quản trị viên duyệt. Các hành động như tải xuống, bình luận và báo cáo tạm thời bị vô hiệu hóa.</span>
              </div>
            )}
            {/* Debug: Hiển thị ApprovalStatus để kiểm tra */}
            <div style={{ display: 'none' }}>
              Current ApprovalStatus: {doc.approvalStatus || 'undefined'}
              Report Count: {doc.reportCount || 0}
            </div>
            <div className="document-header-section">
              <div className="document-title-row">
                <div className="document-title-wrapper">
                  <h1 className="detail-document-title">
                    {doc.title}
                    {(doc.isVipOnly || doc.IsVipOnly) && (
                      <span className="vip-badge-detail" title="Tài liệu Premium">
                        PREMIUM
                      </span>
                    )}
                  </h1>
                </div>
                {/* school logo removed */}
              </div>

              <div className="document-meta-row">
                <div className="author-info">
                  <div className="author-details">
                    <span className="author-name">Tác giả :</span>
                    <span
                      className="author-name clickable-author"
                      onClick={() => doc.uploadedBy && navigate(`/profile/${doc.uploadedBy}`)}
                      style={{ cursor: doc.uploadedBy ? 'pointer' : 'default' }}
                      title={doc.uploadedBy ? 'Xem profile tác giả' : ''}
                    >
                      {doc.user?.fullName || doc.user?.email || 'Ẩn danh'}
                    </span>
                    {user && user.userId !== doc.uploadedBy && doc.uploadedBy && (
                      <CustomButton
                        variant={isFollowing ? "success" : "outline-success"}
                        size="sm"
                        onClick={handleFollowAuthor}
                        disabled={loadingFollow || loadingFollowStatus}
                        className="follow-btn"
                      >
                        {loadingFollowStatus ? (
                          <div className="follow-btn-loading">
                            <div className="follow-btn-spinner"></div>
                            <span>Đang tải...</span>
                          </div>
                        ) : (
                          <>
                            <span className={`follow-icon ${isFollowing ? 'icon-person-check' : 'icon-person-plus'}`}></span>
                            {isFollowing ? 'Đã theo dõi' : loadingFollow ? 'Đang xử lý...' : 'Theo dõi'}
                          </>
                        )}
                      </CustomButton>
                    )}
                  </div>
                  {/* --- THAY ĐỔI LOGIC NÚT BÁO CÁO --- */}
                  {user && (
                    <div>
                      <button
                        className={`report-button ${hasAlreadyReported ? 'already-reported' : ''}`}
                        onClick={() => !hasAlreadyReported && setShowReportModal(true)}
                        disabled={doc.approvalStatus === 'Pending' || hasAlreadyReported}
                        title={
                          hasAlreadyReported
                            ? "Bạn đã báo cáo tài liệu này"
                            : doc.approvalStatus === 'Pending'
                              ? "Không thể báo cáo tài liệu đang chờ duyệt"
                              : "Báo cáo vi phạm"
                        }
                      >
                        <FontAwesomeIcon icon={hasAlreadyReported ? faCheckCircle : faFlag} />
                        {hasAlreadyReported ? 'Đã báo cáo' : 'Báo cáo vi phạm'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="layout-grid top-section">

                {/* === LEFT COLUMN: Cover Image & Actions === */}
                {/* Cover image as a single centered card (removed left/right columns) */}
                <div className="cover-card">
                  <div className="cover-image-wrapper">
                    <img
                      src={getFullImageUrl(doc.coverImageUrl)}
                      alt={doc.title}
                      className="document-cover-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getFullImageUrl(null);
                      }}
                    />
                    <div className="cover-image-overlay">
                      <div className="document-type-badge">
                        {doc.fileType ? doc.fileType.toUpperCase() : 'FILE'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Xóa khu vực xem trước cũ: hiển thị trong modal thay vì inline */}

              </div>
              <div className="action-buttons-section">
                <div className="action-buttons-grid">
                  <CustomButton
                    variant="outline-secondary"
                    onClick={handleDownload}
                    className="action-btn download-btn"
                    disabled={doc.approvalStatus === 'Pending' || !canUserDownload().canDownload || isPreparingDownload}
                      title={
                        doc.approvalStatus === 'Pending' 
                          ? "Tài liệu đang chờ duyệt" 
                          : !canUserDownload().canDownload 
                            ? canUserDownload().reason
                            : isPreparingDownload
                              ? "Đang chuẩn bị file..."
                              : "Tải xuống tài liệu"
                      }
                    >
                      {isPreparingDownload ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin className="btn-icon-detail"/>
                          <div className="btn-content">
                            <span className="btn-text">Đang chuẩn bị file...</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faDownload} className="btn-icon-detail" />
                          <div className="btn-content">
                            <span className="btn-text">Tải xuống ({formatFileSize(doc.fileSize || 0)})</span>
                          </div>
                        </>
                      )}
                    </CustomButton>

                    <CustomButton
                      variant="primary"
                      onClick={handlePreview}
                      disabled={doc.fileType?.toLowerCase() !== 'pdf' || doc.approvalStatus === 'Pending' || isLoadingPreview}
                      className="action-btn preview-btn"
                      title={
                        doc.approvalStatus === 'Pending'
                          ? "Tài liệu đang chờ duyệt"
                          : doc.fileType?.toLowerCase() !== 'pdf'
                            ? "Chỉ hỗ trợ xem trước file PDF"
                            : "Xem Online"
                      }
                    >
                      {!isLoadingPreview && <FontAwesomeIcon icon={faEye} className="btn-icon-detail" />}
                      <span className="btn-text">{isLoadingPreview ? 'Đang tải...' : 'Xem Online (PDF)'}</span>
                    </CustomButton>
                  </div>

                {/* points badge removed */}
              </div>



              <div className="document-stats-row">
                <div className="stats-item">
                  {totalRatedComments > 0 ? (
                    <div className="rating-display">
                      <StarRatingDisplay rating={averageRating} totalReviews={totalRatedComments} />
                      <span className="rating-text">({totalRatedComments} đánh giá)</span>
                    </div>
                  ) : (
                    <span className="no-rating">Chưa có đánh giá</span>
                  )}
                </div>
                <div className="stats-separator">|</div>
                <div className="stats-item">
                  <FontAwesomeIcon icon={faFile} />
                  <span>{doc.fileType ? doc.fileType.toUpperCase() : 'N/A'}</span>
                </div>
                <div className="stats-separator">|</div>
                <div className="stats-item">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  <span>{doc.reportCount || 0} báo cáo</span>
                </div>
              </div>
            </div>

            <div className="document-description-section">
              <div className="description-header">
                <span className="description-label">Mô tả:</span>
              </div>
              <div className="description-content">
                <div className="description-text">
                  {finalDisplayDescription}
                </div>
                {shouldShowReadMoreButton && (
                  <CustomButton
                    variant="link"
                    size="sm"
                    onClick={toggleDescription}
                    className="read-more-btn"
                  >
                    {isDescriptionExpanded ? 'Thu gọn' : 'Đọc thêm'}
                  </CustomButton>
                )}
              </div>
            </div>

            <div className="document-details-card">
              <div className="details-header">
                <h3>Thông tin chi tiết</h3>
              </div>
              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-icon">
                    <FontAwesomeIcon icon={faFolder} />
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Danh mục</div>
                    <div className="detail-value">{doc.category?.name || 'Không có'}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <FontAwesomeIcon icon={faFile} />
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Loại file</div>
                    <div className="detail-value">{doc.fileType?.toUpperCase() || 'N/A'}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <FontAwesomeIcon icon={faDatabase} />
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Kích thước</div>
                    <div className="detail-value">{formatFileSize(doc.fileSize || 0)}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <FontAwesomeIcon icon={faCalendar} />
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Năm tải lên</div>
                    <div className="detail-value">{doc.uploadedAt ? new Date(doc.uploadedAt).getFullYear() : 'N/A'}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">
                    <FontAwesomeIcon icon={faDownload} />
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Lượt tải</div>
                    <div className="detail-value">{doc.downloadCount || 0}</div>
                  </div>
                </div>

                {/* points details removed */}
              </div>

              {doc.tags && doc.tags.length > 0 && (
                <div className="tags-section">
                  <div className="tags-label">Tags:</div>
                  <div className="tags-container">
                    {doc.tags.map(tag => (
                      <Link
                        key={tag.tagId || tag.name}
                        to={`/search?tags=${encodeURIComponent(tag.name)}`}
                        className="tag-item"
                        title={`Tìm tài liệu với tag "${tag.name}"`}
                      >
                        <FontAwesomeIcon icon={faTags} />
                        <span className="tag-text">{tag.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* === MAIN LAYOUT GRID: Image/Preview and Info === */}


            {relatedDocsByCategory && relatedDocsByCategory.length > 0 && (
              <div className="related-documents-section">
                <div className="section-header-detail">
                  <h3 className="section-title">Tài liệu cùng danh mục</h3>
                </div>

                <div className="related-documents-grid">
                  {relatedDocsByCategory.map(relatedDoc => (
                    <div key={relatedDoc.documentId} className="related-document-card">
                      <Link to={`/document/${relatedDoc.documentId}`} className="card-link">
                        <div className="card-image-container">
                          <img
                            src={getFullImageUrl(relatedDoc.coverImageUrl)}
                            className="card-image"
                            alt={relatedDoc.title}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getFullImageUrl(null);
                            }}
                          />
                          <div className="card-overlay">
                            <div className="overlay-icon">
                              <FontAwesomeIcon icon={faArrowRight} />
                            </div>
                          </div>
                        </div>
                        <div className="card-content">
                          <h6 className="card-title" title={relatedDoc.title}>
                            {relatedDoc.title.length > 40 ? relatedDoc.title.substring(0, 40) + '...' : relatedDoc.title}
                          </h6>
                          {relatedDoc.uploadedByEmail && (
                            <div className="card-author">
                              <FontAwesomeIcon icon={faUser} />
                              <span className="author-name-detail" title={relatedDoc.uploadedByEmail}>
                                {relatedDoc.uploadedByEmail.length > 20
                                  ? relatedDoc.uploadedByEmail.substring(0, 20) + '...'
                                  : relatedDoc.uploadedByEmail}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="comments-section">
              <div className="comments-header">
                <div className="comments-title">
                  <FontAwesomeIcon icon={faCommentDots} />
                  <h3>Bình luận và đánh giá</h3>
                  <span className="comments-count">({comments.length})</span>
                </div>
              </div>

              <div className="comment-form-card">
                {/* === THAY ĐỔI 5: VÔ HIỆU HÓA FORM BÌNH LUẬN === */}
                {doc.approvalStatus === 'Pending' && (
                  <div className="form-disabled-overlay">
                    <FontAwesomeIcon icon={faLock} />
                    <span>Không thể bình luận khi tài liệu đang chờ duyệt</span>
                  </div>
                )}

                <div className="comment-form-header">
                  <h5>Chia sẻ đánh giá của bạn</h5>
                </div>
                <div className="comment-form-row">
                  <div className="comment-form-column">
                    <FormGroup className="comment-form-group rating-group">
                      <FormLabel>Đánh giá (sao)</FormLabel>
                      <div className="rating-input-wrapper-star">
                        <StarRatingInput
                          rating={comment.Rating}
                          onChange={(rating) => setComment({ ...comment, Rating: rating })}
                          disabled={doc.approvalStatus === 'Pending'}
                        />
                      </div>
                    </FormGroup>
                  </div>
                </div>
                <CustomForm onSubmit={handleCommentSubmit} className="comment-form">
                  <div className="comment-form-row">
                    <div className="comment-form-column">
                      <FormGroup className="comment-form-group">
                        <FormLabel htmlFor="commentContent">Nội dung bình luận</FormLabel>
                        <FormControl
                          as="textarea"
                          id="commentContent"
                          rows={4}
                          value={comment.Content}
                          onChange={(e) => setComment({ ...comment, Content: e.target.value })}
                          placeholder={
                            !user
                              ? "Vui lòng đăng nhập để bình luận"
                              : doc.approvalStatus === 'Pending'
                                ? "Tài liệu đang chờ duyệt..."
                                : "Chia sẻ ý kiến và đánh giá của bạn về tài liệu này..."
                          }
                          disabled={!user || doc.approvalStatus === 'Pending'}
                          className="comment-textarea"
                        />
                      </FormGroup>
                    </div>
                  </div>



                  <div className="form-actions">
                    <div
                      className="submit-btn-wrapper"
                      title={
                        !user
                          ? "Vui lòng đăng nhập để bình luận"
                          : !hasDownloaded
                            ? "Bạn cần tải tài liệu trước khi đánh giá"
                            : doc.approvalStatus === 'Pending'
                              ? "Tài liệu đang chờ duyệt"
                              : ""
                      }
                    >
                      <CustomButton
                        type="submit"
                        variant="primary"
                        disabled={!user || !comment.Content.trim() || doc.approvalStatus === 'Pending' || !hasDownloaded}
                        className="submit-comment-btn"
                      >
                        <FontAwesomeIcon icon={faPaperPlane} />
                        <span className='comment-detail'>Gửi bình luận</span>
                      </CustomButton>
                    </div>
                  </div>
                </CustomForm>
              </div>

              <div className="comments-display">
                {comments.length > 0 ? (
                  <div className="comments-container">
                    {comments.slice(0, pdfData ? 1 : 5).map((cmt) => (
                      <div key={cmt.CommentId || cmt.UserId + cmt.CreatedAt} className="comment-card">
                        <div className="comment-header">
                          <div className="comment-author">
                            <div className="author-avatar">
                              <img
                                src={getFullAvatarUrl(cmt.AvatarUrl)}
                                alt={cmt.UserFullName || cmt.UserEmail || 'User avatar'}
                                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = getFullAvatarUrl(null);
                                }}
                              />
                            </div>
                            <div className="author-info-comment">
                              <div
                                className="author-name-comment clickable-author-comment"
                                onClick={() => cmt.UserId && navigate(`/profile/${cmt.UserId}`)}
                                style={{ cursor: cmt.UserId ? 'pointer' : 'default' }}
                                title={cmt.UserId ? 'Xem profile' : ''}
                              >
                                {cmt.UserFullName || cmt.UserEmail}
                              </div>
                              <div className="comment-date">
                                {cmt.CreatedAt ? new Date(cmt.CreatedAt).toLocaleString('vi-VN') : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="comment-content">
                          <div className="comment-text">
                            {cmt.Content}
                          </div>
                          {cmt.Rating > 0 && (
                            <div className="comment-rating">
                              <StarRatingDisplay rating={cmt.Rating} totalReviews={1} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {comments.length > (pdfData ? 1 : 5) && (
                      <div className="view-more-comments">
                        <CustomButton
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => navigate(`/postcommentdetail/${id}`)}
                          className="view-all-btn"
                        >
                          <FontAwesomeIcon icon={faPlusCircle} />
                          <span>Xem tất cả {comments.length} bình luận</span>
                        </CustomButton>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-comments">
                    <div className="no-comments-icon">
                      <FontAwesomeIcon icon={faCommentDots} />
                    </div>
                    <div className="no-comments-text">
                      <h5>Chưa có bình luận nào</h5>
                      <p>Hãy là người đầu tiên chia sẻ đánh giá về tài liệu này!</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside 
          className="page-sidebar-right"
          onContextMenu={(e) => handleContextMenu(e, 'right')}
          style={{ cursor: user?.isVip ? 'context-menu' : 'default' }}
        >
          {!hideRightSidebar && <RightSidebar variant="document" user={user} />}
        </aside>
      </div>

      {/* Modals - Outside layout */}
      <CustomModal
        show={showConfirmModal}
        onHide={handleCancelDownload}
        title="Xác nhận tải tài liệu"
        footer={<>
          <CustomButton variant="cancel" onClick={handleCancelDownload}>Hủy</CustomButton>
          <CustomButton variant="secondary" onClick={handleConfirmDownload}>Xác nhận</CustomButton>
        </>}
      >
        File đã sẵn sàng. Bạn có muốn tải tài liệu này không?
      </CustomModal>

      {/* Modal xem PDF toàn bộ trang */}
      <CustomModal
        show={isPreviewOpen}
        onHide={handleClosePreview}
        fullscreen
        modalClassName="bare"
      >
        {pdfData ? (
          <Document file={pdfData} onLoadSuccess={onDocumentLoadSuccess} loading="Đang tải tài liệu...">
            {numPages && Array.from({ length: Math.min(numPages, previewLimit) }, (_, i) => (
              <Page
                key={`page_${i + 1}`}
                pageNumber={i + 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="pdf-page"
              />
            ))}
            {numPages && numPages > previewLimit && (
              <div className="preview-limit-overlay">
                <p>Bạn đã xem {previewLimit} trang trong số {numPages}. {user ? 'Vui lòng tải xuống để xem toàn bộ.' : 'Đăng nhập và tải xuống để xem toàn bộ.'}</p>
                <button
                  type="button"
                  className="download-to-continue-btn"
                  onClick={() => {
                    handleClosePreview();
                    handleDownload();
                  }}
                >
                  Tải tài liệu để xem tiếp
                </button>
              </div>
            )}
            {!numPages && <div className="preview-loading">Không thể tải trang.</div>}
          </Document>
        ) : (
          <div className="loading-container">
            <div className="spinner"></div>
            <p className="loading-text">Đang chuẩn bị tài liệu...</p>
          </div>
        )}
      </CustomModal>

      <CustomModal
        show={showErrorModal}
        onHide={handleCloseErrorModal}
        title="Thông báo lỗi"
        footer={<CustomButton variant="primary" onClick={handleCloseErrorModal}>Đóng</CustomButton>}
      >
        {errorMessage}
      </CustomModal>

      {/* Render Report Modal */}
      {doc && user && (
        <ReportModal
          show={showReportModal}
          onHide={() => setShowReportModal(false)}
          documentId={doc.documentId}
          userId={user.userId}
          // --- THÊM DÒNG NÀY ---
          onReportSuccess={() => setHasAlreadyReported(true)}
        />
      )}
    </div>
  );
}


export default DocumentDetail;