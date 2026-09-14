import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts } from '../services/productApi';
import { getCategories } from '../services/categoryApi';
import { addToCart } from '../services/cartApi';
import { useCartDrawerStore } from '../store/cartDrawerStore';
import ProductGrid from '../components/ProductGrid';
import ProductFilters from '../components/ProductFilters';
import SortDropdown from '../components/SortDropdown';
import SearchBar from '../components/SearchBar';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
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

  // URL state sync
  const categoryParam = searchParams.get('category') || 'all';
  const sortParam = searchParams.get('sort') || 'latest';
  const pageParam = parseInt(searchParams.get('page'), 10) || 1;
  const searchParam = searchParams.get('search') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';

  const [priceRange, setPriceRange] = useState({ min: minPriceParam, max: maxPriceParam });

  // Update query params helper
  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '' || (key === 'category' && val === 'all')) {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    });
    // Reset to page 1 on filter/sort changes
    if (!updates.page) {
      next.delete('page');
    }
    setSearchParams(next);
  };

  // Fetch categories for sidebar filter
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10,
  });

  // Fetch products via React Query (Rule 9)
  const { data, isLoading } = useQuery({
    queryKey: [
      'products',
      {
        category: categoryParam,
        sort: sortParam,
        page: pageParam,
        search: searchParam,
        minPrice: minPriceParam,
        maxPrice: maxPriceParam,
      },
    ],
    queryFn: () =>
      getProducts({
        category: categoryParam,
        sort: sortParam,
        page: pageParam,
        limit: 12,
        search: searchParam,
        minPrice: minPriceParam,
        maxPrice: maxPriceParam,
      }),
    keepPreviousData: true,
  });

  const products = data?.products || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 };

  return (
    <div className="bg-[#f8f6f3] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Title & Subtitle */}
        <div className="border-b border-gray-200 pb-5 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Shop All Products</h1>
            <p className="text-sm text-gray-500 mt-1">
              Showing {products.length > 0 ? `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)}` : 0} of {pagination.total} results
            </p>
          </div>

          <div className="w-full md:w-72">
            <SearchBar
              value={searchParam}
              onChange={(term) => updateQuery({ search: term })}
            />
          </div>
        </div>

        {/* Main Grid Layout with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-6">
            <ProductFilters
              categories={categories}
              selectedCategory={categoryParam}
              onSelectCategory={(slug) => updateQuery({ category: slug })}
              priceRange={priceRange}
              onChangePriceRange={(newRange) => {
                setPriceRange(newRange);
                updateQuery({ minPrice: newRange.min, maxPrice: newRange.max });
              }}
              onResetFilters={() => {
                setPriceRange({ min: '', max: '' });
                setSearchParams(new URLSearchParams());
              }}
            />
          </aside>

          {/* Catalog Listing Area */}
          <main className="lg:col-span-3 space-y-6">
            {/* Sorting & Filter Summary Bar */}
            <div className="bg-white rounded-2xl px-5 py-3.5 border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-56 shrink-0">
                  <select
                    value={categoryParam}
                    onChange={(e) => updateQuery({ category: e.target.value })}
                    className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs font-semibold bg-gray-50 hover:bg-gray-100/70 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] focus:ring-2 focus:ring-[#6a9739]/20 text-gray-700 cursor-pointer transition-all shadow-2xs"
                  >
                    <option value="all">All Categories ({categories.reduce((s, c) => s + (c.productCount || 0), 0)})</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name} ({c.productCount || 0})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                </div>
              </div>

              <SortDropdown
                value={sortParam}
                onChange={(sortValue) => updateQuery({ sort: sortValue })}
              />
            </div>

            {/* Product Grid */}
            <ProductGrid
              products={products}
              isLoading={isLoading}
              onAddToCart={handleAddToCart}
            />

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="pt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => updateQuery({ page: pagination.page - 1 })}
                  disabled={!pagination.hasPrevPage}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {[...Array(pagination.totalPages)].map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => updateQuery({ page: pNum })}
                      className={`w-9 h-9 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        pagination.page === pNum
                          ? 'bg-[#6a9739] text-white shadow-xs'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => updateQuery({ page: pagination.page + 1 })}
                  disabled={!pagination.hasNextPage}
                  className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
