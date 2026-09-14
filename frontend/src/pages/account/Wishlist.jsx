import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  ArrowRight,
  Package
} from 'lucide-react';
import { getWishlist, removeFromWishlist } from '../../services/userApi';
import { addToCart } from '../../services/cartApi';
import { useCartDrawerStore } from '../../store/cartDrawerStore';

export default function Wishlist() {
  const queryClient = useQueryClient();
  const openDrawer = useCartDrawerStore((s) => s.openDrawer);

  // Fetch Wishlist Items
  const { 
    data: wishlist = [], 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['userWishlist'],
    queryFn: getWishlist,
  });

  // Remove from Wishlist Mutation
  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userWishlist'] });
    },
  });

  // Add to Cart Mutation
  const cartMutation = useMutation({
    mutationFn: (productId) => addToCart({ productId, quantity: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      openDrawer();
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            My Wishlist
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Items you saved to purchase later. Move them to your basket whenever you are ready!
          </p>
        </div>

        <Link
          to="/shop"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 transition-colors"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-2xl p-16 shadow-xs border border-gray-100 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 text-[#6a9739] animate-spin mb-3" />
          <p className="text-xs font-semibold text-gray-600">Loading your saved items...</p>
        </div>
      ) : isError ? (
        <div className="bg-red-50 rounded-2xl p-6 border border-red-200 text-red-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error?.message || 'Failed to load wishlist. Please try again.'}</span>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-xs border border-gray-100 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-sm font-bold text-gray-800">Your wishlist is empty</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">
            You haven't saved any organic groceries yet. Browse our farm-fresh catalog and tap the heart icon on items you love.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Package className="w-4 h-4" />
            Discover Fresh Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {wishlist.map((item) => {
            const product = item.product;
            if (!product) return null;

            const primaryImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80';
            const isOnSale = product.salePrice && product.salePrice < product.price;
            const inStock = product.stock > 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 hover:border-gray-200 transition-all flex flex-col justify-between group relative"
              >
                {/* Remove button */}
                <button
                  type="button"
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate(product.id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div>
                  {/* Thumbnail */}
                  <Link to={`/product/${product.id}`} className="block relative overflow-hidden rounded-xl bg-gray-50 aspect-square mb-3">
                    <img
                      src={primaryImage}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    {isOnSale && (
                      <span className="absolute bottom-2 left-2 bg-[#8bc34a] text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-xs">
                        Sale!
                      </span>
                    )}
                  </Link>

                  {/* Category & Title */}
                  {product.category && (
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      {product.category.name}
                    </span>
                  )}
                  <Link
                    to={`/product/${product.id}`}
                    className="text-xs font-bold text-gray-900 line-clamp-2 hover:text-[#6a9739] transition-colors mb-2"
                  >
                    {product.name}
                  </Link>
                </div>

                {/* Price & Add to Cart */}
                <div className="pt-3 border-t border-gray-50 mt-2 space-y-3">
                  <div className="flex items-baseline gap-2">
                    {isOnSale ? (
                      <>
                        <span className="text-xs text-gray-400 line-through">
                          ₨ {product.price.toLocaleString()}
                        </span>
                        <span className="text-sm font-black text-gray-900">
                          ₨ {product.salePrice.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-black text-gray-900">
                        ₨ {product.price.toLocaleString()}
                      </span>
                    )}

                    <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inStock ? 'bg-green-50 text-[#6a9739]' : 'bg-red-50 text-red-600'
                    }`}>
                      {inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={!inStock || cartMutation.isPending}
                    onClick={() => cartMutation.mutate(product.id)}
                    className="w-full py-2 px-3 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cartMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShoppingCart className="w-3.5 h-3.5" />
                    )}
                    <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
