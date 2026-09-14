import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Truck,
  CreditCard,
  MapPin,
  Calendar,
  Leaf,
  CheckCircle2,
  XCircle,
  Star,
  ShieldCheck,
  Printer,
} from 'lucide-react';
import { getOrderById, confirmOrderDelivery, cancelCustomerOrder } from '../../services/orderApi';
import ConfirmModal from '../../components/ConfirmModal';

export default function OrderDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [actionFeedback, setActionFeedback] = useState('');
  const [dialogConfig, setDialogConfig] = useState(null);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(id),
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: () => confirmOrderDelivery(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      setActionFeedback('Delivery confirmed! Thank you. You can now review your purchased items.');
      setTimeout(() => setActionFeedback(''), 6000);
    },
    onError: (err) => {
      setDialogConfig({
        isOpen: true,
        isAlertOnly: true,
        title: 'Confirmation Failed',
        message: err.message || 'Failed to confirm delivery.',
        variant: 'danger',
        confirmText: 'Dismiss',
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: () => cancelCustomerOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
      setActionFeedback('Your order has been cancelled successfully.');
      setTimeout(() => setActionFeedback(''), 6000);
    },
    onError: (err) => {
      setDialogConfig({
        isOpen: true,
        isAlertOnly: true,
        title: 'Cancellation Failed',
        message: err.message || 'Failed to cancel order.',
        variant: 'danger',
        confirmText: 'Dismiss',
      });
    },
  });

  const handleConfirmDelivery = () => {
    setDialogConfig({
      isOpen: true,
      title: 'Confirm Delivery Receipt',
      message: 'Have you received your package? Confirming delivery will mark your order as complete and unlock product reviews.',
      confirmText: 'Yes, I Received It',
      cancelText: 'Not Yet',
      variant: 'success',
      onConfirm: () => {
        setDialogConfig(null);
        confirmDeliveryMutation.mutate();
      },
    });
  };

  const handleCancelOrder = () => {
    setDialogConfig({
      isOpen: true,
      title: 'Cancel Order?',
      message: 'Are you sure you want to cancel this order? This action cannot be undone.',
      confirmText: 'Yes, Cancel Order',
      cancelText: 'Keep Order',
      variant: 'danger',
      onConfirm: () => {
        setDialogConfig(null);
        cancelOrderMutation.mutate();
      },
    });
  };

  const getStatusStep = (status) => {
    const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    return steps.indexOf(status);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#6a9739] border-t-transparent"></div>
        <p className="mt-3 text-gray-500 text-xs">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Order Not Found</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          We couldn't retrieve the requested order. It may not belong to your account or has been deleted.
        </p>
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#6a9739] text-white text-xs font-bold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>
      </div>
    );
  }

  const currentStep = getStatusStep(order.status);

  return (
    <div className="space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/account/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#6a9739] transition-colors mb-1 print:hidden"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
          </Link>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            Order <span className="font-mono text-[#6a9739]">{order.orderNumber}</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="print:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-2xs transition-colors cursor-pointer"
            title="Print Receipt Slip"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            <span>Print Receipt</span>
          </button>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#6a9739]/10 text-[#6a9739] border border-[#6a9739]/20">
            {order.status}
          </span>
        </div>
      </div>

      {/* Order Tracking Progress Bar */}
      {order.status !== 'CANCELLED' && (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Order Progress
          </h3>
          <div className="grid grid-cols-4 gap-2 text-center">
            {['Placed', 'Confirmed', 'Processing', 'Delivered'].map((stepName, idx) => {
              const isCompleted = currentStep >= idx;
              return (
                <div key={stepName} className="space-y-1.5">
                  <div
                    className={`h-2 rounded-full transition-colors ${
                      isCompleted ? 'bg-[#6a9739]' : 'bg-gray-100'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-bold block ${
                      isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {stepName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Notification Toast */}
      {actionFeedback && (
        <div className="print:hidden p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#6a9739] shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Customer Delivery & Order Actions */}
      {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
        <div className="print:hidden bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#6a9739]" />
              {order.status === 'SHIPPED' ? 'Parcel Out For Delivery' : 'Order Active & Processing'}
            </span>
            <p className="text-xs text-gray-500">
              Have you received your groceries? Please confirm parcel delivery below to complete your order.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Cancel Button (available if PENDING or CONFIRMED) */}
            {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelOrderMutation.isPending}
                className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{cancelOrderMutation.isPending ? 'Cancelling...' : 'Cancel Order'}</span>
              </button>
            )}

            {/* Confirm Delivery Button */}
            <button
              type="button"
              onClick={handleConfirmDelivery}
              disabled={confirmDeliveryMutation.isPending}
              className="px-5 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{confirmDeliveryMutation.isPending ? 'Confirming...' : 'I Received My Parcel'}</span>
            </button>
          </div>
        </div>
      )}

      {order.status === 'DELIVERED' && (
        <div className="bg-green-50/70 border border-green-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-green-200 flex items-center justify-center text-[#6a9739] shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-green-900 block">
                Parcel Delivered &amp; Receipt Confirmed
              </span>
              <p className="text-[11px] text-green-700">
                You are now eligible to leave verified reviews on all items in this order below!
              </p>
            </div>
          </div>
        </div>
      )}

      {order.status === 'CANCELLED' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3 text-red-700 text-xs font-semibold">
          <XCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>This order has been cancelled.</span>
        </div>
      )}

      {/* Meta Grid: Address, Payment, Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-[#6a9739]" />
            <span>Order Date</span>
          </div>
          <p className="text-xs font-semibold text-gray-800">
            {new Date(order.createdAt).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <CreditCard className="w-3.5 h-3.5 text-[#6a9739]" />
            <span>Payment</span>
          </div>
          <p className="text-xs font-semibold text-gray-800">
            {order.paymentMethod} &bull;{' '}
            <span className={`font-bold ${order.paymentStatus === 'PAID' ? 'text-[#6a9739]' : order.paymentStatus === 'FAILED' ? 'text-red-600' : 'text-amber-600'}`}>{order.paymentStatus}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-[#6a9739]" />
            <span>Delivery Destination</span>
          </div>
          <p className="text-xs font-semibold text-gray-800 line-clamp-2">
            {order.address?.street}, {order.address?.city}
          </p>
        </div>
      </div>

      {/* Line Items List */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
          Order Items ({order.items?.length || 0})
        </h3>
        <div className="divide-y divide-gray-100">
          {order.items?.map((item) => (
            <div key={item.id} className="py-3.5 first:pt-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#6a9739]">
                      <Leaf className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {item.productName}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {item.quantity} × ₨ {item.unitPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  ₨ {item.totalPrice.toFixed(2)}
                </span>
                {order.status === 'DELIVERED' && (
                  <Link
                    to={`/product/${item.slug || item.productId}#reviews`}
                    className="print:hidden inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 hover:bg-green-100 text-[#6a9739] text-[11px] font-bold rounded-lg border border-green-200 transition-colors"
                  >
                    <Star className="w-3 h-3 fill-[#6a9739]" />
                    <span>Review</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Breakdown */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-6 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 pb-2 border-b border-gray-100">
          Payment Summary
        </h3>

        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-bold text-gray-900">₨ {order.subtotal.toFixed(2)}</span>
          </div>

          {order.discountAmount > 0 && (
            <div className="flex justify-between text-green-700 font-medium">
              <span>Coupon Discount {order.coupon?.code ? `(${order.coupon.code})` : ''}</span>
              <span>- ₨ {order.discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Delivery Shipping</span>
            <span className="font-semibold text-gray-900">
              {order.shippingFee === 0 ? 'FREE' : `₨ ${order.shippingFee.toFixed(2)}`}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline text-sm font-bold text-gray-900">
            <span>Grand Total Due</span>
            <span className="text-xl font-black text-[#6a9739]">
              ₨ {order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
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
          isLoading={confirmDeliveryMutation.isPending || cancelOrderMutation.isPending}
          onClose={() => setDialogConfig(null)}
          onConfirm={dialogConfig.onConfirm}
        />
      )}
    </div>
  );
}
