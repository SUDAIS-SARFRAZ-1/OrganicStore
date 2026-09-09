import { ArrowDownUp } from 'lucide-react';

export default function SortDropdown({ value = 'latest', onChange }) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-dropdown" className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <ArrowDownUp className="w-3.5 h-3.5" /> Sort:
      </label>
      <select
        id="sort-dropdown"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 hover:border-gray-300 focus:outline-none focus:border-[#6a9739] focus:ring-2 focus:ring-[#6a9739]/20 transition-all cursor-pointer shadow-2xs"
      >
        <option value="latest">Sort by latest</option>
        <option value="popularity">Sort by popularity</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </select>
    </div>
  );
}
