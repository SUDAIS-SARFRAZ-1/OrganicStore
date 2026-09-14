import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Loader2, 
  X, 
  AlertCircle, 
  ChevronDown,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { getAdminCoupons, createCoupon, deleteCoupon } from '../../services/adminApi';

export default function Coupons() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [formError, setFormError] = useState('');

  const initialForm = {
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    expiresAt: '',
    isPublic: true,
  };
  const [formData, setFormData] = useState(initialForm);

  const { data: responseData, isLoading, isError, error } = useQuery({
    queryKey: ['adminCoupons'],
    queryFn: getAdminCoupons,
  });

  const coupons = Array.isArray(responseData) ? responseData : (responseData?.coupons || []);
  const stats = responseData?.stats || {
    totalCoupons: coupons.length,
    activeCount: coupons.filter(c => c.isPublic).length,
    totalRedemptions: coupons.reduce((acc, c) => acc + (c.timesUsed ?? c.usedCount ?? 0), 0),
  };

  const createMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      queryClient.invalidateQueries({ queryKey: ['publicCoupons'] });
      closeModal();
    },
    onError: (err) => {
      setFormError(err.response?.data?.message || 'Failed to create coupon.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] });
      queryClient.invalidateQueries({ queryKey: ['publicCoupons'] });
      setDeleteConfirmId(null);
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setFormData(initialForm);
    setFormError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.code || !formData.discountValue) {
      setFormError('Coupon code and discount value are required.');
      return;
    }

    const payload = {
      code: formData.code.toUpperCase().trim(),
      description: formData.description,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
      maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null,
      expiresAt: formData.expiresAt 
        ? (formData.expiresAt.includes('T') ? new Date(formData.expiresAt).toISOString() : new Date(`${formData.expiresAt}T23:59:59.999Z`).toISOString())
        : null,
      isPublic: formData.isPublic,
    };

    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#6a9739]" />
            Promotions & Coupons Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure discount codes, self-serve public coupon banners, and minimum cart spend rules.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create New Coupon
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Coupons</div>
            <div className="text-lg font-black text-gray-900">{stats.totalCoupons ?? coupons.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-[#6a9739] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Public Available</div>
            <div className="text-lg font-black text-[#6a9739]">{stats.activeCount ?? 0}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Redemptions</div>
            <div className="text-lg font-black text-gray-900">{stats.totalRedemptions ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[#6a9739] animate-spin mb-3" />
            <p className="text-xs font-semibold text-gray-500">Loading coupons...</p>
          </div>
        ) : isError ? (
          <div className="p-6 text-xs text-red-700 bg-red-50">
            {error?.message || 'Error fetching coupons.'}
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No discount coupons created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 text-gray-500 font-bold border-b border-gray-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Min. Spend</th>
                  <th className="py-3.5 px-4">Visibility</th>
                  <th className="py-3.5 px-4">Times Used</th>
                  <th className="py-3.5 px-4">Expires</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-black text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md text-xs tracking-wider">
                        {c.code}
                      </span>
                      {c.description && (
                        <span className="text-[10px] text-gray-400 block mt-1">
                          {c.description}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-black text-[#6a9739]">
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₨ ${c.discountValue} OFF`}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-gray-700">
                      {c.minOrderAmount > 0 ? `₨ ${Number(c.minOrderAmount).toLocaleString()}` : 'None'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.isPublic 
                          ? 'bg-green-50 text-[#6a9739]' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {c.isPublic ? 'Public Self-Serve' : 'Private Promo'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600 font-medium">
                      <span className="font-bold text-gray-900">{c.timesUsed ?? c.usedCount ?? 0}</span>
                      <span className="text-gray-400"> {c.usageLimit ? `/ ${c.usageLimit} uses` : 'uses (Unlimited)'}</span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {deleteConfirmId === c.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            disabled={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(c.id)}
                            className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold cursor-pointer hover:bg-red-700"
                          >
                            Confirm
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
                          onClick={() => setDeleteConfirmId(c.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete coupon"
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
      </div>

      {/* Create Coupon Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in-95 duration-150 text-xs">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-black text-gray-900 mb-1 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#6a9739]" />
              Create Coupon Code
            </h2>
            <p className="text-gray-500 mb-6">
              Configure promo discount rules and visibility.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    name="code"
                    required
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g. FLASH30"
                    className="w-full uppercase font-mono px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Discount Type *
                  </label>
                  <div className="relative">
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleInputChange}
                      className="w-full appearance-none pl-3.5 pr-9 py-2.5 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] focus:ring-2 focus:ring-[#6a9739]/20 text-xs font-semibold text-gray-800 cursor-pointer transition-all"
                    >
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED">Fixed Amount (PKR)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="discountValue"
                    required
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    placeholder="e.g. 25 for 25% or 200 for ₨ 200"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Min. Order Amount (PKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="minOrderAmount"
                    value={formData.minOrderAmount}
                    onChange={handleInputChange}
                    placeholder="e.g. 1000"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Description / Promo Label
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g. Get 25% off farm-fresh fruits & vegetables"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Max Usage Limit (Optional)
                  </label>
                  <input
                    type="number"
                    name="usageLimit"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    placeholder="e.g. 100"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="expiresAt"
                    value={formData.expiresAt}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                    className="w-4 h-4 rounded text-[#6a9739] focus:ring-[#6a9739] border-gray-300"
                  />
                  <span className="font-semibold text-gray-700">
                    Public Self-Serve (Display in Available Coupons list at Cart/Checkout)
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white font-bold rounded-xl shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Coupon</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
