import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Leaf, Mail, MapPin, Phone } from 'lucide-react';
import { getCategories, DEFAULT_CATEGORIES } from '../services/categoryApi';

export default function Footer() {
  const { data: categories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    placeholderData: DEFAULT_CATEGORIES,
    staleTime: 5 * 60 * 1000,
  });

  const displayCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const quickLinks = [
    { label: 'Shop', to: '/shop' },
    { label: 'About Us', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  const policyLinks = [
    { label: 'Shipping Policy', to: '/about' },
    { label: 'Return & Refund', to: '/about' },
    { label: 'Privacy Policy', to: '/about' },
    { label: 'Terms & Conditions', to: '/about' },
  ];

  return (
    <footer className="bg-[#111827] text-gray-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#6a9739]/20">
                <Leaf className="w-5 h-5 text-[#6a9739]" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Organic Store
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
              Your trusted destination for 100% certified organic groceries, fresh produce, and cold-pressed juices delivered straight from local farms.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#6a9739] font-semibold">
              <Leaf className="w-3.5 h-3.5" />
              Certified Organic &bull; Farm Fresh
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-[#6a9739] transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {displayCategories.slice(0, 4).map((cat) => (
                <li key={cat.id || cat.slug}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="text-sm text-gray-400 hover:text-[#6a9739] transition-colors duration-150"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Customer Service
            </h4>
            <ul className="space-y-2.5">
              {policyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 hover:text-[#6a9739] transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Get In Touch
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-sm text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#6a9739]" />
                <span>123 Green Street, Lahore, Pakistan</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-gray-400">
                <Phone className="w-4 h-4 shrink-0 text-[#6a9739]" />
                <span>+92 300 1234567</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-gray-400">
                <Mail className="w-4 h-4 shrink-0 text-[#6a9739]" />
                <span>support@organicstore.com</span>
              </div>
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Subscribe for deals & updates</p>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex"
              >
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-grow min-w-0 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#6a9739] transition-colors"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#6a9739] hover:bg-[#58802d] text-white text-sm font-semibold rounded-r-md transition-colors duration-150 whitespace-nowrap cursor-pointer"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Organic Store. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">Secure Payments</span>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">VISA</span>
              <span className="px-2 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">MC</span>
              <span className="px-2 py-0.5 bg-gray-800 rounded text-gray-400 font-mono">COD</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
