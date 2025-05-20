import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { getAllBadges, getUserBadges, getUploadCount, getCommentCount } from '../services/api';

function Achievements() {
  const { user } = useContext(AuthContext);
  const [badges, setBadges] = useState([]); // Huy hiệu đã đạt
  const [allBadges, setAllBadges] = useState([]); // Tất cả huy hiệu
  const [uploadCount, setUploadCount] = useState(0); // Số tài liệu đã tải lên
  const [commentCount, setCommentCount] = useState(0); // Số bình luận đã đăng
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Lấy tất cả huy hiệu
      const badgesResponse = await getAllBadges();
      let allBadgesData = badgesResponse.data;
      if (Array.isArray(allBadgesData.$values)) {
        allBadgesData = allBadgesData.$values;
      }
      setAllBadges(allBadgesData);

      // Lấy huy hiệu đã đạt của người dùng
      const userBadgesResponse = await getUserBadges(user.userId);
      let userBadgesData = userBadgesResponse.data;
      if (Array.isArray(userBadgesData.$values)) {
        userBadgesData = userBadgesData.$values;
      }
      setBadges(userBadgesData);

      // Lấy số lượng tài liệu đã tải lên
      try {
        const uploadCountResponse = await getUploadCount(user.userId);
        setUploadCount(uploadCountResponse.data.uploadCount || 0);
      } catch (error) {
        console.error('Error fetching upload count:', error);
        setUploadCount(0);
        toast.error('Không thể tải dữ liệu số lượng tài liệu.', { toastId: 'upload-count-error' });
      }

      // Lấy số lượng bình luận
      try {
        const commentCountResponse = await getCommentCount(user.userId);
        setCommentCount(commentCountResponse.data.commentCount || 0);
      } catch (error) {
        console.error('Error fetching comment count:', error);
        setCommentCount(0);
        toast.error('Không thể tải dữ liệu số lượng bình luận.', { toastId: 'comment-count-error' });
      }
    } catch (error) {
      console.error('Fetch achievements data error:', error);
      toast.error('Không thể tải dữ liệu thành tựu.', { toastId: 'achievements-error' });
    } finally {
      setLoading(false);
    }
  };

  // Hàm tính tiến trình cho từng huy hiệu
  const getProgress = (badge) => {
    if (badge.name === 'Uploader') {
      const required = 5; // Cần 5 tài liệu
      return { current: uploadCount, required };
    } else if (badge.name === 'Top Commenter') {
      const required = 50; // Cần 50 bình luận
      return { current: commentCount, required };
    }
    return { current: 0, required: 0 }; // Mặc định cho các huy hiệu khác
  };

  if (!user) {
    return (
      <div className="achievements-container">
        <div className="empty-state">
          <i className="bi bi-lock-fill empty-icon"></i>
          <p>Vui lòng đăng nhập để xem thành tựu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-container">
      <h4 className="achievements-title">
        <i className="bi bi-award me-2"></i> Thành tựu của bạn
      </h4>
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Đang tải thành tựu...</p>
        </div>
      ) : (
        <div className="achievements-list">
          {allBadges.map((badge) => {
            const achievedBadge = badges.find((b) => b.badgeId === badge.badgeId);
            const progress = getProgress(badge);
            const isAchieved = !!achievedBadge;

            return (
              <div key={badge.badgeId} className="achievement-item document-card" style={{ marginBottom: '12px', opacity: isAchieved ? 1 : 0.7 }}>
                <div className="achievement-content">
                  <p className="achievement-name" style={{ fontWeight: '600', color: isAchieved ? '#1a73e8' : '#6b7280' }}>
                    {badge.name} {progress.required > 0 && `(${progress.current}/${progress.required})`}
                  </p>
                  <p className="achievement-description" style={{ color: '#6b7280' }}>
                    {badge.description}
                  </p>
                  {isAchieved ? (
                    <p className="achievement-earned" style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                      Đạt được vào: {new Date(achievedBadge.earnedAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  ) : (
                    <p className="achievement-progress" style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                      {progress.required > 0 ? `Còn ${progress.required - progress.current} để đạt được` : 'Chưa đạt'}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Achievements;