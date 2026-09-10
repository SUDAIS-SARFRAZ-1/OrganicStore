import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, User, Menu, X, ChevronDown, ChevronRight, LogOut, LayoutDashboard } from 'lucide-react';
import { getCategories, DEFAULT_CATEGORIES } from '../services/categoryApi';
import { getCart } from '../services/cartApi';
import { useAuthStore } from '../store/authStore';
import { useCartDrawerStore } from '../store/cartDrawerStore';
import MiniCartDrawer from './MiniCartDrawer';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openDrawer } = useCartDrawerStore();

  // Live cart data via React Query (Rule 9)
  const { data: cart = { totalItems: 0, subtotal: 0 } } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    staleTime: 1000 * 30,
  });

  // Dynamic category navigation driven by DB categories via React Query (Rule 9)
  // Uses DEFAULT_CATEGORIES placeholder/fallback so links never disappear if backend is offline or restarting
  const { data: categories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    placeholderData: DEFAULT_CATEGORIES,
    staleTime: 1000 * 60 * 10,
  });

  const displayCategories = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  // Lock body scroll when mobile drawer is open to prevent background scrolling
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const activeLinkClass = ({ isActive }) =>
    isActive
      ? 'text-[#6a9739] font-semibold transition-colors duration-150'
      : 'text-gray-700 hover:text-[#6a9739] transition-colors duration-150 font-medium';

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-xs print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img
                src="/logo.svg"
                alt="Organic Store"
                className="h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7 text-sm font-medium">
              <NavLink to="/" className={activeLinkClass}>
                Home
              </NavLink>

              <NavLink to="/shop" className={activeLinkClass}>
                Shop
              </NavLink>

              {/* Categories Dropdown on Hover */}
              <div className="relative group py-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-gray-700 group-hover:text-[#6a9739] transition-colors font-medium cursor-pointer"
                >
                  <span>Categories</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[#6a9739] group-hover:rotate-180 transition-transform duration-200" />
                </button>

                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform translate-y-2 group-hover:translate-y-0">
                  <div className="max-h-80 overflow-y-auto space-y-1">
                    <Link
                      to="/shop"
                      className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold text-[#6a9739] bg-[#6a9739]/10 hover:bg-[#6a9739]/20 transition-colors"
                    >
                      <span>Explore All Products</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    {displayCategories.map((category) => (
                      <Link
                        key={category.id || category.slug}
                        to={`/category/${category.slug}`}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:text-[#6a9739] hover:bg-[#f8f6f3] transition-colors"
                      >
                        <span className="font-medium">{category.name}</span>
                        {category.productCount !== undefined && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">
                            {category.productCount}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <NavLink to="/about" className={activeLinkClass}>
                About Us
              </NavLink>

              <NavLink to="/contact" className={activeLinkClass}>
                Contact Us
              </NavLink>
            </nav>

            {/* Right Action Icons (Cart Trigger, Account, Admin) */}
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Admin Badge/Link if user is Admin */}
              {isAuthenticated && user?.role === 'ADMIN' && (
                <Link
                  to="/admin/dashboard"
                  className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#6a9739]/10 text-[#6a9739] hover:bg-[#6a9739]/20 transition-colors"
                >
                  Admin Panel
                </Link>
              )}

              {/* Cart Trigger (Slide-out mini cart trigger) */}
              <button
                onClick={openDrawer}
                aria-label="Open Cart"
                className="flex items-center gap-2.5 text-gray-700 hover:text-[#6a9739] transition-colors group cursor-pointer"
              >
                <div className="relative">
                  <ShoppingBag className="w-6 h-6" />
                  {cart?.totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#6a9739] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                      {cart.totalItems}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline-block font-semibold text-sm">
                  ₨ {(cart?.subtotal || 0).toFixed(2)}
                </span>
              </button>

              {/* User Account / Auth Dropdown (Desktop) */}
              {isAuthenticated ? (
                <div className="relative group hidden sm:block">
                  <button className="flex items-center gap-1.5 text-gray-700 hover:text-[#6a9739] py-2 text-sm font-medium cursor-pointer">
                    <User className="w-5 h-5" />
                    <span className="hidden md:inline-block max-w-[100px] truncate">
                      {user?.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 hidden group-hover:block transition-all">
                    <Link
                      to="/account/profile"
                      className="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#6a9739]"
                    >
                      Profile Settings
                    </Link>
                    <Link
                      to="/account/orders"
                      className="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#6a9739]"
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/account/addresses"
                      className="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#6a9739]"
                    >
                      Saved Addresses
                    </Link>
                    <Link
                      to="/account/wishlist"
                      className="block px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#6a9739]"
                    >
                      Wishlist
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin/dashboard"
                        className="block px-4 py-2 text-xs text-[#6a9739] font-bold hover:bg-gray-50 border-t border-gray-100 mt-1 pt-2"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer border-t border-gray-100 mt-1 pt-2"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-[#6a9739] transition-colors"
                >
                  <User className="w-5 h-5" />
                  <span>Login</span>
                </Link>
              )}

              {/* Mobile / Tablet Menu Toggle Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-gray-700 hover:text-[#6a9739] cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Open Navigation Menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Slide-out Navigation Drawer for Mobile & Tablet screens */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden overflow-hidden">
          {/* Backdrop Scrim */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200 cursor-pointer"
            aria-hidden="true"
          />

          {/* Drawer Sidebar */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <aside className="w-screen max-w-xs bg-white shadow-2xl flex flex-col transform transition-transform duration-200 ease-out">
              {/* Drawer Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center"
                >
                  <img src="/logo.svg" alt="Organic Store" className="h-9 w-auto object-contain" />
                </Link>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close mobile menu"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Nav Links */}
              <div className="flex-1 overflow-y-auto p-5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block px-3 mb-2">
                  Navigation
                </span>

                <NavLink
                  to="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#6a9739]/10 text-[#6a9739]'
                        : 'text-gray-800 hover:bg-gray-50'
                    }`
                  }
                >
                  <span>Everything / Shop</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </NavLink>

                <div className="pt-2 pb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block px-3 mb-2">
                    Categories
                  </span>

                  {displayCategories.map((category) => (
                    <NavLink
                      key={category.id || category.slug}
                      to={`/category/${category.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#6a9739]/10 text-[#6a9739] font-bold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`
                      }
                    >
                      <span>{category.name}</span>
                      {category.productCount !== undefined && category.productCount > 0 && (
                        <span className="text-xs text-gray-400">
                          {category.productCount}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block px-3 mb-2">
                    Company
                  </span>

                  <NavLink
                    to="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#6a9739]/10 text-[#6a9739] font-bold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span>About Us</span>
                  </NavLink>

                  <NavLink
                    to="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[#6a9739]/10 text-[#6a9739] font-bold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <span>Contact</span>
                  </NavLink>
                </div>
              </div>

              {/* Drawer User Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
                {isAuthenticated ? (
                  <>
                    <div className="px-3 py-1 text-xs text-gray-500">
                      Signed in as <span className="font-bold text-gray-800">{user?.name}</span>
                    </div>

                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#6a9739] hover:bg-[#6a9739]/10 rounded-lg transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/account/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-1.5 text-xs text-gray-700 hover:text-[#6a9739] font-medium"
                    >
                      Profile Settings
                    </Link>
                    <Link
                      to="/account/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-1.5 text-xs text-gray-700 hover:text-[#6a9739] font-medium"
                    >
                      My Orders
                    </Link>
                    <Link
                      to="/account/addresses"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-1.5 text-xs text-gray-700 hover:text-[#6a9739] font-medium"
                    >
                      Saved Addresses
                    </Link>
                    <Link
                      to="/account/wishlist"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-1.5 text-xs text-gray-700 hover:text-[#6a9739] font-medium"
                    >
                      Wishlist
                    </Link>

                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#6a9739] hover:bg-[#58802d] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    Login / Register
                  </Link>
                )}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Slide-out Mini Cart Drawer */}
      <MiniCartDrawer />
    </>
  );
}
