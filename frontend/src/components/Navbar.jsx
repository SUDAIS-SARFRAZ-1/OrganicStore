import { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Package,
  MapPin,
  Heart,
  Sparkles,
} from 'lucide-react';
import { getCategories, DEFAULT_CATEGORIES } from '../services/categoryApi';
import { getCart } from '../services/cartApi';
import { useAuthStore } from '../store/authStore';
import { useCartDrawerStore } from '../store/cartDrawerStore';
import MiniCartDrawer from './MiniCartDrawer';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const categoryMenuRef = useRef(null);
  const userMenuRef = useRef(null);

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

  // Close open dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target)) {
        setCategoryMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

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
                src="/image.png"
                alt="Organic Store"
                className="h-11 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
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

              {/* Categories Dropdown (Hover + Click/Touch) */}
              <div
                ref={categoryMenuRef}
                className="relative py-2"
                onMouseEnter={() => setCategoryMenuOpen(true)}
                onMouseLeave={() => setCategoryMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setCategoryMenuOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 transition-colors font-medium cursor-pointer ${
                    categoryMenuOpen ? 'text-[#6a9739]' : 'text-gray-700 hover:text-[#6a9739]'
                  }`}
                  aria-expanded={categoryMenuOpen}
                  aria-haspopup="true"
                >
                  <span>Categories</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      categoryMenuOpen ? 'rotate-180 text-[#6a9739]' : 'text-gray-400'
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {categoryMenuOpen && (
                  <div className="absolute top-full left-0 pt-2 w-72 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 space-y-1">
                      <Link
                        to="/shop"
                        onClick={() => setCategoryMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-[#6a9739] bg-[#6a9739]/10 hover:bg-[#6a9739]/20 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Explore All Products
                        </span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 pr-1">
                        {displayCategories.map((category) => (
                          <Link
                            key={category.id || category.slug}
                            to={`/category/${category.slug}`}
                            onClick={() => setCategoryMenuOpen(false)}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-gray-700 hover:text-[#6a9739] hover:bg-gray-50 transition-colors group/item"
                          >
                            <span className="font-semibold group-hover/item:translate-x-0.5 transition-transform">
                              {category.name}
                            </span>
                            {category.productCount !== undefined && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 group-hover/item:bg-[#6a9739]/15 group-hover/item:text-[#6a9739] text-gray-500 font-bold transition-colors">
                                {category.productCount}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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
                className="flex items-center gap-2.5 text-gray-700 hover:text-[#6a9739] transition-colors group cursor-pointer btn-tactile"
              >
                <div className="relative">
                  <ShoppingBag className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                  {cart?.totalItems > 0 && (
                    <span
                      key={cart.totalItems}
                      className="absolute -top-1.5 -right-2 bg-[#6a9739] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-badge-pop"
                    >
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
                <div
                  ref={userMenuRef}
                  className="relative hidden sm:block"
                  onMouseEnter={() => setUserMenuOpen(true)}
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 text-gray-700 hover:text-[#6a9739] py-1.5 px-2.5 rounded-xl hover:bg-gray-50 transition-all text-xs font-bold cursor-pointer border border-transparent hover:border-gray-200"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#6a9739]/10 text-[#6a9739] flex items-center justify-center font-black">
                      {user?.name ? user.name[0].toUpperCase() : <User className="w-3.5 h-3.5" />}
                    </div>
                    <span className="hidden md:inline-block max-w-[90px] truncate text-gray-800">
                      {user?.name}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        userMenuOpen ? 'rotate-180 text-[#6a9739]' : 'text-gray-400'
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu Card */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full pt-2 w-60 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 space-y-1">
                        {/* User Header Info */}
                        <div className="px-3 py-2 border-b border-gray-100 mb-1">
                          <p className="font-bold text-xs text-gray-900 truncate">{user?.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                          {user?.role === 'ADMIN' && (
                            <span className="inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-[#6a9739]/15 text-[#6a9739]">
                              Administrator
                            </span>
                          )}
                        </div>

                        {user?.role === 'ADMIN' && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#6a9739] bg-[#6a9739]/10 hover:bg-[#6a9739]/20 transition-colors"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}

                        <Link
                          to="/account/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#6a9739] transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>Profile Settings</span>
                        </Link>
                        <Link
                          to="/account/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#6a9739] transition-colors"
                        >
                          <Package className="w-3.5 h-3.5 text-gray-400" />
                          <span>My Orders</span>
                        </Link>
                        <Link
                          to="/account/addresses"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#6a9739] transition-colors"
                        >
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>Saved Addresses</span>
                        </Link>
                        <Link
                          to="/account/wishlist"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#6a9739] transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5 text-gray-400" />
                          <span>Wishlist</span>
                        </Link>

                        <div className="pt-1 border-t border-gray-100 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#6a9739] hover:bg-[#6a9739]/10 border border-[#6a9739]/30 transition-all cursor-pointer shadow-2xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
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
      <div
        className={`fixed inset-0 z-50 lg:hidden overflow-hidden transition-all duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop Scrim */}
        <div
          onClick={() => setMobileMenuOpen(false)}
          className={`fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out cursor-pointer ${
            mobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />

        {/* Drawer Sidebar */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
          <aside
            className={`w-screen max-w-xs bg-white shadow-2xl flex flex-col pointer-events-auto transform transition-transform duration-300 ease-in-out ${
              mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center group"
              >
                <img src="/image.png" alt="Organic Store" className="h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105" />
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

      {/* Slide-out Mini Cart Drawer */}
      <MiniCartDrawer />
    </>
  );
}
