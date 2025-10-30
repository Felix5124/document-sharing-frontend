import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';

const StarRatingDisplay = ({ rating = 0, totalReviews = 0 }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (halfStar ? 1 : 0));

  return (
    <span className="star-rating-display">
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="star-icon star-filled"></span>
      ))}
      {halfStar && <FontAwesomeIcon icon={faStarHalfAlt} />}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="star-icon star-empty"></span>
      ))}
      {totalReviews > 0 && <span className="rating-value">{rating}/5</span>}
    </span>
  );
};

export default StarRatingDisplay;
