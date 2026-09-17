import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  CheckCircle2,
  AlertCircle,
  Leaf,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { getCart, updateCartItem, removeCartItem, clearCart } from '../services/cartApi';
import { validateCoupon } from '../services/couponApi';
import CouponList from '../components/CouponList';

export default function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const { data: cart = { items: [], totalItems: 0, subtotal: 0 }, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
  });

  const updateMutation = useMutation({
    mutationFn: updateCartItem,
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      if (previousCart?.items) {
        const updatedItems = previousCart.items.map((i) =>
          i.id === itemId
            ? { ...i, quantity, subtotal: (Number(i.unitPrice) || Number(i.price)) * quantity }
            : i
        );
        const nextSubtotal = updatedItems.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0);
        const nextTotalItems = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
        queryClient.setQueryData(['cart'], {
          ...previousCart,
          items: updatedItems,
          subtotal: nextSubtotal,
          totalItems: nextTotalItems,
        });
      }
      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart);
      // Re-validate applied coupon against new subtotal
      if (appliedCoupon) {
        handleValidateCoupon(appliedCoupon.code, updatedCart.subtotal);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onMutate: async (arg) => {
      const itemId = typeof arg === 'object' && arg !== null ? arg.itemId : arg;
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData(['cart']);
      if (previousCart?.items) {
        const updatedItems = previousCart.items.filter((i) => i.id !== itemId);
        const nextSubtotal = updatedItems.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0);
        const nextTotalItems = updatedItems.reduce((sum, i) => sum + i.quantity, 0);
        queryClient.setQueryData(['cart'], {
          ...previousCart,
          items: updatedItems,
          subtotal: nextSubtotal,
          totalItems: nextTotalItems,
        });
      }
      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart);
      if (appliedCoupon) {
        handleValidateCoupon(appliedCoupon.code, updatedCart.subtotal);
      }
    },
    
  });

  const clearMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart);
      setAppliedCoupon(null);
      setCouponSuccess('');
    },
  });

  const couponMutation = useMutation({
    mutationFn: validateCoupon,
    onSuccess: (data) => {
      if (data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponSuccess(data.message);
        setCouponError('');
      }
    },
    onError: (err) => {
      setCouponError(err.message || 'Failed to apply coupon.');
      setCouponSuccess('');
    },
  });

  const handleValidateCoupon = (codeToApply, overrideTotal) => {
    const total = overrideTotal !== undefined ? overrideTotal : cart.subtotal;
    setCouponError('');
    setCouponSuccess('');

    if (!codeToApply || !codeToApply.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    couponMutation.mutate({
      code: codeToApply.trim(),
      cartTotal: total,
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponSuccess('');
    setCouponError('');
  };

  const items = cart?.items || [];
  const subtotal = cart?.subtotal || 0;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const shippingFee = subtotal >= 1000 || subtotal === 0 ? 0 : 150;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#6a9739] border-t-transparent"></div>
        <p className="mt-3 text-gray-500">Loading your shopping cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-[#f8f6f3] min-h-[70vh] flex items-center justify-center py-16">
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100 text-gray-400">
            <ShoppingBag className="w-12 h-12 stroke-1 text-[#6a9739]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Your Cart is Currently Empty!
          </h1>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            Looks like you haven't added any fresh organic produce to your basket yet.
          </p>
          <div className="mt-8">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#6a9739] hover:bg-[#58802d] text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f6f3] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb / Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Shopping Cart</h1>
            <p className="text-xs text-gray-500 mt-1">
              Review your items and apply available coupons before proceeding to checkout.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6a9739] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Line Items (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Items Table Card */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  Products ({cart.totalItems})
                </h2>
                <button
                  type="button"
                  onClick={() => clearMutation.mutate()}
                  disabled={clearMutation.isPending}
                  className="text-xs font-semibold text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Clear Cart
                </button>
              </div>

              {/* Table View for Tablets & Desktops */}
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 animate-fade-slide-in"
                  >
                    {/* Product Media & Title */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <Link
                        to={`/product/${item.slug}`}
                        className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 shrink-0 overflow-hidden group/img"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#6a9739]">
                            <Leaf className="w-8 h-8" />
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 space-y-1">
                        <Link
                          to={`/product/${item.slug}`}
                          className="text-sm sm:text-base font-bold text-gray-900 hover:text-[#6a9739] transition-colors line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span>Unit Price:</span>
                          <span className="font-semibold text-gray-800">
                            ₨ {item.unitPrice.toFixed(2)}
                          </span>
                          {item.salePrice !== null && (
                            <span className="text-gray-400 line-through text-[11px]">
                              ₨ {item.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {!item.inStock && (
                          <p className="text-[11px] font-semibold text-red-600">
                            Requested quantity exceeds current stock ({item.stock} left).
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quantity & Subtotal Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                      {/* Quantity Stepper */}
                      <div className="inline-flex items-center border border-gray-200 rounded-lg bg-gray-50/70">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.quantity <= 1) {
                              removeMutation.mutate(item.id);
                            } else {
                              updateMutation.mutate({
                                itemId: item.id,
                                quantity: item.quantity - 1,
                              });
                            }
                          }}
                          disabled={updateMutation.isPending || removeMutation.isPending}
                          className="p-2 text-gray-500 hover:text-gray-900 cursor-pointer disabled:opacity-40 btn-tactile"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="px-3 text-xs font-bold text-gray-900 select-none">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateMutation.mutate({
                              itemId: item.id,
                              quantity: item.quantity + 1,
                            })
                          }
                          disabled={
                            item.quantity >= item.stock ||
                            updateMutation.isPending ||
                            removeMutation.isPending
                          }
                          className="p-2 text-gray-500 hover:text-gray-900 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed btn-tactile"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right min-w-[80px]">
                        <span className="block text-sm sm:text-base font-black text-gray-900">
                          ₨ {item.subtotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeMutation.mutate(item.id)}
                        disabled={removeMutation.isPending}
                        className="p-2 text-gray-400 hover:text-red-600 transition-all cursor-pointer btn-tactile hover:scale-110 active:scale-90"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Self-Serve Available Coupons Component */}
            <CouponList
              appliedCode={appliedCoupon?.code}
              onApplyCoupon={(code) => {
                setCouponCodeInput(code);
                handleValidateCoupon(code);
              }}
              cartTotal={subtotal}
            />
          </div>

          {/* Right Column: Order Summary & Coupon Entry (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-5">
              <h2 className="text-lg font-black text-gray-900">Order Summary</h2>

              {/* Free Shipping Progress Indicator */}
              <div className="p-3.5 bg-green-50/70 border border-green-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-green-900">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#6a9739]" />
                    {subtotal >= 1000
                      ? 'You unlocked FREE shipping!'
                      : `Add ₨ ${(1000 - subtotal).toFixed(2)} more for FREE shipping`}
                  </span>
                  <span>₨ 1,000</span>
                </div>
                <div className="w-full bg-green-200/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#6a9739] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (subtotal / 1000) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Coupon Code Entry Form */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                  Have a Coupon Code?
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. ORGANIC25"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono uppercase bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#6a9739]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleValidateCoupon(couponCodeInput)}
                    disabled={couponMutation.isPending || !couponCodeInput.trim()}
                    className="px-4 py-2 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {couponMutation.isPending ? 'Checking...' : 'Apply'}
                  </button>
                </div>

                {couponError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{couponError}</span>
                  </div>
                )}

                {couponSuccess && (
                  <div className="flex items-center gap-1.5 text-xs text-green-700 font-medium mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{couponSuccess}</span>
                  </div>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">₨ {subtotal.toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-green-700 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>Coupon ({appliedCoupon.code})</span>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-red-500 hover:text-red-700 text-xs underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <span>- ₨ {discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-gray-600">
                  <span>Estimated Delivery</span>
                  <span className="font-semibold text-gray-900">
                    {shippingFee === 0 ? (
                      <span className="text-[#6a9739] font-bold">FREE</span>
                    ) : (
                      `₨ ${shippingFee.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-3 flex items-baseline justify-between">
                  <span className="text-base font-bold text-gray-900">Estimated Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#6a9739]">
                      ₨ {grandTotal.toFixed(2)}
                    </span>
                    <p className="text-[10px] text-gray-400">Includes all applicable sales tax</p>
                  </div>
                </div>
              </div>

              {/* Checkout CTA Button */}
              <button
                type="button"
                onClick={() => {
                  // Navigate to checkout with optional applied coupon state
                  navigate('/checkout', { state: { appliedCoupon } });
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-[#6a9739] hover:bg-[#58802d] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer text-sm"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>

              {/* Trust Badges */}
              <div className="pt-2 border-t border-gray-50 flex items-center justify-center gap-6 text-[11px] text-gray-500 font-medium">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#6a9739]" />
                  <span>Secure Checkout</span>
                </div>
                <div className="flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5 text-[#6a9739]" />
                  <span>100% Organic</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
