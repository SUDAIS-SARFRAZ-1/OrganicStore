import { Link } from 'react-router-dom';

export default function Footer() {
  const links = [
    { label: 'Shop', to: '/shop' },
    { label: 'About Us', to: '/about' },
    { label: 'Contact Us', to: '/contact' },
    { label: 'Privacy Policy', to: '/about' },
    { label: 'Terms', to: '/about' },
  ];

  return (
    <footer className="bg-[#111827] text-gray-400 border-t border-gray-800 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand & Tagline */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <Link to="/" className="inline-flex items-center">
              <img
                src="/logo-white.svg"
                alt="Organic Store"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <span className="hidden sm:inline text-gray-600">|</span>
            <p className="text-xs text-gray-400">
              100% Certified Organic Groceries &amp; Farm Fresh Produce
            </p>
          </div>

          {/* Essential Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-gray-300">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="hover:text-[#8bc34a] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Line */}
        <div className="mt-6 pt-6 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
          <p className="text-center sm:text-left">
            &copy; {new Date().getFullYear()} Organic Store. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-medium">Payment:</span>
            <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono text-[10px]">COD</span>
            <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono text-[10px]">VISA</span>
            <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono text-[10px]">MasterCard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
