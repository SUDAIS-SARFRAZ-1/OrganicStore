import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  Trash2, 
  Loader2, 
  MessageSquarePlus, 
  Clock, 
  LogIn 
} from 'lucide-react';
import { 
  getProductReviews, 
  checkReviewEligibility, 
  submitReview, 
  deleteReview 
} from '../services/reviewApi';
import { useAuthStore } from '../store/authStore';

export default function ReviewSection({ productId, productName }) {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  // Review Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // 1. Fetch Product Reviews & Stats
  const { 
    data: reviewData, 
    isLoading: loadingReviews 
  } = useQuery({
    queryKey: ['productReviews', productId],
    queryFn: () => getProductReviews(productId),
    enabled: Boolean(productId),
  });

  const reviews = reviewData?.reviews || [];
  const stats = reviewData?.stats || {
    totalReviews: 0,
    averageRating: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };

  // 2. Check Customer Eligibility (Only if logged in)
  const { 
    data: eligibility, 
    isLoading: checkingEligibility 
  } = useQuery({
    queryKey: ['reviewEligibility', productId, user?.id],
    queryFn: () => checkReviewEligibility(productId),
    enabled: Boolean(productId) && isAuthenticated,
  });

  // 3. Submit Review Mutation
  const submitMutation = useMutation({
    mutationFn: submitReview,
    onSuccess: (data) => {
      setFormSuccess(data.message || 'Thank you! Your verified purchase review has been posted.');
      setTitle('');
      setComment('');
      setFormError('');
      queryClient.invalidateQueries({ queryKey: ['productReviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['reviewEligibility', productId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    },
  });

  // 4. Delete Review Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productReviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['reviewEligibility', productId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!rating || rating < 1 || rating > 5) {
      setFormError('Please select a star rating between 1 and 5.');
      return;
    }

    if (!comment || comment.trim().length < 5) {
      setFormError('Please write a detailed review (minimum 5 characters).');
      return;
    }

    submitMutation.mutate({
      productId,
      rating,
      title,
      comment,
    });
  };

  const getRatingLabel = (score) => {
    switch (score) {
      case 1: return 'Disappointing';
      case 2: return 'Below Expectations';
      case 3: return 'Average / Fair';
      case 4: return 'Good Quality';
      case 5: return 'Exceptional Organic Taste';
      default: return '';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-10">
      {/* 1. Header & Rating Summary Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Average Score (5 Cols) */}
          <div className="md:col-span-5 text-center md:text-left border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#6a9739] block mb-1">
              Customer Satisfaction
            </span>
            <div className="flex items-baseline justify-center md:justify-start gap-3">
              <span className="text-5xl font-black text-gray-900 tracking-tight">
                {stats.averageRating > 0 ? stats.averageRating : '5.0'}
              </span>
              <div className="space-y-1">
                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= Math.round(stats.averageRating || 5)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-gray-100 text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  Based on {stats.totalReviews} verified {stats.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center md:justify-start gap-2 text-xs text-green-800 bg-green-50/70 border border-green-200/60 rounded-xl px-3 py-2">
              <ShieldCheck className="w-4 h-4 text-[#6a9739] shrink-0" />
              <span>Purchase-Gated Reviews — only verified organic buyers can post.</span>
            </div>
          </div>

          {/* Rating Distribution Bars (7 Cols) */}
          <div className="md:col-span-7 space-y-2">
            {[5, 4, 3, 2, 1].map((starScore) => {
              const count = stats.distribution?.[starScore] || 0;
              const percentage = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
              return (
                <div key={starScore} className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 w-12 shrink-0 font-bold text-gray-700">
                    <span>{starScore}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-gray-400 shrink-0 font-medium">
                    {count} ({percentage}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Write a Review Box (Server-Side Purchase-Gated State) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-100">
        <h3 className="text-lg font-extrabold text-gray-900 mb-1 flex items-center gap-2">
          <MessageSquarePlus className="w-5 h-5 text-[#6a9739]" />
          Write a Customer Review
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Share your authentic feedback on taste, freshness, and packaging.
        </p>

        {/* State A: Guest Visitor (Not Authenticated) */}
        {!isAuthenticated ? (
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200/80 text-center sm:flex sm:items-center sm:justify-between gap-4">
            <div className="mb-4 sm:mb-0 text-left">
              <span className="text-xs font-bold text-gray-800 block">
                Have you purchased this organic product?
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                Sign in to your customer account to leave a verified buyer review.
              </p>
            </div>
            <Link
              to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to Review</span>
            </Link>
          </div>
        ) : checkingEligibility ? (
          <div className="p-6 bg-gray-50 rounded-2xl text-center flex items-center justify-center gap-2 text-xs text-gray-500 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-[#6a9739]" />
            <span>Verifying purchase eligibility...</span>
          </div>
        ) : eligibility?.alreadyReviewed ? (
          /* State B: Customer Already Reviewed This Item */
          <div className="p-6 bg-green-50/70 border border-green-200/70 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#6a9739] shrink-0 mt-0.5" />
            <div className="text-xs text-green-900 leading-relaxed">
              <span className="font-bold block mb-1">You have reviewed this product!</span>
              Thank you for sharing your experience with our organic community. Your verified buyer review is published below.
            </div>
          </div>
        ) : !eligibility?.eligible ? (
          /* State C: Customer Has Not Purchased / Order Not Delivered */
          <div className="p-6 bg-amber-50/70 border border-amber-200/70 rounded-2xl flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold block mb-1">Purchase Verification Required</span>
              {eligibility?.reason || 'Only verified buyers who have received this product in a delivered order can write a review.'}
            </div>
          </div>
        ) : (
          /* State D: Eligible Verified Buyer -> Review Submission Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {formSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#6a9739]" />
                <span>{formSuccess}</span>
              </div>
            )}

            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Interactive Star Rating Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Your Overall Rating *
              </label>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= (hoverRating || rating);
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-gray-200 hover:scale-110 transition-transform cursor-pointer"
                        title={`${starValue} Stars`}
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-gray-100 text-gray-300'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-bold text-[#6a9739] ml-2">
                  {getRatingLabel(hoverRating || rating)}
                </span>
              </div>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Review Headline / Summary
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Delicious, fresh, and truly organic!"
                className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] transition-all"
              />
            </div>

            {/* Detailed Comment */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Your Review *
              </label>
              <textarea
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell other shoppers what you liked about this product, its freshness, packaging, and flavour..."
                className="w-full px-4 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] transition-all leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-gray-400">
                Verified delivery on Order #{eligibility?.orderNumber}
              </span>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {submitMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Submit Verified Review</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. Customer Reviews Feed */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-gray-900">
          Customer Reviews ({reviews.length})
        </h3>

        {loadingReviews ? (
          <div className="bg-white rounded-2xl p-12 shadow-xs border border-gray-100 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-6 h-6 text-[#6a9739] animate-spin mb-2" />
            <p className="text-xs font-semibold text-gray-600">Loading customer reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-xs border border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              There are no reviews for {productName} yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => {
              const isAuthor = user?.id === rev.user?.id || user?.role === 'ADMIN';
              const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={rev.id}
                  className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 hover:border-gray-200 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#6a9739] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                        {getInitials(rev.user?.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-gray-900">
                            {rev.user?.name || 'Verified Customer'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-[#6a9739] text-[10px] font-bold border border-green-200/50">
                            <ShieldCheck className="w-3 h-3" />
                            Verified Buyer
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 block mt-0.5">
                          {formattedDate}
                        </span>
                      </div>
                    </div>

                    {/* Delete action for review author or admin */}
                    {isAuthor && (
                      <button
                        type="button"
                        disabled={deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate(rev.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete your review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-200'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] font-bold text-gray-600 ml-1.5">
                      {getRatingLabel(rev.rating)}
                    </span>
                  </div>

                  {/* Review Content */}
                  {rev.title && (
                    <h4 className="text-xs font-extrabold text-gray-900">
                      {rev.title}
                    </h4>
                  )}
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
