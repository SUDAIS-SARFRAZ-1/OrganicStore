import { Star } from 'lucide-react';

export default function Rating({ rating = 5, size = 'w-3.5 h-3.5', showText = false, reviewsCount }) {
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-1">
      <div className="flex text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rounded ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'
            }`}
          />
        ))}
      </div>
      {showText && (
        <span className="text-xs text-gray-500 ml-1">
          {rating} {reviewsCount !== undefined && `(${reviewsCount})`}
        </span>
      )}
    </div>
  );
}
