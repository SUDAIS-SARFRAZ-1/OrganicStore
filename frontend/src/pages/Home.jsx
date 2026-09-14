import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Truck, Percent, RefreshCw, Clock, ChevronLeft, ChevronRight, AlertCircle, X } from 'lucide-react';
import { getCategories } from '../services/categoryApi';
import { getProducts } from '../services/productApi';
import { getTestimonials, getBrandLogos, getHomeSections } from '../services/contentApi';
import { addToCart } from '../services/cartApi';
import { useCartDrawerStore } from '../store/cartDrawerStore';
import ProductCard from '../components/ProductCard';
import TestimonialCard from '../components/TestimonialCard';

export default function Home() {
  const queryClient = useQueryClient();
  const { openDrawer } = useCartDrawerStore();
  const [cartError, setCartError] = useState(null);

  const bestSellingRef = useRef(null);
  const categoriesRef = useRef(null);
  const trendingRef = useRef(null);

  const scrollLeft = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = (ref) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const addMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: (updatedCart) => {
      setCartError(null);
      queryClient.setQueryData(['cart'], updatedCart);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      openDrawer();
    },
    onError: (err) => {
      const msg = err.message || err.response?.data?.message || 'Failed to add item to cart.';
      setCartError(msg);
      setTimeout(() => {
        setCartError((prev) => (prev === msg ? null : prev));
      }, 5000);
    },
  });

  const handleAddToCart = (product) => {
    addMutation.mutate({ productId: product.id, quantity: 1 });
  };

  // Dynamic categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories({ includeFallback: true }),
  });

  // Best Selling Products (Featured)
  const { data: featuredData, isLoading: isFeaturedLoading } = useQuery({
    queryKey: ['products', { featured: true, limit: 4 }],
    queryFn: () => getProducts({ featured: 'true', limit: 4 }),
  });

  // Trending / Latest Products
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery({
    queryKey: ['products', { sort: 'latest', limit: 4 }],
    queryFn: () => getProducts({ sort: 'latest', limit: 4 }),
  });

  // Testimonials
  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials'],
    queryFn: getTestimonials,
    staleTime: 5 * 60 * 1000,
  });

  // Brand Logos
  const { data: brands = [] } = useQuery({
    queryKey: ['brandLogos'],
    queryFn: getBrandLogos,
    staleTime: 5 * 60 * 1000,
  });

  // Home Sections (Deal of the Day, etc.)
  const { data: homeSections = [] } = useQuery({
    queryKey: ['homeSections'],
    queryFn: getHomeSections,
    staleTime: 5 * 60 * 1000,
  });

  const featuredProducts = featuredData?.products || [];
  const trendingProducts = trendingData?.products || [];
  const dealOfDay = homeSections.find((s) => s.type === 'DEAL_OF_DAY');

  return (
    <div className="bg-[#f8f6f3] min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-b from-[#f8f6f3] to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6a9739]/10 text-[#6a9739] text-xs font-semibold uppercase tracking-wider">
                Best Quality Products
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Join The Organic <br />
                <span className="text-[#6a9739]">Movement!</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">
                Discover farm-fresh, 100% certified organic groceries, pure cold-pressed juices, and fresh produce delivered straight from growers to your doorstep.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#6a9739] hover:bg-[#58802d] text-white font-semibold rounded-md shadow-sm transition-all duration-150 cursor-pointer"
                >
                  Shop Now <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/category/groceries"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 font-semibold rounded-md transition-all duration-150 cursor-pointer"
                >
                  Browse Groceries
                </Link>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl bg-white border-4 border-white">
                <img
                  src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80"
                  alt="Fresh Organic Basket"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Strip */}
      <section className="bg-[#111827] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#6a9739]/20 text-[#6a9739]">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Free Shipping</h4>
                <p className="text-xs text-gray-400">On all orders above ₨ 1,500</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10 text-[#6a9739] flex items-center justify-center w-11 h-11">
                <img
                  src="/brands/certified-organic.svg"
                  alt="Certified Organic Seal"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Certified Organic</h4>
                <p className="text-xs text-gray-400">100% guarantee on freshness</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#6a9739]/20 text-[#6a9739]">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Huge Savings</h4>
                <p className="text-xs text-gray-400">At guaranteed lowest prices</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#6a9739]/20 text-[#6a9739]">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Easy Returns</h4>
                <p className="text-xs text-gray-400">No questions asked policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Selling Products Section with Horizontal Carousel */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#6a9739]">
              Handpicked For You
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-1">
              Best Selling Products
            </h2>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => scrollLeft(bestSellingRef)}
              aria-label="Previous Best Selling Products"
              className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#6a9739] hover:border-[#6a9739] hover:bg-[#f8f6f3] flex items-center justify-center shadow-xs transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollRight(bestSellingRef)}
              aria-label="Next Best Selling Products"
              className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#6a9739] hover:border-[#6a9739] hover:bg-[#f8f6f3] flex items-center justify-center shadow-xs transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isFeaturedLoading ? (
          <div className="flex gap-6 overflow-hidden py-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-64 sm:w-72 h-80 bg-white rounded-xl animate-pulse border border-gray-100 shrink-0"></div>
            ))}
          </div>
        ) : (
          <div
            ref={bestSellingRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-3 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {featuredProducts.map((product) => (
              <div key={product.id} className="w-64 sm:w-72 shrink-0 snap-start">
                <ProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Category Highlight Cards with Horizontal Carousel */}
      <section className="py-14 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-widest text-[#6a9739]">
                Explore Catalog
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-1">
                Shop by Category
              </h2>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => scrollLeft(categoriesRef)}
                aria-label="Previous Categories"
                className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#6a9739] hover:border-[#6a9739] hover:bg-[#f8f6f3] flex items-center justify-center shadow-xs transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollRight(categoriesRef)}
                aria-label="Next Categories"
                className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#6a9739] hover:border-[#6a9739] hover:bg-[#f8f6f3] flex items-center justify-center shadow-xs transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div
            ref={categoriesRef}
            className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-3 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="w-48 sm:w-56 shrink-0 snap-start group bg-[#f8f6f3] rounded-2xl p-6 shadow-2xs hover:shadow-md border border-gray-100 transition-all text-center flex flex-col items-center cursor-pointer"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden bg-white mb-4 group-hover:scale-105 transition-transform duration-200 border border-gray-200 shadow-2xs">
                  <img
                    src={cat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80'}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-bold text-gray-800 group-hover:text-[#6a9739] transition-colors text-base">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {cat.productCount} {cat.productCount === 1 ? 'Product' : 'Products'}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner Strip */}
      <section className="py-16 bg-[#f8f6f3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <span className="text-xs uppercase font-bold tracking-widest text-[#6a9739]">
                Special Seasonal Offer
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Get 25% Off On Your First Purchase!
              </h2>
              <p className="text-sm text-gray-300">
                Use code <span className="font-mono font-bold text-[#6a9739] bg-[#6a9739]/10 px-2 py-0.5 rounded">ORGANIC25</span> at checkout for instant savings.
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#6a9739] hover:bg-[#58802d] text-white font-bold rounded-lg shadow-sm transition-all duration-150 cursor-pointer text-sm whitespace-nowrap"
            >
              Shop Deals Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Products Section with Horizontal Carousel */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#6a9739]">
              Trending Now
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mt-1">
              Fresh &amp; In Demand
            </h2>
          </div>

          <div className="flex items-center gap-4 self-end sm:self-auto">
            <Link
              to="/shop"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold text-[#6a9739] hover:underline mr-2"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scrollLeft(trendingRef)}
                aria-label="Previous Trending Products"
                className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#6a9739] hover:border-[#6a9739] hover:bg-[#f8f6f3] flex items-center justify-center shadow-xs transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => scrollRight(trendingRef)}
                aria-label="Next Trending Products"
                className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#6a9739] hover:border-[#6a9739] hover:bg-[#f8f6f3] flex items-center justify-center shadow-xs transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {isTrendingLoading ? (
          <div className="flex gap-6 overflow-hidden py-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-64 sm:w-72 h-80 bg-white rounded-xl animate-pulse border border-gray-100 shrink-0"></div>
            ))}
          </div>
        ) : (
          <div
            ref={trendingRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-3 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {trendingProducts.map((product) => (
              <div key={product.id} className="w-64 sm:w-72 shrink-0 snap-start">
                <ProductCard
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Deal of the Day (data-driven from DB) */}
      {dealOfDay && (
        <section className="py-16 bg-white border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-gradient-to-br from-[#f8f6f3] to-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {/* Image side */}
              {dealOfDay.bannerImage && (
                <div className="h-64 lg:h-80">
                  <img
                    src={dealOfDay.bannerImage}
                    alt={dealOfDay.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content side */}
              <div className="p-8 lg:p-12 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5" />
                  {dealOfDay.metadata?.badgeText || 'Limited Time'}
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900">
                  {dealOfDay.title}
                </h2>
                {dealOfDay.subtitle && (
                  <p className="text-gray-600 leading-relaxed">
                    {dealOfDay.subtitle}
                  </p>
                )}
                {dealOfDay.metadata?.discountPercent && (
                  <div className="inline-flex items-center gap-2 text-2xl font-extrabold text-[#6a9739]">
                    {dealOfDay.metadata.discountPercent}% OFF
                  </div>
                )}
                <div className="pt-2">
                  <Link
                    to={dealOfDay.linkUrl || '/shop'}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#6a9739] hover:bg-[#58802d] text-white font-semibold rounded-md transition-all duration-150 cursor-pointer text-sm"
                  >
                    Shop This Deal <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Customer Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-[#f8f6f3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs uppercase font-bold tracking-widest text-[#6a9739]">
                Happy Customers
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 mt-1">
                What Our Customers Say
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Certified Brands / Partner Logos */}
      {brands.length > 0 && (
        <section className="py-12 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <span className="text-xs uppercase font-bold tracking-widest text-gray-400">
                Certified & Trusted By
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 lg:gap-10">
              {brands.map((brand) => (
                <a
                  key={brand.id}
                  href={brand.websiteUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2 p-3.5 rounded-xl bg-[#fbfbfb] hover:bg-white border border-gray-100 hover:border-[#6a9739]/40 hover:shadow-sm transition-all duration-200"
                  title={brand.name}
                >
                  <div className="h-12 w-28 sm:w-32 flex items-center justify-center">
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className="max-h-10 max-w-full object-contain filter group-hover:scale-105 transition-all duration-200"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/brands/certified-organic.svg';
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-500 group-hover:text-[#6a9739] font-medium transition-colors">
                    {brand.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Floating Cart Error Toast */}
      {cartError && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-red-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{cartError}</span>
          </div>
          <button
            type="button"
            onClick={() => setCartError(null)}
            className="p-1 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
