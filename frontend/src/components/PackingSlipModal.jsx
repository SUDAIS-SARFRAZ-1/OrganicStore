import { useEffect } from 'react';
import {
  Printer,
  X,
  Package,
  Phone,
  FileText,
} from 'lucide-react';

/**
 * Warehouse Packing Slips & Order Manifest Modal (Admin only)
 * Designed for packing staff to physically pack and verify items into boxes before dispatch.
 */
export default function PackingSlipModal({ isOpen, onClose, orders = [], filterStatus = 'ALL' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalItemsCount = orders.reduce((sum, o) => sum + (o.itemsCount || 0), 0);
  const totalValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto print:p-0 print:static print:overflow-visible">
      {/* Dimmed Backdrop (hidden during print) */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity print:hidden"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-10 flex flex-col overflow-hidden print:max-h-none print:w-full print:shadow-none print:border-none print:rounded-none">
        {/* Modal Header (hidden during print) */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50/80 print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6a9739]/10 text-[#6a9739] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Warehouse Packing Slips ({orders.length} Parcels)
              </h2>
              <p className="text-xs text-gray-500">
                Status: <span className="font-semibold text-gray-800">{filterStatus}</span> • Total Items: <span className="font-semibold text-gray-800">{totalItemsCount}</span> • Total Value: <span className="font-semibold text-gray-800">₨ {totalValue.toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slips</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 print:p-0 print:overflow-visible print:space-y-6">
          {/* Printable Store Brand Header (visible in print only) */}
          <div className="hidden print:block border-b-2 border-black pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">
                  Organic Store • Packing Manifest
                </h1>
                <p className="text-xs text-gray-600">
                  Batch Status: {filterStatus} • Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-right text-xs">
                <span className="font-bold">Total Parcels: {orders.length}</span>
                <span className="block text-gray-600">Total Items: {totalItemsCount}</span>
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Package className="w-12 h-12 stroke-1 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-semibold">No orders found to pack in this status.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="border border-gray-200 rounded-xl p-5 bg-white space-y-4 print:border-black print:rounded-none print:p-4 print:page-break-inside-avoid print:break-after-page"
              >
                {/* Parcel Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-gray-100 print:border-gray-400">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded print:bg-transparent print:p-0">
                        #{order.orderNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-gray-100 text-gray-800 print:border print:border-black">
                        {order.status}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Payment Instruction Badge */}
                  <div className="text-right">
                    {order.paymentMethod === 'COD' ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs font-black print:border-black print:bg-white">
                        <span>COLLECT CASH ON DELIVERY:</span>
                        <span className="text-sm font-black">₨ {Number(order.totalAmount).toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-300 rounded-lg text-green-900 text-xs font-black print:border-black print:bg-white">
                        <span>PAID ONLINE ({order.paymentMethod}):</span>
                        <span className="text-sm font-black">₨ 0 (DO NOT COLLECT)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer & Delivery Address Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50/60 p-3 rounded-lg print:bg-transparent print:p-0 print:border print:border-gray-300">
                  <div>
                    <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block mb-1">
                      Customer & Contact
                    </span>
                    <p className="font-bold text-gray-900">{order.address?.recipientName || order.customer?.name || 'Customer'}</p>
                    <p className="text-gray-600 flex items-center gap-1 mt-0.5 font-mono">
                      <Phone className="w-3 h-3 text-gray-400 print:hidden" />
                      <span>{order.address?.phone || order.customer?.phone || 'No phone provided'}</span>
                    </p>
                    {order.customer?.email && (
                      <p className="text-gray-500 text-[11px] mt-0.5">{order.customer.email}</p>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block mb-1">
                      Delivery Destination
                    </span>
                    <p className="text-gray-800 font-medium">
                      {order.address?.street || 'Street not specified'}
                    </p>
                    <p className="text-gray-600 mt-0.5">
                      {[order.address?.city, order.address?.state, order.address?.postalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                </div>

                {/* Delivery Notes (if any) */}
                {order.notes && (
                  <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-900 font-medium flex items-start gap-2 print:border-black print:bg-white">
                    <FileText className="w-4 h-4 text-yellow-700 shrink-0 mt-0.5 print:hidden" />
                    <div>
                      <span className="font-bold text-[11px] uppercase tracking-wider">Customer Special Instructions:</span>
                      <p className="mt-0.5">{order.notes}</p>
                    </div>
                  </div>
                )}

                {/* Items to Pack Table */}
                <div>
                  <div className="flex items-center justify-between pb-1.5">
                    <span className="text-[11px] font-bold text-gray-900 uppercase tracking-wider">
                      Items Checklist (Check each item into box)
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {order.itemsCount} total units
                    </span>
                  </div>

                  <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden print:border-black">
                    <thead className="bg-gray-100 print:bg-gray-200 text-gray-700 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="py-2 px-3 text-center w-10">Packed</th>
                        <th className="py-2 px-3 text-left">Product Item</th>
                        <th className="py-2 px-3 text-center w-16">Qty</th>
                        <th className="py-2 px-3 text-right w-24">Unit Price</th>
                        <th className="py-2 px-3 text-right w-24">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 print:divide-black">
                      {order.items.map((item, itemIdx) => (
                        <tr key={item.id || itemIdx} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 text-center">
                            <div className="w-4 h-4 border-2 border-gray-400 rounded-xs mx-auto print:border-black" />
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-gray-900">
                            {item.productName}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold font-mono text-sm text-gray-900">
                            ×{item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-600 font-mono">
                            ₨ {Number(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-900 font-mono">
                            ₨ {Number(item.totalPrice).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold text-gray-700 border-t border-gray-200 print:border-black">
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-left">
                          Shipping: {order.shippingFee === 0 ? 'FREE' : `₨ ${Number(order.shippingFee).toFixed(2)}`}
                          {order.discountAmount > 0 && ` • Discount: -₨ ${Number(order.discountAmount).toFixed(2)}`}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-gray-900">Grand Total:</td>
                        <td className="py-2 px-3 text-right font-black text-gray-900 font-mono text-sm">
                          ₨ {Number(order.totalAmount).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Warehouse Signature Strip */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-gray-500 border-t border-dashed border-gray-200 print:border-black">
                  <span>Packed By: _____________________</span>
                  <span>Checked By: _____________________</span>
                  <span>Date Packed: _____________________</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer (hidden during print) */}
        <div className="px-6 py-3.5 border-t border-gray-100 flex items-center justify-between bg-gray-50 print:hidden shrink-0">
          <span className="text-xs text-gray-500">
            Click "Print Slips" to generate clean paper slips for warehouse staff.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
