import { useState } from 'react';

const StarRatingInput = ({ rating = 0, onChange = () => {} }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="star-rating-input">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <span
            key={starValue}
            className={`star-icon ${(hoverRating || rating) >= starValue ? 'star-filled' : 'star-empty'}`}
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
          ></span>
        );
      })}
      <span className="rating-text">{rating} sao</span>
    </div>
  );
};

export default StarRatingInput;
