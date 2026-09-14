import { useQuery } from '@tanstack/react-query';
import { Tag, Check, Sparkles } from 'lucide-react';
import { getPublicCoupons } from '../services/couponApi';

export default function CouponList({ appliedCode, onApplyCoupon, cartTotal = 0 }) {
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['publicCoupons'],
    queryFn: getPublicCoupons,
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  });

  if (isLoading || coupons.length === 0) return null;

  return (
    <div className="bg-[#fbfbf9] rounded-xl p-4 border border-[#6a9739]/20 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#6a9739]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
            Available Store Coupons
            <Sparkles className="w-3.5 h-3.5 text-[#6a9739]" />
          </h4>
        </div>
        <span className="text-[11px] text-gray-500 font-medium">
          {coupons.length} available
        </span>
      </div>

      <div className="space-y-2.5">
        {coupons.map((coupon) => {
          const isApplied = appliedCode && appliedCode.toUpperCase() === coupon.code.toUpperCase();
          const meetsMin = cartTotal >= coupon.minOrderAmount;

          return (
            <div
              key={coupon.id}
              className={`p-3 rounded-lg border transition-all duration-200 flex items-center justify-between gap-3 ${
                isApplied
                  ? 'bg-green-50/90 border-green-300 shadow-xs'
                  : meetsMin
                  ? 'bg-white border-dashed border-[#6a9739]/40 hover:border-[#6a9739] hover:shadow-xs'
                  : 'bg-white/60 border-dashed border-gray-200 opacity-75'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black tracking-wider px-2 py-0.5 rounded-md bg-[#6a9739]/10 text-[#6a9739] border border-[#6a9739]/20 uppercase">
                    {coupon.code}
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    {coupon.discountType === 'PERCENTAGE'
                      ? `${coupon.discountValue}% OFF`
                      : `₨ ${coupon.discountValue} OFF`}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 line-clamp-2 leading-tight">
                  {coupon.description}
                </p>
                {coupon.minOrderAmount > 0 && !meetsMin && (
                  <p className="text-[10px] text-amber-600 font-medium">
                    Add ₨ {(coupon.minOrderAmount - cartTotal).toFixed(2)} more to unlock
                  </p>
                )}
              </div>

              <div className="shrink-0">
                {isApplied ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-md shadow-2xs animate-check-pulse">
                    <Check className="w-3.5 h-3.5" /> Applied
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onApplyCoupon(coupon.code)}
                    disabled={!meetsMin}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer btn-tactile ${
                      meetsMin
                        ? 'bg-[#6a9739] hover:bg-[#58802d] text-white shadow-2xs hover:shadow-xs active:scale-95'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
