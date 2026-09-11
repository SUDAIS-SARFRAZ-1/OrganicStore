import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShoppingCart, 
  Search, 
  Loader2, 
  Eye, 
  MapPin, 
  User, 
  X,
  FileSpreadsheet,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { getAdminOrders, updateOrderStatus, exportAdminOrders } from '../../services/adminApi';
import ConfirmModal from '../../components/ConfirmModal';
import PackingSlipModal from '../../components/PackingSlipModal';
import { formatOrderDate, formatDateForCsv } from '../../utils/dateUtils';

export default function Orders() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [dialogConfig, setDialogConfig] = useState(null);

  const statuses = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Shipped', value: 'SHIPPED' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminOrders', selectedStatus, searchTerm, page],
    queryFn: () => getAdminOrders({ status: selectedStatus, search: searchTerm, page, limit: 15 }),
    keepPreviousData: true,
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  const statusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries(['adminOrders']);
      queryClient.invalidateQueries(['adminDashboardStats']);
    },
    onError: (err) => {
      setDialogConfig({
        isOpen: true,
        isAlertOnly: true,
        title: 'Status Update Failed',
        message: err.response?.data?.message || 'Failed to update order status.',
        variant: 'danger',
        confirmText: 'Dismiss',
      });
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    const isCancelled = newStatus === 'CANCELLED';
    const isDelivered = newStatus === 'DELIVERED';
    setDialogConfig({
      isOpen: true,
      title: `Update Order Status to ${newStatus}`,
      message: isCancelled
        ? 'Cancelling this order will mark it as failed and restore reserved stock.'
        : `Are you sure you want to transition this order to "${newStatus}"?`,
      confirmText: `Yes, Set to ${newStatus}`,
      cancelText: 'Cancel',
      variant: isCancelled ? 'danger' : isDelivered ? 'success' : 'primary',
      onConfirm: () => {
        setDialogConfig(null);
        statusMutation.mutate({ id: orderId, status: newStatus });
      },
    });
  };

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

  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isPackingModalOpen, setIsPackingModalOpen] = useState(false);
  const [packingOrders, setPackingOrders] = useState([]);
  const [isLoadingPacking, setIsLoadingPacking] = useState(false);

  const handleExportCsv = async () => {
    try {
      setIsExportingCsv(true);
      const res = await exportAdminOrders({ status: selectedStatus, search: searchTerm });
      const ordersToExport = res?.orders || [];
      if (ordersToExport.length === 0) {
        setDialogConfig({
          isOpen: true,
          isAlertOnly: true,
          title: 'No Orders Found',
          message: `There are no orders matching "${selectedStatus}" to export.`,
          variant: 'info',
          confirmText: 'OK',
        });
        return;
      }

      // Build CSV
      const headers = [
        'Order Number',
        'Date',
        'Status',
        'Customer Name',
        'Customer Phone',
        'Customer Email',
        'Recipient Name',
        'Delivery Phone',
        'Delivery Street',
        'City',
        'State',
        'Postal Code',
        'Items To Pack',
        'Total Units',
        'Payment Method',
        'Payment Status',
        'COD Amount Due (PKR)',
        'Order Subtotal (PKR)',
        'Shipping Fee (PKR)',
        'Discount (PKR)',
        'Grand Total (PKR)',
        'Customer Delivery Notes',
      ];

      const rows = ordersToExport.map((o) => {
        const itemsSummary = (o.items || [])
          .map((it) => `${it.quantity}x ${it.productName}`)
          .join('; ');
        const codDue = o.paymentMethod === 'COD' && o.paymentStatus !== 'PAID' ? Number(o.totalAmount).toFixed(2) : '0.00';

        return [
          o.orderNumber,
          formatDateForCsv(o.createdAt),
          o.status,
          o.customer?.name || '',
          o.customer?.phone || '',
          o.customer?.email || '',
          o.address?.recipientName || o.customer?.name || '',
          o.address?.phone || o.customer?.phone || '',
          o.address?.street || '',
          o.address?.city || '',
          o.address?.state || '',
          o.address?.postalCode || '',
          itemsSummary,
          o.itemsCount || 0,
          o.paymentMethod || '',
          o.paymentStatus || '',
          codDue,
          Number(o.subtotal).toFixed(2),
          Number(o.shippingFee).toFixed(2),
          Number(o.discountAmount).toFixed(2),
          Number(o.totalAmount).toFixed(2),
          o.notes || '',
        ];
      });

      const csvContent =
        '\uFEFF' + // UTF-8 BOM so Excel opens with proper formatting & symbols
        [headers, ...rows]
          .map((row) =>
            row
              .map((val) => {
                const str = String(val ?? '').replace(/"/g, '""');
                return `"${str}"`;
              })
              .join(',')
          )
          .join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateTag = new Date().toISOString().slice(0, 10);
      link.download = `OrganicStore_Orders_${selectedStatus}_${dateTag}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDialogConfig({
        isOpen: true,
        isAlertOnly: true,
        title: 'Export Failed',
        message: err.message || 'Failed to export orders spreadsheet.',
        variant: 'danger',
        confirmText: 'Dismiss',
      });
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleOpenPackingSlips = async () => {
    try {
      setIsLoadingPacking(true);
      const res = await exportAdminOrders({ status: selectedStatus, search: searchTerm });
      const ordersToPack = res?.orders || [];
      if (ordersToPack.length === 0) {
        setDialogConfig({
          isOpen: true,
          isAlertOnly: true,
          title: 'No Orders to Pack',
          message: `There are currently no orders in "${selectedStatus}" status to generate packing slips for.`,
          variant: 'info',
          confirmText: 'OK',
        });
        return;
      }
      setPackingOrders(ordersToPack);
      setIsPackingModalOpen(true);
    } catch (err) {
      setDialogConfig({
        isOpen: true,
        isAlertOnly: true,
        title: 'Could Not Load Slips',
        message: err.message || 'Failed to prepare warehouse packing slips.',
        variant: 'danger',
        confirmText: 'Dismiss',
      });
    } finally {
      setIsLoadingPacking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#6a9739]" />
            Order Management & Fulfillment
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Track customer deliveries, generate packing sheets, and update fulfillment statuses.
          </p>
        </div>

        {/* Warehouse Packing & Sheet Export Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={isExportingCsv}
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Download CSV / Excel sheet of current filtered orders"
          >
            {isExportingCsv ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            )}
            <span>Export Excel Sheet</span>
          </button>

          <button
            type="button"
            disabled={isLoadingPacking}
            onClick={handleOpenPackingSlips}
            className="px-3.5 py-2 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Open printable packing slips for warehouse packaging staff"
          >
            {isLoadingPacking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            <span>Print Packing Slips</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-3">
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                setSelectedStatus(s.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                selectedStatus === s.value
                  ? 'bg-[#6a9739] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number (e.g. ORG-260910-...), customer name, or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-[#6a9739] animate-spin mb-3" />
            <p className="text-xs font-semibold text-gray-500">Loading orders...</p>
          </div>
        ) : isError ? (
          <div className="p-6 text-xs text-red-700 bg-red-50">
            {error?.message || 'Error fetching orders.'}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            No orders found matching the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 text-gray-500 font-bold border-b border-gray-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Fulfillment Status</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-gray-900 block">
                        {o.orderNumber}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {o.itemsCount} {o.itemsCount === 1 ? 'item' : 'items'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 block">
                        {o.customer?.name || 'Customer'}
                      </span>
                      <span className="text-[10px] text-gray-400 block truncate max-w-[150px]">
                        {o.customer?.email}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600 font-medium">
                      {formatOrderDate(o.createdAt, false)}
                    </td>

                    <td className="py-3.5 px-4 font-black text-gray-900">
                      ₨ {o.totalAmount.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-700 block text-[10px]">
                          {o.paymentMethod}
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          o.paymentStatus === 'PAID' || o.paymentStatus === 'COMPLETED'
                            ? 'bg-green-50 text-[#6a9739]'
                            : o.paymentStatus === 'FAILED'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="relative inline-block w-full min-w-[130px]">
                        <select
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          disabled={o.status === 'CANCELLED' || o.status === 'DELIVERED'}
                          className={`w-full appearance-none text-[11px] font-bold pl-2.5 pr-7 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-black/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 transition-all ${getStatusBadge(o.status)}`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 text-gray-400 hover:text-[#6a9739] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                        title="View Order Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150 text-xs">
            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-black text-gray-900">
                Order #{selectedOrder.orderNumber}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedOrder.status)}`}>
                {selectedOrder.status}
              </span>
            </div>
            <p className="text-gray-500 mb-6 font-medium">
              Placed on {formatOrderDate(selectedOrder.createdAt)}
            </p>

            {/* Customer & Shipping Details */}
            <div className="p-4 bg-gray-50 rounded-xl mb-4 space-y-2">
              <div className="flex items-center gap-2 font-bold text-gray-800">
                <User className="w-3.5 h-3.5 text-[#6a9739]" />
                <span>Customer: {selectedOrder.customer?.name} ({selectedOrder.customer?.email})</span>
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-[#6a9739] shrink-0 mt-0.5" />
                <span>
                  {selectedOrder.address?.recipientName}, {selectedOrder.address?.phone}<br />
                  {selectedOrder.address?.street}, {selectedOrder.address?.city} {selectedOrder.address?.postalCode}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3 mb-6">
              <span className="font-bold text-gray-700 block uppercase tracking-wider text-[10px]">
                Order Items
              </span>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl p-3">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-900 block">{item.productName}</span>
                      <span className="text-gray-400 text-[11px]">
                        ₨ {item.unitPrice} × {item.quantity}
                      </span>
                    </div>
                    <span className="font-black text-gray-900">
                      ₨ {item.totalPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials Breakdown */}
            <div className="p-4 bg-gray-50 rounded-xl space-y-1.5 font-medium">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal:</span>
                <span>₨ {selectedOrder.subtotal.toLocaleString()}</span>
              </div>
              {selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Coupon Discount:</span>
                  <span>- ₨ {selectedOrder.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Delivery Shipping:</span>
                <span>₨ {selectedOrder.shippingFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-gray-900 pt-2 border-t border-gray-200 text-sm">
                <span>Grand Total:</span>
                <span className="text-[#6a9739]">₨ {selectedOrder.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
          isLoading={statusMutation.isPending}
          onClose={() => setDialogConfig(null)}
          onConfirm={dialogConfig.onConfirm}
        />
      )}

      {/* Warehouse Packing Slips & Order Manifest Modal */}
      <PackingSlipModal
        isOpen={isPackingModalOpen}
        onClose={() => setIsPackingModalOpen(false)}
        orders={packingOrders}
        filterStatus={selectedStatus}
      />
    </div>
  );
}
