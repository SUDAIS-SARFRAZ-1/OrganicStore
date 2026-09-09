import { Filter } from 'lucide-react';

export default function ProductFilters({
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  priceRange = { min: '', max: '' },
  onChangePriceRange,
  onResetFilters,
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
          <Filter className="w-4 h-4 text-[#6a9739]" />
          <span>Filters</span>
        </div>
        {(selectedCategory !== 'all' || priceRange.min || priceRange.max) && (
          <button
            onClick={onResetFilters}
            className="text-xs text-[#6a9739] hover:underline font-medium cursor-pointer"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Categories Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
          Categories
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => onSelectCategory('all')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex justify-between items-center ${
              selectedCategory === 'all'
                ? 'bg-[#6a9739]/10 text-[#6a9739] font-bold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>All Categories</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex justify-between items-center ${
                selectedCategory === cat.slug
                  ? 'bg-[#6a9739]/10 text-[#6a9739] font-bold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{cat.name}</span>
              <span className="text-[11px] text-gray-400 font-normal">
                ({cat.productCount})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="pt-2 border-t border-gray-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
          Filter by Price (₨)
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Min Price</label>
            <input
              type="number"
              placeholder="0"
              value={priceRange.min}
              onChange={(e) =>
                onChangePriceRange({ ...priceRange, min: e.target.value })
              }
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-[#6a9739]"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">Max Price</label>
            <input
              type="number"
              placeholder="50"
              value={priceRange.max}
              onChange={(e) =>
                onChangePriceRange({ ...priceRange, max: e.target.value })
              }
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-[#6a9739]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
