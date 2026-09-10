import { useLocation, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ShoppingBag, Truck, ArrowRight, MapPin, Calendar, Leaf } from 'lucide-react';
import { getOrderById } from '../services/orderApi';

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const location = useLocation();

  // Try to use order passed in location state first, otherwise fetch by orderNumber/id
  const stateOrder = location.state?.order;

  const { data: fetchedOrder, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => getOrderById(orderNumber),
    enabled: !stateOrder && Boolean(orderNumber),
  });

  const order = stateOrder || fetchedOrder;

  if (isLoading && !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#6a9739] border-t-transparent"></div>
        <p className="mt-3 text-gray-500">Retrieving order details...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f6f3] min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden text-center p-8 sm:p-10 space-y-6">
          {/* Animated Success Badge */}
          <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto text-[#6a9739]">
            <CheckCircle2 className="w-12 h-12 stroke-[1.75]" />
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase font-black tracking-widest text-[#6a9739]">
              Order Placed Successfully!
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Thank You For Your Order
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mt-2">
              We've received your organic grocery order and our local farmers are preparing it for express delivery.
            </p>
          </div>

          {/* Order Meta Box */}
          <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-200/70 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                Order Number
              </span>
              <span className="font-mono text-xs font-bold text-gray-900 break-all">
                {order?.orderNumber || orderNumber}
              </span>
            </div>

            <div>
              <span className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                Payment
              </span>
              <span className="text-xs font-bold text-gray-900">
                {order?.paymentMethod || 'COD'} (Unpaid)
              </span>
            </div>

            <div>
              <span className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                Total Due
              </span>
              <span className="text-xs font-black text-[#6a9739]">
                ₨ {(order?.totalAmount || 0).toFixed(2)}
              </span>
            </div>

            <div>
              <span className="block text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                Status
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                {order?.status || 'PENDING'}
              </span>
            </div>
          </div>

          {/* Delivery Note */}
          <div className="p-4 bg-green-50/60 border border-green-200 rounded-xl flex items-center justify-center gap-2.5 text-xs text-green-900 font-medium">
            <Truck className="w-4 h-4 text-[#6a9739] shrink-0" />
            <span>Please have <strong>₨ {(order?.totalAmount || 0).toFixed(2)}</strong> cash ready upon courier arrival.</span>
          </div>

          {/* Order Items Review if available */}
          {order?.items && order.items.length > 0 && (
            <div className="text-left border-t border-gray-100 pt-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Items In This Order
              </h3>
              <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {order.items.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Leaf className="w-3.5 h-3.5 text-[#6a9739]" />
                      <span className="font-semibold text-gray-900">{item.productName}</span>
                      <span className="text-gray-400">× {item.quantity}</span>
                    </div>
                    <span className="font-bold text-gray-800">₨ {item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shipping Address Summary if available */}
          {order?.address && (
            <div className="text-left border-t border-gray-100 pt-6 text-xs text-gray-600 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#6a9739] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900 block">
                  Delivering to: {order.address.recipientName} ({order.address.phone})
                </span>
                <span>
                  {order.address.street}, {order.address.city}, {order.address.country}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/shop"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
