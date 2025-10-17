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
        docDownloads: [],
        topDownloadedDocs: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // State mới để quản lý tab đang hoạt động
    const [activeTab, setActiveTab] = useState('points');

    useEffect(() => {
        const fetchAllRankings = async () => {
            setLoading(true);
            setError(null);
            try {
                const [pointsRes, uploadsRes, commentsRes, docDownloadsRes, topDocsRes] = await Promise.all([
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

    // Cấu hình cho các tab để dễ dàng quản lý và render
    const tabConfig = {
        points: {
            label: "Điểm Số",
            title: "TOP ĐIỂM SỐ",
            data: rankings.points,
            unit: "điểm",
            itemType: "user",
            iconModifier: "icon--star-fill",
            valueKey: "value" // Giả sử key trả về là 'value'
        },
        uploads: {
            label: "Đăng Tải",
            title: "TOP NGƯỜI DÙNG ĐĂNG TÀI LIỆU",
            data: rankings.uploads,
            unit: "tài liệu",
            itemType: "user",
            iconModifier: "icon--cloud-upload-fill",
            valueKey: "value" // Giả sử key trả về là 'value'
        },
        comments: {
            label: "Bình Luận",
            title: "TOP NGƯỜI DÙNG BÌNH LUẬN",
            data: rankings.comments,
            unit: "bình luận",
            itemType: "user",
            iconModifier: "icon--chat-dots-fill",
            valueKey: "value" // Giả sử key trả về là 'value'
        },
        docDownloads: {
            label: "Lượt Tải (User)",
            title: "TOP TÀI LIỆU CỦA NGƯỜI DÙNG",
            data: rankings.docDownloads,
            valueKey: "totalDownloads",
            unit: "lượt tải",
            itemType: "user",
            iconModifier: "icon--person-check-fill"
        },
        topDownloadedDocs: {
            label: "Lượt Tải (Tài liệu)",
            title: "TOP TÀI LIỆU ĐƯỢC TẢI NHIỀU NHẤT",
            data: rankings.topDownloadedDocs,
            valueKey: "downloadCount",
            unit: "lượt tải",
            itemType: "document",
            iconModifier: "icon--file-earmark-arrow-down-fill"
        }
    };

    const currentTabData = tabConfig[activeTab];

    // Component RankingList giữ nguyên
    const RankingList = ({ title, data, valueKey = "value", unit = "", itemType = "user", iconModifier }) => {
        const handleItemClick = (item) => {
            if (itemType === "document" && item.documentId) {
                navigate(`/document/${item.documentId}`);
            }
        };

        return (
            <div className="ranking-card">
                <header className="ranking-card__header">
                    <span className={`ranking-card__icon ${iconModifier}`}></span>
                    {title}
                </header>
                <div className="ranking-card__body">
                    {data && data.length > 0 ? (
                        <ul className="ranking-card__list">
                            {data.map((item, index) => (
                                <li
                                    key={itemType === "user" ? item.userId : item.documentId || index}
                                    className={`ranking-card__item ${itemType === "document" ? 'ranking-card__item--clickable' : ''}`}
                                    onClick={itemType === "document" ? () => handleItemClick(item) : undefined}
                                >
                                    <span className="ranking-card__position">#{index + 1}</span>
                                    <img
                                        src={getFullImageUrl(itemType === "user" ? item.avatarUrl : item.coverImageUrl)}
                                        alt={itemType === "user" ? item.fullName : item.title}
                                        className={`ranking-card__image ${itemType === "user" ? "ranking-card__image--avatar" : "ranking-card__image--document"}`}
                                        onError={(e) => { e.target.onerror = null; e.target.src = getFullImageUrl(null); }}
                                    />
                                    <div className="ranking-card__info">
                                        <div className="ranking-card__name">{itemType === "user" ? item.fullName : item.title}</div>
                                        {itemType === "user" && <div className="ranking-card__detail">{item.email}</div>}
                                        {itemType === "document" && item.uploadedByUser?.fullName && (
                                            <div className="ranking-card__detail">Người đăng: {item.uploadedByUser.fullName}</div>
                                        )}
                                    </div>
                                    <span className="ranking-card__value">{item[valueKey]} {unit}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="ranking-card__empty-message">Không có dữ liệu.</p>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="page-loader">
                <div className="loader-spinner"></div>
                <p className="loader-text">Đang tải bảng xếp hạng...</p>
            </div>
        );
    }

    if (error) {
        return (
            <main className="page-container">
                <div className="error-message">{error}</div>
            </main>
        );
    }

    return (
        <main className="rankings-page">
            <header className="rankings-page__header">
                <h1 className="rankings-page__title">🏆 Bảng Xếp Hạng 🏆</h1>
            </header>
            
            {/* Thanh điều hướng TAB */}
            <div className="rankings-page__tabs">
                {Object.keys(tabConfig).map((key) => (
                    <button
                        key={key}
                        className={`rankings-page__tab-button ${activeTab === key ? 'rankings-page__tab-button--active' : ''}`}
                        onClick={() => setActiveTab(key)}
                    >
                        {tabConfig[key].label}
                    </button>
                ))}
            </div>

            {/* Nội dung TAB */}
            <div className="rankings-page__content">
                {currentTabData && (
                    <RankingList
                        key={activeTab} // Thêm key để React re-render component khi tab thay đổi
                        title={currentTabData.title}
                        data={currentTabData.data}
                        valueKey={currentTabData.valueKey}
                        unit={currentTabData.unit}
                        itemType={currentTabData.itemType}
                        iconModifier={currentTabData.iconModifier}
                    />
                )}
            </div>
        </main>
    );
}

export default RankingsPage;