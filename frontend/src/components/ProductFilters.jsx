import { Filter, ChevronDown, SlidersHorizontal, RotateCcw, Check, Sparkles } from 'lucide-react';

export default function ProductFilters({
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  priceRange = { min: '', max: '' },
  onChangePriceRange,
  onResetFilters,
}) {
  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
  const hasActiveFilters = selectedCategory !== 'all' || priceRange.min !== '' || priceRange.max !== '';

  const quickPriceRanges = [
    { label: 'Under ₨500', min: '0', max: '500' },
    { label: '₨500 – ₨1,500', min: '500', max: '1500' },
    { label: '₨1,500+', min: '1500', max: '' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-6">
      {/* Title & Reset Action */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-gray-900 font-black text-sm tracking-tight">
          <SlidersHorizontal className="w-4 h-4 text-[#6a9739]" />
          <span>Refine Products</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-xs text-[#6a9739] hover:text-[#58802d] font-semibold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Categories Dropdown Filter (Admin Style Consistency) */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
          Select Category
        </label>
        
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            className="w-full appearance-none pl-3.5 pr-10 py-2.5 text-xs font-semibold bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 rounded-xl focus:bg-white focus:outline-none focus:border-[#6a9739] focus:ring-2 focus:ring-[#6a9739]/20 text-gray-800 cursor-pointer transition-all shadow-2xs"
          >
            <option value="all">All Categories ({totalProducts})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name} ({c.productCount || 0})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>

        {/* Quick Click Category List */}
        <div className="space-y-1 pt-2">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex justify-between items-center ${
              selectedCategory === 'all'
                ? 'bg-[#6a9739]/10 text-[#6a9739] shadow-2xs font-bold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span>All Categories</span>
            {selectedCategory === 'all' ? (
              <Check className="w-3.5 h-3.5 text-[#6a9739]" />
            ) : (
              <span className="text-[10px] text-gray-400 font-normal">{totalProducts}</span>
            )}
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex justify-between items-center ${
                  isSelected
                    ? 'bg-[#6a9739]/10 text-[#6a9739] shadow-2xs font-bold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span>{cat.name}</span>
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-[#6a9739]" />
                ) : (
                  <span className="text-[10px] text-gray-400 font-normal">
                    {cat.productCount || 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="pt-4 border-t border-gray-100 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
          Price Range (₨)
        </h4>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-1.5">
          {quickPriceRanges.map((preset) => {
            const isMatch = priceRange.min === preset.min && priceRange.max === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChangePriceRange({ min: preset.min, max: preset.max })}
                className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all cursor-pointer border ${
                  isMatch
                    ? 'bg-[#6a9739] text-white border-[#6a9739]'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100/80 hover:text-gray-900'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Min / Max Inputs */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Min (₨)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-bold">
                ₨
              </span>
              <input
                type="number"
                placeholder="0"
                min="0"
                value={priceRange.min}
                onChange={(e) =>
                  onChangePriceRange({ ...priceRange, min: e.target.value })
                }
                className="w-full pl-6 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:border-[#6a9739] focus:ring-2 focus:ring-[#6a9739]/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Max (₨)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-bold">
                ₨
              </span>
              <input
                type="number"
                placeholder="5000"
                min="0"
                value={priceRange.max}
                onChange={(e) =>
                  onChangePriceRange({ ...priceRange, max: e.target.value })
                }
                className="w-full pl-6 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:border-[#6a9739] focus:ring-2 focus:ring-[#6a9739]/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
