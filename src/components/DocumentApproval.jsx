import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { getPendingDocuments, approveDocument } from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';

function DocumentApproval() {
  const { user } = useContext(AuthContext);
  const [pendingDocs, setPendingDocs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    fetchPendingDocs();
  }, [navigate, user]);

  const fetchPendingDocs = async () => {
    try {
      const response = await getPendingDocuments();
      let data = response.data;
      if (Array.isArray(data.$values)) {
        data = data.$values;
      }
      setPendingDocs(data);
    } catch (error) {
      toast.error('Không thể tải tài liệu chờ duyệt.', { toastId: 'pending-docs-error' });
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveDocument(id);
      toast.success('Tài liệu đã được duyệt.');
      fetchPendingDocs();
    } catch (error) {
      toast.error('Duyệt tài liệu thất bại.');
    }
  };

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div className="admin-section">
      <h4 className="section-title">
        <i className="bi bi-file-earmark-check me-2"></i> Tài liệu chờ duyệt
      </h4>
      {pendingDocs.length > 0 ? (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Mô tả</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pendingDocs.map((doc) => (
                <tr key={doc.documentId}>
                  <td>{doc.title}</td>
                  <td>{doc.description}</td>
                  <td>
                    <button
                      className="action-button approve-button"
                      onClick={() => handleApprove(doc.documentId)}
                    >
                      <i className="bi bi-check-circle me-2"></i> Duyệt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <i className="bi bi-folder-x empty-icon"></i>
          <p>Không có tài liệu chờ duyệt.</p>
        </div>
      )}
    </div>
  );
}

export default DocumentApproval;