import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight, 
  Loader2, 
} from 'lucide-react';
import { getDashboardStats } from '../../services/adminApi';

export default function Dashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: getDashboardStats,
    refetchInterval: 1000 * 30, // live 30-sec refresh
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#6a9739] animate-spin mb-3" />
        <p className="text-xs font-bold text-gray-500">Loading store analytics...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
        Failed to load store telemetry: {error?.message}
      </div>
    );
  }

  const stats = data?.stats || {
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
  };

  const recentOrders = data?.recentOrders || [];
  const lowStockProducts = data?.lowStockProducts || [];
  const salesTrend = data?.salesTrend || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-green-50 text-[#6a9739] border-green-200';
      case 'SHIPPED':
      case 'PROCESSING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CONFIRMED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  // Find max revenue for chart scaling
  const maxRevenue = Math.max(...salesTrend.map((t) => t.revenue), 1000);

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Executive Store Dashboard
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Real-time performance metrics, customer order volumes, and inventory monitoring.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sales */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-[#6a9739] flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Total Revenue
            </span>
            <span className="text-xl font-black text-gray-900">
              ₨ {stats.totalRevenue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Orders Placed
            </span>
            <span className="text-xl font-black text-gray-900">
              {stats.totalOrders}
            </span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Customers
            </span>
            <span className="text-xl font-black text-gray-900">
              {stats.totalCustomers}
            </span>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Live Catalog
            </span>
            <span className="text-xl font-black text-gray-900">
              {stats.totalProducts} items
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Low Stock Alert
            </span>
            <span className="text-xl font-black text-amber-600">
              {stats.lowStockCount} items
            </span>
          </div>
        </div>
      </div>

      {/* Sales Trend Bar Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#6a9739]" />
              7-Day Revenue Velocity
            </h2>
            <p className="text-xs text-gray-400">Daily revenue captured over the past week</p>
          </div>
        </div>

        <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-gray-100 px-2">
          {salesTrend.map((point) => {
            const heightPercent = Math.max(Math.round((point.revenue / maxRevenue) * 100), 8);
            return (
              <div key={point.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  ₨ {point.revenue.toLocaleString()}
                </span>
                <div
                  className="w-full max-w-[40px] bg-gradient-to-t from-[#6a9739] to-[#8bc34a] rounded-t-lg transition-all duration-300 group-hover:brightness-110"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] font-semibold text-gray-400 mt-1">
                  {point.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Split Grid: Recent Orders (7 cols) + Low Stock Alert (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-gray-900">
              Recent Customer Orders
            </h2>
            <Link
              to="/admin/orders"
              className="text-xs font-bold text-[#6a9739] hover:underline inline-flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No orders placed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 font-bold border-b border-gray-100 pb-2">
                    <th className="pb-2">Order #</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 font-bold text-gray-900">
                        {o.orderNumber}
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-gray-800 block">{o.customerName}</span>
                        <span className="text-[10px] text-gray-400">{o.city}</span>
                      </td>
                      <td className="py-3 font-bold text-gray-900">
                        ₨ {o.totalAmount.toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Products */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Low Stock Warnings
            </h2>
            <Link
              to="/admin/products"
              className="text-xs font-bold text-[#6a9739] hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-green-700 bg-green-50 p-4 rounded-xl text-center">
              All product stock levels are healthy!
            </p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={p.image || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=80&q=80'}
                      alt=""
                      className="w-9 h-9 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-gray-800 truncate block">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        {p.categoryName} • ₨ {p.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
