import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getAllBadges, getUserBadges, getUploadCount, getCommentCount } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrophy } from '@fortawesome/free-solid-svg-icons'; // 🏆 thêm FAWS
import '../styles/components/Achievements.css';

function Achievements({ userId }) {
  const [badges, setBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [uploadCount, setUploadCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const badgesResponse = await getAllBadges();
      let allBadgesData = badgesResponse.data;
      if (Array.isArray(allBadgesData.$values)) allBadgesData = allBadgesData.$values;
      setAllBadges(allBadgesData);

      const userBadgesResponse = await getUserBadges(userId);
      let userBadgesData = userBadgesResponse.data;
      if (Array.isArray(userBadgesData.$values)) userBadgesData = userBadgesData.$values;
      setBadges(userBadgesData);

      const uploadCountResponse = await getUploadCount(userId);
      setUploadCount(uploadCountResponse.data.uploadCount || 0);

      const commentCountResponse = await getCommentCount(userId);
      setCommentCount(commentCountResponse.data.commentCount || 0);
    } catch (error) {
      console.error('Fetch achievements data error:', error);
      toast.error('Không thể tải dữ liệu thành tựu.', { toastId: 'achievements-error' });
    } finally {
      setLoading(false);
    }
  };

  const getProgress = (badge) => {
    if (badge.name === 'Uploader') return { current: uploadCount, required: 5 };
    if (badge.name === 'Top Commenter') return { current: commentCount, required: 50 };
    return { current: 0, required: 0 };
  };

  if (!userId) {
    return (
      <div className="achievements-container">
        <div className="empty-state">
          <FontAwesomeIcon icon={faTrophy} className="empty-icon" />
          <p>Không có dữ liệu thành tựu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-container">
      <h4 className="achievements-title">
        <FontAwesomeIcon icon={faTrophy} className="icon-margin-right" /> Thành tựu
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
              <div
                key={badge.badgeId}
                className="achievement-item document-card"
                style={{
                  marginBottom: '12px',
                  opacity: isAchieved ? 1 : 0.7,
                }}
              >
                <div className="achievement-content">
                  <p
                    className="achievement-name"
                    style={{
                      fontWeight: '600',
                      color: isAchieved ? '#1a73e8' : '#6b7280',
                    }}
                  >
                    {badge.name}{' '}
                    {progress.required > 0 && `(${progress.current}/${progress.required})`}
                  </p>
                  <p className="achievement-description" style={{ color: '#6b7280' }}>
                    {badge.description}
                  </p>
                  {isAchieved ? (
                    <p className="achievement-earned" style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                      Đạt được vào:{' '}
                      {new Date(achievedBadge.earnedAt).toLocaleString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  ) : (
                    <p className="achievement-progress" style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                      {progress.required > 0
                        ? `Còn ${progress.required - progress.current} để đạt được`
                        : 'Chưa đạt'}
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
