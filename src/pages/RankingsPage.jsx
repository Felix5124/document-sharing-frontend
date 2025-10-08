import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getFullImageUrl } from '../utils/imageUtils';
import { toast } from 'react-toastify';
import '../styles/pages/RankingsPage.css';

function RankingsPage() {
  const [rankings, setRankings] = useState({
    points: [],
    uploads: [],
    comments: [],
    docDownloads: [], // Users whose documents are most downloaded
    topDownloadedDocs: [] // New: For actual top downloaded documents
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllRankings = async () => {
      setLoading(true);
      setError(null);
      try {
        const [pointsRes, uploadsRes, commentsRes, docDownloadsRes,topDocsRes] = await Promise.all([
          api.get('/users/rankings/points?limit=10'),
          api.get('/users/rankings/uploads?limit=10'),
          api.get('/users/rankings/comments?limit=10'),
          api.get('/users/rankings/document-downloads?limit=10'),
          api.get('/documents/rankings/top-downloads?limit=10')
        ]);

        setRankings({
          points: (pointsRes.data.$values || pointsRes.data || []),
          uploads: (uploadsRes.data.$values || uploadsRes.data || []),
          comments: (commentsRes.data.$values || commentsRes.data || []),
          docDownloads: (docDownloadsRes.data.$values || docDownloadsRes.data || []),
          topDownloadedDocs: (topDocsRes.data.$values || topDocsRes.data || [])
        }); 
      } catch (err) {
        console.error("Không thể tải bảng xếp hạng:", err);
        setError("Không thể tải dữ liệu bảng xếp hạng. Vui lòng thử lại sau.");
        toast.error("Không thể tải dữ liệu bảng xếp hạng.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllRankings();
  }, []);

  // Modified RankingList to be more generic
  const RankingList = ({ title, data, valueKey = "value", unit = "", itemType = "user", iconClass }) => {
    const handleItemClick = (item) => {
      if (itemType === "user" && item.userId) {
        // Optional: navigate to user profile page if you have one
        // navigate(`/users/${item.userId}`);
        console.log("User clicked:", item);
      } else if (itemType === "document" && item.documentId) {
        navigate(`/document/${item.documentId}`); // Navigate to document detail page
      }
    };

    return (
      <div className="ranking-card">
        <div className="ranking-card-header">
          <span className={iconClass.replace('bi bi-', 'icon icon-').replace(' me-2', '')}></span>
          {title}
        </div>
        {data && data.length > 0 ? (
          <ul className="ranking-list">
            {data.map((item, index) => (
              <li
                key={itemType === "user" ? item.userId : item.documentId || index}
                className={`ranking-item ${itemType === "document" ? 'ranking-item-clickable' : ''}`}
                onClick={itemType === "document" ? () => handleItemClick(item) : undefined}
              >
                <span className="ranking-position">#{index + 1}</span>
                <img
                  src={getFullImageUrl(itemType === "user" ? item.avatarUrl : item.coverImageUrl)}
                  alt={itemType === "user" ? item.fullName : item.title}
                  className={itemType === "user" ? "ranking-avatar" : "document-image"}
                  onError={(e) => { e.target.onerror = null; e.target.src = getFullImageUrl(null);}}
                />
                <div className="ranking-info">
                  <div className="ranking-name">{itemType === "user" ? item.fullName : item.title}</div>
                  {itemType === "user" && <div className="ranking-detail">{item.email}</div>}
                  {itemType === "document" && item.uploadedByUser?.fullName && (
                    <div className="ranking-detail">Người đăng: {item.uploadedByUser.fullName}</div>
                  )}
                </div>
                <span className="ranking-value">{item[valueKey]} {unit}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="ranking-empty">Không có dữ liệu.</div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border" style={{width: '3rem', height: '3rem'}}></div>
        <p className="mt-3 fs-5">Đang tải bảng xếp hạng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <h1 className="rankings-title text-center mb-5">🏆 Bảng Xếp Hạng 🏆</h1>
      <div className="row">
        <div className="col-md-6">
          <RankingList
            title="TOP ĐIỂM SỐ"
            data={rankings.points}
            unit="điểm"
            itemType="user"
            iconClass="icon icon-star-fill text-warning"
          />
        </div>
        <div className="col-md-6">
          <RankingList
            title="TOP NGƯỜI DÙNG ĐĂNG TÀI LIỆU"
            data={rankings.uploads}
            unit="tài liệu"
            itemType="user"
            iconClass="icon icon-cloud-upload-fill text-info"
          />
        </div>
      </div>
      <div className="row">
        <div className="col-md-6">
          <RankingList
            title="TOP NGƯỜI DÙNG BÌNH LUẬN"
            data={rankings.comments}
            unit="bình luận"
            itemType="user"
            iconClass="icon icon-chat-dots-fill text-primary"
          />
        </div>
        <div className="col-md-6">
          <RankingList
            title="TOP NGƯỜI DÙNG TẢI TÀI LIỆU"
            data={rankings.docDownloads}
            unit="lượt tải về"
            itemType="user"
            iconClass="icon icon-person-check-fill text-success"
          />
        </div>
      </div>
      <div className="row">
        <div className="col-md-12">
          <RankingList
            title="TOP TÀI LIỆU TẢI VỀ"
            data={rankings.topDownloadedDocs}
            valueKey="downloadCount" 
            unit="lượt tải"
            itemType="document" 
            iconClass="icon icon-file-earmark-arrow-down-fill text-danger" 
          />
        </div>
      </div>
    </div>
  );
}

export default RankingsPage;