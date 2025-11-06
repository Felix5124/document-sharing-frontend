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
  faFileDownload 
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../context/AuthContext';
import { getAllReports, updateReportStatus as apiUpdateReportStatus, lockDocument, resetDocumentReports, getProcessedReports, adminDownloadDocument } from '../services/api';
import '../styles/components/ReportManagement.css';

function ReportManagement() {
  const { user } = useContext(AuthContext); 
  const [reports, setReports] = useState([]);
  const [processedReports, setProcessedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [showIndividualReports, setShowIndividualReports] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'

  // Fetch all reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await getAllReports();
      const data = response.data || response;
      
      // Nhóm các báo cáo theo tài liệu
      const groupedReports = data.reduce((acc, report) => {
        if (!acc[report.documentId]) {
          acc[report.documentId] = {
            documentId: report.documentId,
            documentTitle: report.documentTitle,
            reports: [],
            reportCount: 0,
            latestReportDate: report.reportedAt
          };
        }
        acc[report.documentId].reports.push(report);
        acc[report.documentId].reportCount++;
        if (new Date(report.reportedAt) > new Date(acc[report.documentId].latestReportDate)) {
          acc[report.documentId].latestReportDate = report.reportedAt;
        }
        return acc;
      }, {});
      
      // Chuyển đổi thành mảng và sắp xếp theo số lượng báo cáo giảm dần
      const groupedArray = Object.values(groupedReports).sort((a, b) => b.reportCount - a.reportCount);
      setReports(groupedArray);
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
      const response = await getProcessedReports();
      const data = response.data || response;
      
      // Nhóm các báo cáo đã xử lý theo tài liệu
      const groupedReports = data.reduce((acc, report) => {
        if (!acc[report.documentId]) {
          acc[report.documentId] = {
            documentId: report.documentId,
            documentTitle: report.documentTitle,
            reports: [],
            reportCount: 0,
            latestReportDate: report.reportedAt,
            status: report.status
          };
        }
        acc[report.documentId].reports.push(report);
        acc[report.documentId].reportCount++;
        if (new Date(report.reportedAt) > new Date(acc[report.documentId].latestReportDate)) {
          acc[report.documentId].latestReportDate = report.reportedAt;
        }
        return acc;
      }, {});
      
      // Chuyển đổi thành mảng và sắp xếp theo ngày báo cáo mới nhất
      const groupedArray = Object.values(groupedReports).sort((a, b) =>
        new Date(b.latestReportDate) - new Date(a.latestReportDate)
      );
      setProcessedReports(groupedArray);
    } catch (error) {
      console.error('Error fetching processed reports:', error);
      toast.error('Lỗi khi tải lịch sử báo cáo.');
    }
  };

  // Handle rejecting reports - means the document is innocent, reset status and report count
  const handleRejectReports = async () => {
    if (!selectedReport) return;
    try {
      // "Từ chối" báo cáo nghĩa là tài liệu vô tội, reset lại trạng thái và số báo cáo
      await resetDocumentReports(selectedReport.documentId);
      toast.success('Đã từ chối báo cáo, khôi phục trạng thái và reset lượt tải về 0.'); // <<< CẬP NHẬT NỘI DUNG THÔNG BÁO

      // Cập nhật trạng thái của từng báo cáo sang "Rejected"
      for (const report of selectedReport.reports) {
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
    if (!selectedReport) return;
    try {
      // Hành động này sẽ gọi API để khóa tài liệu
      await lockDocument(selectedReport.documentId, true);

      // Cập nhật trạng thái các báo cáo liên quan
      for (const report of selectedReport.reports) {
        await apiUpdateReportStatus(report.reportId, 'Resolved');
      }
      
      // SỬA LẠI THÔNG BÁO CHO ĐÚNG
      toast.success('Đã xử lý báo cáo và khóa tài liệu thành công.');
      
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

  // Lock document
  const handleLockDocument = async (documentId) => {
    try {
      await lockDocument(documentId, true);
      toast.success('Đã khóa tài liệu.');
      fetchReports(); // Refresh list
    } catch (error) {
      console.error('Error locking document:', error);
      toast.error('Lỗi khi khóa tài liệu.');
    }
  };


  // SỬA LẠI: Thêm một useEffect mới để tải dữ liệu ban đầu
  useEffect(() => {
    // Tải cả hai danh sách khi component được mount lần đầu
    fetchReports();
    fetchProcessedReports();
  }, []); // Mảng rỗng đảm bảo nó chỉ chạy một lần

  // Giữ lại useEffect cũ để tải lại khi chuyển tab (tùy chọn, nhưng tốt)
  useEffect(() => {
    if (activeTab === 'pending') {
      fetchReports();
    } else {
      fetchProcessedReports();
    }
  }, [activeTab]);

  const handleViewReport = (documentReport) => {
    setSelectedReport(documentReport);
    setShowReportDetail(true);
    setShowIndividualReports(false); // Reset khi mở modal mới
  };

  const toggleIndividualReports = () => {
    setShowIndividualReports(!showIndividualReports);
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
          <FontAwesomeIcon icon={faExclamationTriangle} /> Báo cáo chờ xử lý ({reports.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FontAwesomeIcon icon={faFileAlt} /> Lịch sử báo cáo ({processedReports.length})
        </button>
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
                    <div className="report-status">
                      <span className="status-badge pending">Có báo cáo</span>
                    </div>
                  </div>

                  <div className="report-card-body">
                    <div className="report-summary">
                      <strong>Tổng số báo cáo:</strong> {documentReport.reportCount}
                    </div>
                    <div className="document-info">
                      <strong>ID tài liệu:</strong> {documentReport.documentId}
                    </div>
                    <div className="report-explanation">
                      <small>Tài liệu này đang có {documentReport.reportCount} báo cáo cần xem xét</small>
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

                  <div className="report-card-body">
                    <div className="report-summary">
                      <strong>Tổng số báo cáo:</strong> {documentReport.reportCount}
                    </div>
                    <div className="document-info">
                      <strong>ID tài liệu:</strong> {documentReport.documentId}
                    </div>
                    <div className="report-explanation">
                      <small>Tài liệu này đã được xử lý với trạng thái: {documentReport.status === 'Resolved' ? 'Đã xử lý' : 'Từ chối'}</small>
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

      {/* Report Detail Modal */}
      {showReportDetail && selectedReport && (
        <div className="report-detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Chi tiết Báo cáo - {selectedReport.documentTitle}</h4>
              <button
                className="close-btn"
                onClick={() => setShowReportDetail(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="document-summary">
                <h5>Tài liệu: {selectedReport.documentTitle}</h5>
                <p><strong>Tổng số báo cáo:</strong> {selectedReport.reportCount}</p>
                <p><strong>ID tài liệu:</strong> {selectedReport.documentId}</p>
              </div>

              <div className="action-section">
                <h5>Hành động Quản trị</h5>
                <div className="action-buttons-grid">
                  <button className="btn-view-details" onClick={toggleIndividualReports}>
                      <FontAwesomeIcon icon={faEye} />
                      {showIndividualReports ? 'Ẩn chi tiết' : 'Xem các báo cáo'} ({selectedReport.reportCount})
                  </button>

                  {/* NÚT TẢI XUỐNG MỚI */}
                  <button
                      className="btn-view" // Sử dụng class màu xanh
                      onClick={() => handleDownloadDocument(selectedReport.documentId, selectedReport.documentTitle, selectedReport.reports[0]?.document?.fileType || 'bin')}
                  >
                      <FontAwesomeIcon icon={faFileDownload} />
                      Tải tài liệu
                  </button>

                  <button className="btn-resolve" onClick={handleResolveReports}>
                      <FontAwesomeIcon icon={faCheckCircle} /> Xử lý & Khóa
                  </button>
                  <button className="btn-reject" onClick={handleRejectReports}>
                      <FontAwesomeIcon icon={faTimesCircle} /> Từ chối báo cáo
                  </button>
                  {/* ĐÃ XÓA CÁC NÚT THỪA */}
                </div>
              </div>

              {showIndividualReports && (
                <div className="individual-reports">
                  <h5>Danh sách báo cáo riêng lẻ:</h5>
                  {selectedReport.reports.map((report) => (
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
                      <div className="report-actions">
                        {report.status === 'Pending' && (
                          <div className="action-buttons">
                            <button
                              className="btn-resolve"
                              onClick={async () => {
                                try {
                                  await apiUpdateReportStatus(report.reportId, 'Resolved');
                                  toast.success('Đã đánh dấu báo cáo là Đã xử lý.');
                                  fetchReports();
                                  fetchProcessedReports();
                                } catch (error) {
                                  console.error('Error updating report status:', error);
                                  toast.error('Lỗi khi cập nhật trạng thái báo cáo.');
                                }
                              }}
                            >
                              <FontAwesomeIcon icon={faCheckCircle} /> Đã xử lý
                            </button>
                            <button
                              className="btn-reject"
                              onClick={async () => {
                                try {
                                  await apiUpdateReportStatus(report.reportId, 'Rejected');
                                  toast.success('Đã từ chối báo cáo.');
                                  fetchReports();
                                  fetchProcessedReports();
                                } catch (error) {
                                  console.error('Error updating report status:', error);
                                  toast.error('Lỗi khi cập nhật trạng thái báo cáo.');
                                }
                              }}
                            >
                              <FontAwesomeIcon icon={faTimesCircle} /> Từ chối
                            </button>
                          </div>
                        )}
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