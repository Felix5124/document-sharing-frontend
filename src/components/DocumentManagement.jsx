import { useState, useEffect, useRef } from 'react';
import { getDocuments, deleteDocument, lockDocument } from '../services/api';
import { toast } from 'react-toastify';
import useOnScreen from '../hooks/useOnScreen';

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
        await deleteDocument(id);
        toast.success('Xóa tài liệu thành công!');
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('Không thể xóa tài liệu.');
      }
    }
  };

  const handleLockUnlock = async (id, isLocked) => {
    try {
      await lockDocument(id, !isLocked);
      toast.success(`Tài liệu đã được ${isLocked ? 'mở khóa' : 'khóa'} thành công!`);
      fetchDocuments();
    } catch (error) {
      console.error(`Error ${isLocked ? 'unlocking' : 'locking'} document:`, error);
      toast.error(`Không thể ${isLocked ? 'mở khóa' : 'khóa'} tài liệu.`);
    }
  };

  // Component cho Table Row với hiệu ứng fade-in
  const DocumentRow = ({ doc }) => {
    const rowRef = useRef(null);
    const isVisible = useOnScreen(rowRef);

    return (
      <tr ref={rowRef} className={`fade-in ${isVisible ? 'visible' : ''}`}>
        <td>{doc.title}</td>
        <td>{doc.description}</td>
        <td>{doc.email || 'Không xác định'}</td>
        <td>{doc.downloadCount}</td>
        <td>
          <span className={`status-badge ${doc.isApproved ? 'status-approved' : 'status-pending'}`}>
            {doc.isApproved ? 'Đã duyệt' : 'Chưa duyệt'}
          </span>
          {' | '}
          <span className={`status-badge ${doc.isLock ? 'status-locked' : 'status-unlocked'}`}>
            {doc.isLock ? 'Đã khóa' : 'Đã mở khóa'}
          </span>
        </td>
        <td>
          <button
            className={`action-button ${doc.isLock ? 'unlock-button' : 'lock-button'} me-2`}
            onClick={() => handleLockUnlock(doc.documentId, doc.isLock)}
          >
            <i className={`bi ${doc.isLock ? 'bi-unlock' : 'bi-lock'} me-1`}></i>
            {doc.isLock ? 'Mở khóa' : 'Khóa'}
          </button>
          <button
            className="action-button delete-button"
            onClick={() => handleDelete(doc.documentId)}
          >
            <i className="bi bi-trash me-1"></i> Xóa
          </button>
        </td>
      </tr>
    );
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="admin-section">
      <h4 className="section-title">
        <i className="bi bi-file-earmark-lock me-2"></i> Quản lý tài liệu
      </h4>
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Đang tải tài liệu...</p>
        </div>
      ) : documents.length > 0 ? (
        <div className="admin-table-wrapper">
          <table className="document-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Mô tả</th>
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
          <i className="bi bi-folder-x empty-icon"></i>
          <p>Không có tài liệu nào để hiển thị.</p>
        </div>
      )}
    </div>
  );
}

export default DocumentManagement;