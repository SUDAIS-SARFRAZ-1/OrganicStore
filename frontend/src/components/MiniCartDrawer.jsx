import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartDrawerStore } from '../store/cartDrawerStore';

export default function MiniCartDrawer() {
  const { isOpen, closeDrawer } = useCartDrawerStore();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200 cursor-pointer"
        aria-hidden="true"
      />

      {/* Slide-out Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-200 ease-out">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#6a9739]" />
              <h2 className="text-base font-bold text-gray-900">Shopping Cart</h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-[#6a9739]/10 text-[#6a9739] rounded-full">
                0 items
              </span>
            </div>

            <button
              onClick={closeDrawer}
              aria-label="Close cart drawer"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Contents / Empty State */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-4 border border-gray-100">
              <ShoppingBag className="w-9 h-9 stroke-1 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Your cart is empty</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              No items in your shopping bag yet. Explore our organic catalog and fill it with fresh goodness!
            </p>
            <Link
              to="/shop"
              onClick={closeDrawer}
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between text-sm font-bold text-gray-900">
              <span>Subtotal:</span>
              <span className="text-[#6a9739] font-extrabold text-base">₨ 0.00</span>
            </div>
            <p className="text-[11px] text-gray-500">
              Taxes, coupons, and delivery calculated at checkout.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Link
                to="/cart"
                onClick={closeDrawer}
                className="w-full text-center px-4 py-2.5 bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                View Cart
              </Link>
              <Link
                to="/checkout"
                onClick={closeDrawer}
                className="w-full text-center px-4 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Checkout
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
