import { useEffect, useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSemiApprovedDocuments, approveDocument } from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import useOnScreen from '../hooks/useOnScreen';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import '../styles/components/DocumentApproval.css';

function DocumentApproval() {
  const { user } = useContext(AuthContext);
  const [docsToVerify, setDocsToVerify] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.isAdmin) {
      fetchDocsToVerify();
    } else {
      navigate('/');
    }
  }, [navigate, user]);

  const fetchDocsToVerify = async () => {
    try {
      const response = await getSemiApprovedDocuments();
      let data = response.data;
      if (Array.isArray(data?.$values)) {
        data = data.$values;
      }
      setDocsToVerify(data || []);
    } catch {
      toast.error('Không thể tải tài liệu cần xác thực.', { toastId: 'verify-docs-error' });
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveDocument(id);
      toast.success('Tài liệu đã được duyệt thành công!');
      fetchDocsToVerify();
    } catch {
      toast.error('Duyệt tài liệu thất bại.');
    }
  };

  const DocumentRow = ({ doc }) => {
    const rowRef = useRef(null);
    const isVisible = useOnScreen(rowRef);

    return (
      <tr ref={rowRef} className={`fade-in ${isVisible ? 'visible' : ''}`}>
        <td>{doc.title}</td>
        <td>{doc.description}</td>
        <td>
          <button
            className="action-button approve-button"
            onClick={() => handleApprove(doc.documentId)}
          >
            <FontAwesomeIcon icon={faCheckCircle} className="icon-margin-right" /> Duyệt
          </button>
        </td>
      </tr>
    );
  };
  
  if (!user?.isAdmin) return null;

  return (
    <div className="admin-section">
      {docsToVerify.length > 0 ? (
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
              {docsToVerify.map((doc) => (
                <DocumentRow key={doc.documentId} doc={doc} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <FontAwesomeIcon icon={faFolderOpen} className="empty-icon" />
          <p>Không có tài liệu nào cần xác thực.</p>
        </div>
      )}
    </div>
  );
}

export default DocumentApproval;