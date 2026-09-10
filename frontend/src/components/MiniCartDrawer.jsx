import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ShoppingBag, ArrowRight, Trash2, Plus, Minus, Leaf } from 'lucide-react';
import { useCartDrawerStore } from '../store/cartDrawerStore';
import { getCart, updateCartItem, removeCartItem } from '../services/cartApi';

export default function MiniCartDrawer() {
  const { isOpen, closeDrawer } = useCartDrawerStore();
  const queryClient = useQueryClient();

  const { data: cart = { items: [], totalItems: 0, subtotal: 0 } } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    staleTime: 1000 * 30, // 30 seconds
  });

  const updateMutation = useMutation({
    mutationFn: updateCartItem,
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart);
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeCartItem,
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart);
    },
  });

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

  const items = cart?.items || [];
  const totalItems = cart?.totalItems || 0;
  const subtotal = cart?.subtotal || 0;

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
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
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

          {/* Cart Contents */}
          {items.length === 0 ? (
            /* Empty State */
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
          ) : (
            /* Line Items List */
            <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="pt-4 first:pt-0 flex gap-3.5 items-start">
                  {/* Item Image */}
                  <Link
                    to={`/product/${item.slug}`}
                    onClick={closeDrawer}
                    className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 shrink-0 overflow-hidden"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#6a9739]">
                        <Leaf className="w-6 h-6" />
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.slug}`}
                      onClick={closeDrawer}
                      className="text-xs font-bold text-gray-900 hover:text-[#6a9739] transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-gray-500">
                        ₨ {item.unitPrice.toFixed(2)} each
                      </span>
                    </div>

                    {/* Quantity Selector & Remove Action */}
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="inline-flex items-center border border-gray-200 rounded-md bg-gray-50/50">
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
                          className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer disabled:opacity-40"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <span className="px-2.5 text-xs font-bold text-gray-800">
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
                          className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-extrabold text-gray-900">
                          ₨ {item.subtotal.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(item.id)}
                          disabled={removeMutation.isPending}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          {items.length > 0 && (
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-3">
              <div className="flex items-center justify-between text-sm font-bold text-gray-900">
                <span>Subtotal:</span>
                <span className="text-[#6a9739] font-extrabold text-base">
                  ₨ {subtotal.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Taxes, coupons, and delivery calculated at checkout.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/cart"
                  onClick={closeDrawer}
                  className="w-full text-center px-4 py-2.5 bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  View Cart
                </Link>
                <Link
                  to="/checkout"
                  onClick={closeDrawer}
                  className="w-full text-center px-4 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
