import { useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faEye,
  faFileAlt,
  faCog,
  faFileDownload,
  faLock
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../context/AuthContext';
import { getAllReports, updateReportStatus as apiUpdateReportStatus, lockDocument, resetDocumentReports, getProcessedReports, adminDownloadDocument, getReportsByDocumentId } from '../services/api';
import '../styles/components/ReportManagement.css';

function ReportManagement() {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [processedReports, setProcessedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportGroup, setSelectedReportGroup] = useState(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [showIndividualReports, setShowIndividualReports] = useState(false);
  const [individualReports, setIndividualReports] = useState([]); // <-- Thêm state mới
  const [isLoadingDetails, setIsLoadingDetails] = useState(false); // Thêm state loading cho chi tiết
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'

  // State mới cho truy vấn
  const [queryParams, setQueryParams] = useState({
    pageNumber: 1,
    pageSize: 10,
    reason: '',
    sortBy: 'newest',
  });

  // State mới cho dữ liệu phân trang
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const [pendingCount, setPendingCount] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);

  // State cho danh sách các lý do báo cáo (để lọc)
  const reportReasons = [
    "Nội dung không phù hợp",
    "Spam hoặc quảng cáo",
    "Vi phạm bản quyền",
    "Chứa mã độc/virus",
    "Khác"
  ];

  // Cập nhật hàm fetch dữ liệu
  const fetchReports = async () => {
    setLoading(true);
    try {
      // API giờ đây nhận tham số
      const response = await getAllReports(queryParams);
      const data = response.data;
      
      setReports(data.items || []); // Dữ liệu nằm trong 'items'
      setPagination({
        pageNumber: data.pageNumber,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
      });
      
      setPendingCount(data.totalCount || 0);


    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Lỗi khi tải danh sách báo cáo.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch processed reports for history tab
  const fetchProcessedReports = async () => {
    try {
      const response = await getProcessedReports(queryParams);
      const data = response.data;
      
      setProcessedReports(data.items || []); // Dữ liệu nằm trong 'items'
      setPagination({
        pageNumber: data.pageNumber,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
      });
      setProcessedCount(data.totalCount || 0);
    } catch (error) {
      console.error('Error fetching processed reports:', error);
      toast.error('Lỗi khi tải lịch sử báo cáo.');
    }
  };

  // Handle rejecting reports - means the document is innocent, reset status and report count
  const handleRejectReports = async () => {
    if (!selectedReportGroup) return;
    try {
      // "Từ chối" báo cáo nghĩa là tài liệu vô tội, reset lại trạng thái và số báo cáo
      await resetDocumentReports(selectedReportGroup.documentId);
      
      // <<< CẬP NHẬT LẠI NỘI DUNG THÔNG BÁO
      toast.success('Đã từ chối báo cáo và khôi phục trạng thái tài liệu.');

      // Cập nhật trạng thái của từng báo cáo sang "Rejected"
      for (const report of individualReports) {
        await apiUpdateReportStatus(report.reportId, 'Rejected');
      }

      // Cập nhật UI
      fetchReports(); // Tải lại danh sách chờ xử lý
      fetchProcessedReports(); // Tải lại lịch sử
      setShowReportDetail(false);
    } catch (error) {
      toast.error('Lỗi khi từ chối báo cáo.');
      console.error('Error rejecting reports:', error);
    }
  };

  // Handle resolving reports - means the document has issues -> Lock the document
  const handleResolveReports = async () => {
    if (!selectedReportGroup) return;
    try {
      // Hành động này sẽ gọi API để khóa tài liệu
      // Backend (DocumentsController) đã được cập nhật để tự động chuyển status các báo cáo sang "Resolved"
      await lockDocument(selectedReportGroup.documentId, true);
      
      toast.success('Đã xử lý báo cáo và khóa tài liệu thành công.');
      
      // Tải lại danh sách để cập nhật UI
      fetchReports();
      fetchProcessedReports();
      setShowReportDetail(false);
    } catch (error) {
      toast.error('Lỗi khi xử lý báo cáo.');
      console.error('Error resolving reports:', error);
    }
  };

  // Tạo hàm `handleDownloadDocument`:
  const handleDownloadDocument = async (documentId, documentTitle, fileType) => {
    if (!user) {
      toast.error("Không tìm thấy thông tin admin.");
      return;
    }
    try {
      toast.info("Đang chuẩn bị file để tải xuống...");
      const response = await adminDownloadDocument(documentId, user.userId);
      const { url, fileName } = response.data;

      const fileResponse = await fetch(url);
      if (!fileResponse.ok) throw new Error("Không thể tải file từ link.");

      const blob = await fileResponse.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', fileName || `${documentTitle}.${fileType}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Tải file thành công!");
    } catch (error) {
      console.error("Lỗi khi tải tài liệu:", error);
      toast.error("Không thể tải tài liệu để xem xét.");
    }
  };



  // Các hàm xử lý sự kiện thay đổi filter, sort, page
  const handleSortChange = (e) => {
    setQueryParams(prev => ({ ...prev, sortBy: e.target.value, pageNumber: 1 }));
  };

  const handleReasonChange = (e) => {
    setQueryParams(prev => ({ ...prev, reason: e.target.value, pageNumber: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setQueryParams(prev => ({ ...prev, pageNumber: newPage }));
    }
  };

  useEffect(() => {
    const fetchInitialCounts = async () => {
      try {
        // Lấy số lượng báo cáo đang chờ
        const pendingRes = await getAllReports({ pageNumber: 1, pageSize: 1 });
        setPendingCount(pendingRes.data.totalCount || 0);

        // Lấy số lượng báo cáo đã xử lý
        const processedRes = await getProcessedReports({ pageNumber: 1, pageSize: 1 });
        setProcessedCount(processedRes.data.totalCount || 0);
      } catch (error) {
        console.error("Failed to fetch initial counts:", error);
      }
    };
    
    fetchInitialCounts();
  }, []);
  // useEffect để gọi lại API khi queryParams thay đổi
  useEffect(() => {
    if (activeTab === 'pending') {
      fetchReports();
    } else {
      fetchProcessedReports();
    }
  }, [queryParams, activeTab]);

  // Tải dữ liệu ban đầu
  useEffect(() => {
    fetchReports();
    fetchProcessedReports();
  }, []);

  const handleViewReport = (documentReport) => {
    setSelectedReportGroup(documentReport); // Lưu trữ dữ liệu nhóm
    setShowReportDetail(true);
    setShowIndividualReports(false); // Reset lại khi mở modal
    setIndividualReports([]); // Xóa dữ liệu cũ
  };

  // Sửa hàm toggleIndividualReports để fetch dữ liệu
  const toggleIndividualReports = async () => {
    if (showIndividualReports) {
      setShowIndividualReports(false);
      return;
    }

    if (!selectedReportGroup) return;

    setIsLoadingDetails(true);
    try {
      const response = await getReportsByDocumentId(selectedReportGroup.documentId);
      setIndividualReports(response.data || []);
      setShowIndividualReports(true);
    } catch (error) {
      toast.error("Không thể tải chi tiết các báo cáo.");
      console.error('Error fetching individual reports:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="status-badge pending">Chờ xử lý</span>;
      case 'Resolved':
        return <span className="status-badge resolved">Đã xử lý</span>;
      case 'Rejected':
        return <span className="status-badge rejected">Từ chối</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const getPriorityColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'high-priority';
      case 'Resolved':
        return 'low-priority';
      case 'Rejected':
        return 'medium-priority';
      default:
        return 'low-priority';
    }
  };


  if (loading) {
    return (
      <div className="report-management">
        <div className="loading-container">
          <div className="spinner-custom"></div>
          <p>Đang tải danh sách báo cáo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-management">
      <div className="report-header">
        <h3 className="report-title">
          <FontAwesomeIcon icon={faExclamationTriangle} /> Quản lý Báo cáo
        </h3>
        <p className="report-subtitle">
          {activeTab === 'pending'
            ? `Báo cáo chờ xử lý: ${reports.length}`
            : `Lịch sử báo cáo: ${processedReports.length}`
          }
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="report-tabs">
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <FontAwesomeIcon icon={faExclamationTriangle} /> Báo cáo chờ xử lý ({pendingCount})
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FontAwesomeIcon icon={faFileAlt} /> Lịch sử báo cáo ({processedCount})
        </button>
      </div>

      {/* === KHU VỰC LỌC VÀ SẮP XẾP MỚI === */}
      <div className="report-controls">
        <div className="control-group">
          <label htmlFor="reason-filter">Lọc theo lý do:</label>
          <select id="reason-filter" value={queryParams.reason} onChange={handleReasonChange}>
            <option value="">Tất cả lý do</option>
            {reportReasons.map(reason => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="sort-by">Sắp xếp theo:</label>
          <select id="sort-by" value={queryParams.sortBy} onChange={handleSortChange}>
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="most_reported">Nhiều báo cáo nhất</option>
          </select>
        </div>
      </div>

      <div className="reports-list">
        {activeTab === 'pending' ? (
          reports.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faCheckCircle} size="3x" />
              <p>Không có báo cáo nào cần xử lý.</p>
            </div>
          ) : (
            <div className="reports-grid">
              {reports.map((documentReport) => (
                  <div key={documentReport.documentId} className={`report-card ${getPriorityColor('Pending')}`}>
                    <div className="report-card-header">
                      <div className="report-title-section">
                        <h4 className="document-title" title={documentReport.documentTitle}>
                          {documentReport.documentTitle}
                          
                          {/* THÊM HIỂN THỊ TRẠNG THÁI */}
                          {documentReport.isLocked && (
                             <span className="status-badge status-suspended" style={{marginLeft: '10px', fontSize: '0.7rem'}}>
                               <FontAwesomeIcon icon={faLock} /> Đã khóa
                             </span>
                          )}
                        </h4>
                        <div className="report-meta">
                          <span className="report-count">
                            <FontAwesomeIcon icon={faExclamationTriangle} /> {documentReport.reportCount} báo cáo
                          </span>
                          <span className="report-date">
                            Báo cáo gần nhất: {new Date(documentReport.latestReportDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                  <div className="report-card-actions">
                    <button
                      className="btn-action"
                      onClick={() => handleViewReport(documentReport)}
                    >
                      <FontAwesomeIcon icon={faCog} /> Hành động
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          processedReports.length === 0 ? (
            <div className="empty-state">
              <FontAwesomeIcon icon={faFileAlt} size="3x" />
              <p>Không có lịch sử báo cáo.</p>
            </div>
          ) : (
            <div className="reports-grid">
              {processedReports.map((documentReport) => (
                  <div key={documentReport.documentId} className={`report-card ${getPriorityColor(documentReport.status)}`}>
                    <div className="report-card-header">
                      <div className="report-title-section">
                        <h4 className="document-title" title={documentReport.documentTitle}>
                          {documentReport.documentTitle}
                          
                          {/* THÊM HIỂN THỊ TRẠNG THÁI */}
                          {documentReport.isLocked && (
                             <span className="status-badge status-suspended" style={{marginLeft: '10px', fontSize: '0.7rem'}}>
                               <FontAwesomeIcon icon={faLock} /> Đã khóa
                             </span>
                          )}
                        </h4>
                        <div className="report-meta">
                          <span className="report-count">
                            <FontAwesomeIcon icon={faFileAlt} /> {documentReport.reportCount} báo cáo
                          </span>
                          <span className="report-date">
                            Xử lý gần nhất: {new Date(documentReport.latestReportDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="report-status">
                        {getStatusBadge(documentReport.status)}
                      </div>
                    </div>

                  <div className="report-card-actions">
                    <button
                      className="btn-action"
                      onClick={() => handleViewReport(documentReport)}
                    >
                      <FontAwesomeIcon icon={faEye} /> Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* === KHU VỰC PHÂN TRANG MỚI === */}
      {pagination.totalPages > 1 && (
        <div className="pagination-controls">
          <button
            onClick={() => handlePageChange(queryParams.pageNumber - 1)}
            disabled={queryParams.pageNumber <= 1}>
            Trang trước
          </button>
          <span>
            Trang {pagination.pageNumber} / {pagination.totalPages}
          </span>
          <button
            onClick={() => handlePageChange(queryParams.pageNumber + 1)}
            disabled={queryParams.pageNumber >= pagination.totalPages}>
            Trang sau
          </button>
        </div>
      )}

      {/* Report Detail Modal */}
      {showReportDetail && selectedReportGroup && (
        <div className="report-detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className='upload-title'>Chi tiết báo cáo</h4>
              <button
                className="close-btn"
                onClick={() => setShowReportDetail(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="document-summary">
                <h5>Tài liệu: {selectedReportGroup.documentTitle}</h5>
                <p><strong>Tổng số báo cáo:</strong> {selectedReportGroup.reportCount}</p>
              </div>

              <div className="action-section">
                <h5>Hành động Quản trị</h5>
                <div className="action-buttons-grid">
                  <button className="btn-view-details" onClick={toggleIndividualReports} disabled={isLoadingDetails}>
                      <FontAwesomeIcon icon={faEye} />
                      {isLoadingDetails ? 'Đang tải...' : (showIndividualReports ? 'Ẩn chi tiết' : `Xem các báo cáo (${selectedReportGroup.reportCount})`)}
                  </button>

                  {/* NÚT TẢI XUỐNG MỚI */}
                  <button
                      className="btn-view" // Sử dụng class màu xanh
                      onClick={() => handleDownloadDocument(selectedReportGroup.documentId, selectedReportGroup.documentTitle, 'pdf')}
                  >
                      <FontAwesomeIcon icon={faFileDownload} />
                      Tải tài liệu
                  </button>

                  {/* THÊM ĐIỀU KIỆN KIỂM TRA activeTab */}
                  {activeTab === 'pending' && (
                    <>
                      <button className="btn-resolve" onClick={handleResolveReports}>
                          <FontAwesomeIcon icon={faCheckCircle} /> Xử lý & Khóa
                      </button>
                      <button className="btn-reject" onClick={handleRejectReports}>
                          <FontAwesomeIcon icon={faTimesCircle} /> Từ chối báo cáo
                      </button>
                    </>
                  )}
                </div>
              </div>

              {showIndividualReports && (
                <div className="individual-reports">
                  <h5>Danh sách báo cáo riêng lẻ:</h5>
                  {/* SỬA LẠI ĐỂ DÙNG STATE MỚI */}
                  {individualReports.map((report) => (
                    <div key={report.reportId} className={`individual-report ${getPriorityColor(report.status)}`}>
                      <div className="report-header">
                        <div className="report-meta">
                          <span className="report-date">
                            {new Date(report.reportedAt).toLocaleString()}
                          </span>
                          <span className="report-status">
                            {getStatusBadge(report.status)}
                          </span>
                        </div>
                      </div>
                      <div className="report-content">
                        <p><strong>Lý do:</strong> {report.reason}</p>
                        {report.details && (
                          <p><strong>Chi tiết:</strong> {report.details}</p>
                        )}
                        <p><strong>Người báo cáo:</strong> {report.reporterName || report.reporterEmail || 'Không xác định'}</p>
                        <p><strong>ID người báo cáo:</strong> {report.reporterUserId}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            <div className="modal-footer">
              <button
                className="btn-close"
                onClick={() => setShowReportDetail(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportManagement;