import { Star } from 'lucide-react';

export default function TestimonialCard({ testimonial }) {
  const { authorName, authorRole, rating, content, avatarUrl } = testimonial;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
      {/* Stars */}
      <div className="flex items-center gap-0.5 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
          />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-gray-600 text-sm leading-relaxed flex-grow mb-5">
        &ldquo;{content}&rdquo;
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={authorName}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#6a9739]/10 flex items-center justify-center text-[#6a9739] font-bold text-sm">
            {authorName.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-semibold text-gray-900 text-sm">{authorName}</p>
          {authorRole && (
            <p className="text-xs text-gray-500">{authorRole}</p>
          )}
        </div>
      </div>
    </div>
  );
}
