import { ArrowDownUp, ChevronDown } from 'lucide-react';

/**
 * Universal Responsive Sort Dropdown Component
 * Features custom styling, cross-browser consistency (appearance-none),
 * and clean mobile responsiveness.
 */
export default function SortDropdown({
  value = 'latest',
  onChange,
  className = '',
  id = 'sort-dropdown',
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label
        htmlFor={id}
        className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 shrink-0"
      >
        <ArrowDownUp className="w-3.5 h-3.5 text-[#6a9739]" />
        <span>Sort by:</span>
      </label>

      <div className="relative w-full sm:w-auto min-w-[170px]">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white hover:bg-gray-50/80 border border-gray-200 hover:border-gray-300 rounded-xl pl-3.5 pr-9 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#6a9739] focus:ring-2 focus:ring-[#6a9739]/20 transition-all cursor-pointer shadow-2xs"
        >
          <option value="latest">Latest Arrivals</option>
          <option value="popularity">Most Popular</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
