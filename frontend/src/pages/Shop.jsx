import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../services/productApi';
import { getCategories } from '../services/categoryApi';
import ProductGrid from '../components/ProductGrid';
import ProductFilters from '../components/ProductFilters';
import SortDropdown from '../components/SortDropdown';
import SearchBar from '../components/SearchBar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();

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
            <div className="bg-white rounded-xl px-5 py-3 border border-gray-100 shadow-xs flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                {categoryParam !== 'all' ? (
                  <>Category: <span className="font-bold text-[#6a9739] capitalize">{categoryParam}</span></>
                ) : (
                  'All Categories'
                )}
              </span>

              <SortDropdown
                value={sortParam}
                onChange={(sortValue) => updateQuery({ sort: sortValue })}
              />
            </div>

            {/* Product Grid */}
            <ProductGrid
              products={products}
              isLoading={isLoading}
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
