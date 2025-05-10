import { useState, useEffect } from 'react';
import { getDocuments } from '../services/api';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await getDocuments();
      console.log('API response:', response);

      const data = response.data.$values || response.data;
      if (Array.isArray(data)) {
        const approvedDocuments = data.filter(doc => doc.isApproved === true);
        setDocuments(approvedDocuments);
      } else {
        console.warn('API data is not an array:', data);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Không thể tải tài liệu.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.IsAdmin) {
      navigate('/admin');
    }
    fetchDocuments();
  }, [navigate]);

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Đăng xuất thành công!');
    navigate('/login');
  };

  return (
    <div className="home-container">
      <div className="header-section">
        <div className="title-group">
          <h2 className="main-title">Tài liệu học tập</h2>
          <h4 className="sub-title">Danh sách tài liệu</h4>
        </div>
        <div className="d-flex align-items-center">
          <div className="search-wrapper me-3">
            <div className="search-group">
              <i className="bi bi-search search-icon"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm tài liệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Đang tải tài liệu...</p>
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="documents-grid">
          {filteredDocuments.map((doc) => (
            <div key={doc.documentId} className="document-card">
              <div className="card-content">
                <h5 className="card-title">{doc.title}</h5>
                <p className="card-description">{doc.description}</p>
                <div className="card-meta">
                  <span>
                    <i className="bi bi-calendar me-1"></i>
                    Tải lên: {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                  <span>
                    <i className="bi bi-download me-1"></i>
                    Lượt tải: {doc.downloadCount}
                  </span>
                </div>
                <p className="card-uploader">Người tải lên: {doc.email || 'Không xác định'}</p>
                <Link to={`/document/${doc.documentId}`} className="card-button">
                  Xem chi tiết
                </Link>
              </div>
            </div>
          ))}
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

export default Home;