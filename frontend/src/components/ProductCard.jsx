import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import Rating from './Rating';

export default function ProductCard({ product, onAddToCart }) {
  if (!product) return null;

  return (
    <div className="group relative bg-white rounded-xl overflow-hidden border border-gray-100/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col h-full">
      {/* Sale & Stock Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
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

      {/* Product Image Link */}
      <Link
        to={`/product/${product.slug}`}
        className="block relative aspect-square overflow-hidden bg-gray-50/50"
      >
        <img
          src={product.primaryImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
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
            onClick={() => onAddToCart && onAddToCart(product)}
            disabled={!product.inStock}
            aria-label={`Add ${product.name} to cart`}
            className="px-2.5 py-2 sm:px-3 sm:py-2 rounded-xl bg-gray-50 text-gray-700 hover:bg-[#6a9739] hover:text-white active:scale-90 hover:shadow-sm disabled:opacity-40 disabled:hover:bg-gray-50 disabled:hover:text-gray-700 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed shadow-2xs group/btn flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" />
            <span className="hidden sm:inline text-xs font-bold">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
