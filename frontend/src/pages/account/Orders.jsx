import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, ArrowRight, MapPin, Leaf } from 'lucide-react';
import { getMyOrders } from '../../services/orderApi';

export default function Orders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: getMyOrders,
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SHIPPED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CONFIRMED':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING':
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#6a9739] border-t-transparent"></div>
        <p className="mt-3 text-gray-500 text-xs">Loading your order history...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto text-gray-400">
          <Package className="w-8 h-8 stroke-1 text-[#6a9739]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">No Orders Placed Yet</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
            You haven't placed any orders yet. Discover our farm-fresh produce and healthy organic groceries!
          </p>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          Start Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">My Orders</h2>
          <p className="text-xs text-gray-500">Track and review all your past and current organic orders.</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
        </span>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden hover:border-[#6a9739]/40 transition-colors"
          >
            {/* Card Header */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/40 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-gray-400">Order</span>
                  <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-gray-400">Date</span>
                  <span className="text-gray-700 font-medium">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-gray-400">Total Due</span>
                  <span className="font-black text-[#6a9739]">₨ {order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadge(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>

                <Link
                  to={`/account/orders/${order.orderNumber}`}
                  className="px-3 py-1 bg-white border border-gray-200 hover:border-[#6a9739] text-gray-700 hover:text-[#6a9739] text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  View Details
                </Link>
              </div>
            </div>

            {/* Line Items Preview */}
            <div className="p-5 space-y-3">
              <div className="divide-y divide-gray-50">
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="py-2 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#6a9739]">
                            <Leaf className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{item.productName}</h4>
                        <span className="text-gray-400 text-[11px]">
                          Qty: {item.quantity} × ₨ {item.unitPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <span className="font-bold text-gray-800 shrink-0">
                      ₨ {item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {order.items.length > 3 && (
                <p className="text-[11px] text-gray-400 font-medium pt-1">
                  + {order.items.length - 3} more items in this order
                </p>
              )}

              {/* Delivery Address Snapshot */}
              {order.address && (
                <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-[#6a9739] shrink-0" />
                  <span className="truncate">
                    Delivering to: {order.address.recipientName} &bull; {order.address.street}, {order.address.city}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
