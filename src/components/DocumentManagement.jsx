import { useState, useEffect, useRef } from 'react';
import { getDocuments, deleteDocument, lockDocument } from '../services/api';
import { toast } from 'react-toastify';
import useOnScreen from '../hooks/useOnScreen';
import '../styles/components/DocumentManagement.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLock,
  faLockOpen,
  faTrash,
  faFileCircleXmark,
  faFileShield
} from '@fortawesome/free-solid-svg-icons';

function DocumentManagement() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await getDocuments();
      console.log('Documents response:', response);
      setDocuments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Không thể tải danh sách tài liệu.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      try {
        const target = documents.find(d => d.documentId === id);
        console.log('[Admin/Delete] About to delete document:', {
          id,
          title: target?.title,
          coverImageUrl: target?.coverImageUrl,
          fileUrl: target?.fileUrl,
          isApproved: target?.isApproved
        });
        const res = await deleteDocument(id);
        console.log('[Admin/Delete] Backend response:', { status: res?.status, data: res?.data });
        toast.success('Xóa tài liệu thành công!');
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Không thể xóa tài liệu.');
      }
    }
  };

  const handleLockUnlock = async (id, currentStatus) => {
    // Logic mới: Xác định hành động dựa trên trạng thái hiện tại
    const isLockingAction = currentStatus !== 'Suspended';
    const actionText = isLockingAction ? 'khóa' : 'mở khóa';

    try {
      await lockDocument(id, isLockingAction);
      toast.success(`Tài liệu đã được ${actionText} thành công!`);
      fetchDocuments(); // Tải lại danh sách để cập nhật giao diện
    } catch (error) {
      console.error(`Error ${actionText} document:`, error);
      toast.error(`Không thể ${actionText} tài liệu.`);
    }
  };

  // Component cho Table Row với hiệu ứng fade-in
  const DocumentRow = ({ doc }) => {
    const rowRef = useRef(null);
    const isVisible = useOnScreen(rowRef);

    // XÁC ĐỊNH LẠI TRẠNG THÁI NÚT BẤM VÀ TÊN GỌI
    const isSuspended = doc.approvalStatus === 'Suspended';
    const buttonText = isSuspended ? 'Mở khóa' : 'Khóa'; // Tên gọi đúng
    const buttonIcon = isSuspended ? faLockOpen : faLock;
    const buttonClass = isSuspended ? 'unlock-button' : 'lock-button';

    return (
      <tr ref={rowRef} className={`fade-in ${isVisible ? 'visible' : ''}`}>
        <td>{doc.title}</td>
        <td>{doc.email || 'Không xác định'}</td>
        <td className="download-count">{doc.downloadCount}</td>
        <td>
          <div className="status-container">
            {/* CẬP NHẬT LOGIC HIỂN THỊ TRẠNG THÁI */}
            <span className={`status-badge status-${doc.approvalStatus?.toLowerCase()}`}>
              {
                {
                  'Approved': 'Đã duyệt',
                  'SemiApproved': 'Chưa kiểm duyệt',
                  'Pending': 'Đang chờ',
                  'Rejected': 'Bị từ chối',
                  'Suspended': 'Bị tạm ngưng' // Thêm trạng thái mới
                }[doc.approvalStatus] || 'Không xác định'
              }
            </span>
          </div>
        </td>
        <td>
          <div className="action-container">
            {/* CẬP NHẬT NÚT KHÓA/MỞ KHÓA */}
            <button
              className={`action-button ${buttonClass} margin-right-sm`}
              onClick={() => handleLockUnlock(doc.documentId, doc.approvalStatus)}
            >
              <FontAwesomeIcon icon={buttonIcon} className="icon-margin-right-sm" />
              {buttonText}
            </button>

            <button
              className="action-button delete-button"
              onClick={() => handleDelete(doc.documentId)}
            >
              <FontAwesomeIcon icon={faTrash} className="icon-margin-right-sm" /> Xóa
            </button>
          </div>
        </td>
      </tr>
    );
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="admin-section">
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Đang tải tài liệu...</p>
        </div>
      ) : documents.length > 0 ? (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Người đăng</th>
                <th>Lượt tải</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <DocumentRow key={doc.documentId} doc={doc} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <FontAwesomeIcon icon={faFileCircleXmark} className="empty-icon" />
          <p>Không có tài liệu nào để hiển thị.</p>
        </div>
      )}
    </div>
  );
}

export default DocumentManagement;
