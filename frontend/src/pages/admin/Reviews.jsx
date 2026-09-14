import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Star, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getAdminReviews, toggleReviewStatus, featureReviewAsTestimonial } from '../../services/adminApi';
import { deleteReview } from '../../services/reviewApi';
import ConfirmModal from '../../components/ConfirmModal';

export default function Reviews() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [dialogConfig, setDialogConfig] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminReviews', statusFilter, page],
    queryFn: () => getAdminReviews({ status: statusFilter, page, limit: 15 }),
  });

  const reviews = data?.reviews || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalReviews = data?.pagination?.total || 0;

  const toggleMutation = useMutation({
    mutationFn: toggleReviewStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
    },
    onError: (err) => {
      setDialogConfig({
        isOpen: true,
        isAlertOnly: true,
        title: 'Review Update Failed',
        message: err.response?.data?.message || 'Failed to update review status.',
        variant: 'danger',
        confirmText: 'Dismiss',
      });
    },
  });

  const featureMutation = useMutation({
    mutationFn: featureReviewAsTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['homeTestimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
    },
    onError: (err) => {
      setDialogConfig({
        isOpen: true,
        isAlertOnly: true,
        title: 'Testimonial Update Failed',
        message: err.response?.data?.message || 'Failed to update testimonial status.',
        variant: 'danger',
        confirmText: 'Dismiss',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReviews'] });
      queryClient.invalidateQueries({ queryKey: ['homeTestimonials'] });
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      setDeleteConfirmId(null);
    },
    onError: (err) => {
      setDialogConfig({
        isOpen: true,
        isAlertOnly: true,
        title: 'Delete Failed',
        message: err.response?.data?.message || 'Failed to delete review.',
        variant: 'danger',
        confirmText: 'Dismiss',
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Customer Reviews Moderation
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit customer reviews, verified organic buyer feedback, and moderation flags.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => { setStatusFilter('all'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('approved'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'approved' ? 'bg-white text-[#6a9739] shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Approved
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('pending'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'pending' ? 'bg-white text-amber-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[#6a9739] animate-spin mb-3" />
            <p className="text-xs font-semibold text-gray-500">Loading reviews...</p>
          </div>
        ) : isError ? (
          <div className="p-6 text-xs text-red-700 bg-red-50">
            {error?.message || 'Error fetching reviews.'}
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No customer reviews found matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 text-gray-500 font-bold border-b border-gray-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Review Content</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Homepage Testimonial</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900 max-w-[150px] truncate">
                      {r.product?.name}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 block">{r.user?.name}</span>
                      <span className="text-[10px] text-gray-400 block">{r.user?.email}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-100'}`}
                          />
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      {r.title && (
                        <span className="font-bold text-gray-900 block mb-0.5">
                          {r.title}
                        </span>
                      )}
                      <p className="text-gray-600 line-clamp-2 leading-relaxed">
                        {r.comment}
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate({ id: r.id, isApproved: !r.isApproved })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                          r.isApproved
                            ? 'bg-green-50 text-[#6a9739] hover:bg-green-100'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        {r.isApproved ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {r.isFeaturedAsTestimonial ? (
                        <button
                          type="button"
                          disabled={featureMutation.isPending}
                          onClick={() => featureMutation.mutate({ id: r.id, remove: true })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#6a9739]/15 text-[#6a9739] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer group"
                          title="Click to remove from homepage testimonials"
                        >
                          <Sparkles className="w-3 h-3 text-[#6a9739] group-hover:hidden" />
                          <span className="group-hover:hidden">Live on Home</span>
                          <span className="hidden group-hover:inline">Remove</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={featureMutation.isPending}
                          onClick={() => featureMutation.mutate({ id: r.id, remove: false })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-gray-200 text-gray-600 hover:border-[#6a9739] hover:text-[#6a9739] hover:bg-[#6a9739]/10 transition-colors cursor-pointer"
                          title="Promote this review to homepage testimonials"
                        >
                          <Sparkles className="w-3 h-3 text-gray-400" />
                          <span>Show on Home</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {deleteConfirmId === r.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(r.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(r.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing Page <span className="font-bold text-gray-800">{page}</span> of{' '}
              <span className="font-bold text-gray-800">{totalPages}</span> ({totalReviews} total reviews)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Confirmation / Alert Dialog */}
      {dialogConfig && (
        <ConfirmModal
          isOpen={dialogConfig.isOpen}
          title={dialogConfig.title}
          message={dialogConfig.message}
          confirmText={dialogConfig.confirmText}
          cancelText={dialogConfig.cancelText}
          variant={dialogConfig.variant}
          isAlertOnly={dialogConfig.isAlertOnly}
          isLoading={toggleMutation.isPending || featureMutation.isPending || deleteMutation.isPending}
          onClose={() => setDialogConfig(null)}
          onConfirm={dialogConfig.onConfirm}
        />
      )}
    </div>
  );
}
