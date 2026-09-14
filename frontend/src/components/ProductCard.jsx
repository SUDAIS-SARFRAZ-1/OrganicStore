import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Check } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Rating from './Rating';
import { getWishlist, toggleWishlist } from '../services/userApi';
import { useAuthStore } from '../store/authStore';

export default function ProductCard({ product, onAddToCart }) {
  const [justAdded, setJustAdded] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: wishlist = [] } = useQuery({
    queryKey: ['userWishlist'],
    queryFn: getWishlist,
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const isWishlisted = wishlist.some((item) => item.product?.id === product?.id || item.productId === product?.id);

  const wishlistMutation = useMutation({
    mutationFn: () => toggleWishlist(product.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['userWishlist'] });
      const previousWishlist = queryClient.getQueryData(['userWishlist']) || [];
      const exists = previousWishlist.some((w) => (w.product?.id || w.productId) === product.id);
      
      // Optimistic update
      const updated = exists
        ? previousWishlist.filter((w) => (w.product?.id || w.productId) !== product.id)
        : [...previousWishlist, { id: `opt-${Date.now()}`, productId: product.id, product }];

      queryClient.setQueryData(['userWishlist'], updated);
      return { previousWishlist };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(['userWishlist'], context.previousWishlist);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['userWishlist'] });
    },
  });

  if (!product) return null;

  const handleAddClick = () => {
    if (!product.inStock) return;
    setJustAdded(true);
    if (onAddToCart) onAddToCart(product);
    setTimeout(() => setJustAdded(false), 900);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    wishlistMutation.mutate();
  };

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden border border-gray-100/80 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ease-out flex flex-col h-full will-change-transform">
      {/* Sale & Stock Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {product.onSale && (
          <span className="bg-[#6a9739] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs tracking-wide">
            Sale! {product.discountPercentage ? `-${product.discountPercentage}%` : ''}
          </span>
        )}
        {!product.inStock && (
          <span className="bg-red-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
            Out of Stock
          </span>
        )}
      </div>

      {/* Wishlist Quick Toggle Button */}
      <button
        type="button"
        onClick={handleWishlistClick}
        aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-gray-100/80 flex items-center justify-center text-gray-400 hover:text-red-500 shadow-xs hover:shadow-sm btn-tactile group/heart cursor-pointer"
      >
        <Heart
          className={`w-4 h-4 transition-all duration-200 ${
            isWishlisted ? 'fill-red-500 text-red-500 animate-heart-pop' : 'group-hover/heart:text-red-500'
          }`}
        />
      </button>

      {/* Product Image Link */}
      <Link
        to={`/product/${product.slug}`}
        className="block relative aspect-square overflow-hidden bg-gray-50/50"
      >
        <img
          src={product.primaryImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out will-change-transform"
        />
      </Link>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow justify-between">
        <div>
          {/* Category Tag */}
          {product.category && (
            <Link
              to={`/category/${product.category.slug}`}
              className="text-[11px] font-medium uppercase tracking-wider text-gray-400 hover:text-[#6a9739] transition-colors mb-1.5 block"
            >
              {product.category.name}
            </Link>
          )}

          {/* Product Title */}
          <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-[#6a9739] transition-colors">
            <Link to={`/product/${product.slug}`}>
              {product.name}
            </Link>
          </h3>

          {/* Ratings */}
          <div className="mt-2">
            <Rating rating={product.averageRating || 5} />
          </div>
        </div>

        {/* Pricing & Add to Cart Footer */}
        <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            {product.onSale ? (
              <>
                <span className="text-xs text-gray-400 line-through">
                  ₨ {product.price.toFixed(2)}
                </span>
                <span className="text-base sm:text-lg font-extrabold text-[#6a9739]">
                  ₨ {product.salePrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-base sm:text-lg font-extrabold text-gray-900">
                ₨ {product.price.toFixed(2)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddClick}
            disabled={!product.inStock}
            aria-label={`Add ${product.name} to cart`}
            className={`px-2.5 py-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed shadow-2xs group/btn flex items-center gap-1.5 btn-tactile ${
              justAdded
                ? 'bg-[#6a9739] text-white shadow-xs'
                : 'bg-gray-50 text-gray-700 hover:bg-[#6a9739] hover:text-white disabled:opacity-40 disabled:hover:bg-gray-50 disabled:hover:text-gray-700'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 animate-check-pulse" />
                <span className="hidden sm:inline">Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
