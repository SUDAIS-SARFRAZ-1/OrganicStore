import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategoryBySlug, DEFAULT_CATEGORIES } from '../services/categoryApi';
import { getProducts } from '../services/productApi';
import { addToCart } from '../services/cartApi';
import { useCartDrawerStore } from '../store/cartDrawerStore';
import ProductGrid from '../components/ProductGrid';
import { ChevronRight } from 'lucide-react';

export default function Category() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const { openDrawer } = useCartDrawerStore();

  const addMutation = useMutation({
    mutationFn: addToCart,
    onSuccess: (updatedCart) => {
      queryClient.setQueryData(['cart'], updatedCart);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      openDrawer();
    },
  });

  const handleAddToCart = (product) => {
    addMutation.mutate({ productId: product.id, quantity: 1 });
  };

  // Fetch category info with instant fallback
  const { data: category, isLoading: isCategoryLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => getCategoryBySlug(slug),
    placeholderData: () => DEFAULT_CATEGORIES.find((c) => c.slug === slug) || null,
  });

  // Fetch products for this category
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', { category: slug }],
    queryFn: () => getProducts({ category: slug, limit: 20 }),
  });

  const products = productsData?.products || [];

  if (isCategoryLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#6a9739] border-t-transparent"></div>
        <p className="mt-3 text-gray-500">Loading category...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Category Not Found</h2>
        <p className="mt-2 text-gray-600">The requested category could not be located.</p>
        <Link to="/shop" className="mt-4 inline-block text-[#6a9739] font-semibold hover:underline">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#f8f6f3] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link to="/" className="hover:text-[#6a9739]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/shop" className="hover:text-[#6a9739]">Shop</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-gray-800">{category.name}</span>
        </nav>

        {/* Category Header Banner */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-xs mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h1 className="text-3xl font-extrabold text-gray-900">{category.name}</h1>
            <p className="text-sm text-gray-600">{category.description || 'Explore our handpicked organic selection.'}</p>
            <span className="inline-block text-xs font-semibold px-2.5 py-1 bg-[#6a9739]/10 text-[#6a9739] rounded-md">
              {products.length} {products.length === 1 ? 'Product Available' : 'Products Available'}
            </span>
          </div>

          {category.image && (
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#6a9739]/30 shadow-xs">
              <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Products Grid */}
        <ProductGrid
          products={products}
          isLoading={isProductsLoading}
          onAddToCart={handleAddToCart}
        />
      </div>
    </div>
  );
}
