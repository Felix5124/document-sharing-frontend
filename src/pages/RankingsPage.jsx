import { useState, useEffect } from 'react';
import { Container, ListGroup, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import api from '../services/api';
import { getFullImageUrl } from '../utils/imageUtils';
import { toast } from 'react-toastify';

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
  const navigate = useNavigate(); // Initialize useNavigate

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
      <Card className="mb-4 shadow-sm">
        <Card.Header as="h5" className="bg-light">
          <i className={iconClass}></i>
          {title}
        </Card.Header>
        {data && data.length > 0 ? (
          <ListGroup variant="flush">
            {data.map((item, index) => (
              <ListGroup.Item
                key={itemType === "user" ? item.userId : item.documentId || index}
                className="d-flex align-items-center"
                action={itemType === "document"} // Make document items actionable
                onClick={itemType === "document" ? () => handleItemClick(item) : undefined}
                style={{ cursor: itemType === "document" ? 'pointer' : 'default' }}
              >
                <span className="fw-bold me-2" style={{width: '30px'}}>#{index + 1}</span>
                <img
                  src={getFullImageUrl(itemType === "user" ? item.avatarUrl : item.coverImageUrl)}
                  alt={itemType === "user" ? item.fullName : item.title}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: itemType === "user" ? '50%' : '4px', // Square for doc covers
                    marginRight: 15,
                    objectFit: 'cover'
                  }}
                  onError={(e) => { e.target.onerror = null; e.target.src = getFullImageUrl(null);}}
                />
                <div className="flex-grow-1">
                  <div className="fw-bold">{itemType === "user" ? item.fullName : item.title}</div>
                  {itemType === "user" && <small className="text-muted">{item.email}</small>}
                  {itemType === "document" && item.uploadedByUser?.fullName && (
                    <small className="text-muted">Người đăng: {item.uploadedByUser.fullName}</small>
                  )}
                </div>
                <span className="badge bg-secondary rounded-pill fs-6">{item[valueKey]} {unit}</span>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <Card.Body className="text-center text-muted">Không có dữ liệu.</Card.Body>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" style={{width: '3rem', height: '3rem'}} />
        <p className="mt-3 fs-5">Đang tải bảng xếp hạng...</p>
      </Container>
    );
  }

  if (error) {
    return (
        <Container className="mt-5">
            <Alert variant="danger">{error}</Alert>
        </Container>
    );
  }

  return (
    <Container className="my-5">
      <h1 className="text-center mb-5 display-5 fw-bold">🏆 Bảng Xếp Hạng 🏆</h1>
      <Row>
        <Col md={6}>
          <RankingList
            title="TOP ĐIỂM SỐ"
            data={rankings.points}
            unit="điểm"
            itemType="user"
            iconClass="bi bi-star-fill text-warning me-2"
          />
        </Col>
        <Col md={6}>
          <RankingList
            title="TOP NGƯỜI DÙNG ĐĂNG TÀI LIỆU"
            data={rankings.uploads}
            unit="tài liệu"
            itemType="user"
            iconClass="bi bi-cloud-upload-fill text-info me-2"
          />
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <RankingList
            title="TOP NGƯỜI DÙNG BÌNH LUẬN"
            data={rankings.comments}
            unit="bình luận"
            itemType="user"
            iconClass="bi bi-chat-dots-fill text-primary me-2"
          />
        </Col>
        <Col md={6}>
          <RankingList
            title="TOP NGƯỜI DÙNG TẢI TÀI LIỆU"
            data={rankings.docDownloads}
            unit="lượt tải về"
            itemType="user"
            iconClass="bi bi-person-check-fill text-success me-2"
          />
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <RankingList
            title="TOP TÀI LIỆU TẢI VỀ"
            data={rankings.topDownloadedDocs}
            valueKey="downloadCount" 
            unit="lượt tải"
            itemType="document" 
            iconClass="bi bi-file-earmark-arrow-down-fill text-danger me-2" 
          />
        </Col>
      </Row>
    </Container>
  );
}

export default RankingsPage;