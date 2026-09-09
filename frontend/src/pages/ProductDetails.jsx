import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProduct } from '../services/productApi';
import Rating from '../components/Rating';
import ProductCard from '../components/ProductCard';
import { ChevronRight, ShoppingBag, Truck, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function ProductDetails() {
  const { identifier } = useParams();
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', identifier],
    queryFn: () => getProduct(identifier),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#6a9739] border-t-transparent"></div>
        <p className="mt-3 text-gray-500">Loading product details...</p>
      </div>
    );
  }

  if (error || !data?.product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Product Not Found</h2>
        <p className="mt-2 text-gray-500">This product is either unavailable or has been moved.</p>
        <Link to="/shop" className="mt-4 inline-block text-[#6a9739] font-semibold hover:underline">
          Back to Shop
        </Link>
      </div>
    );
  }

  const { product, relatedProducts = [] } = data;
  const activeImage = selectedImage || product.primaryImage || product.images?.[0]?.url;

  return (
    <div className="bg-[#f8f6f3] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8">
          <Link to="/" className="hover:text-[#6a9739]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/shop" className="hover:text-[#6a9739]">Shop</Link>
          {product.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to={`/category/${product.category.slug}`} className="hover:text-[#6a9739]">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-gray-800 truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Details Main Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-gray-100 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Gallery Column */}
            <div className="space-y-4">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-xs">
                {product.onSale && (
                  <span className="absolute top-4 left-4 z-10 bg-[#6a9739] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                    Sale! {product.discountPercentage ? `-${product.discountPercentage}%` : ''}
                  </span>
                )}
                <img
                  src={activeImage}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Thumbnails */}
              {product.images?.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img.url)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        activeImage === img.url ? 'border-[#6a9739] scale-95 shadow-xs' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Meta & Actions Column */}
            <div className="space-y-6">
              <div>
                {product.category && (
                  <Link
                    to={`/category/${product.category.slug}`}
                    className="text-xs font-bold uppercase tracking-widest text-[#6a9739] hover:underline"
                  >
                    {product.category.name}
                  </Link>
                )}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                  {product.name}
                </h1>
                <div className="mt-3 flex items-center gap-3">
                  <Rating rating={product.averageRating || 5} showText reviewsCount={product.reviewsCount} />
                  <span className="text-gray-300">|</span>
                  <span className={`text-xs font-semibold flex items-center gap-1 ${product.inStock ? 'text-green-600' : 'text-red-500'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {product.inStock ? `In Stock (${product.stock} units)` : 'Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Pricing Display */}
              <div className="flex items-baseline gap-3 py-3 border-y border-gray-100">
                {product.onSale ? (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      ₨ {product.price.toFixed(2)}
                    </span>
                    <span className="text-3xl font-extrabold text-[#6a9739]">
                      ₨ {product.salePrice.toFixed(2)}
                    </span>
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md">
                      Save ₨ {(product.price - product.salePrice).toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl font-extrabold text-gray-900">
                    ₨ {product.price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {product.description}
              </p>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="px-3.5 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-sm font-bold text-gray-800">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3.5 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  disabled={!product.inStock}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#6a9739] hover:bg-[#58802d] text-white font-bold rounded-lg shadow-sm disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Add to Cart
                </button>
              </div>

              {/* Trust Features */}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 text-xs text-gray-600">
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-[#6a9739]" />
                  <span>Fresh Express Delivery</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#6a9739]" />
                  <span>100% Certified Organic</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Row */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="mb-6">
              <span className="text-xs uppercase font-bold tracking-widest text-[#6a9739]">
                Related Products
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900 mt-1">
                You Might Also Like
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
