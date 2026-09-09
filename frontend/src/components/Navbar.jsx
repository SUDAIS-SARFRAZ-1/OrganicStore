import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, User, Menu, X, Leaf, ChevronDown, ChevronRight, LogOut, LayoutDashboard } from 'lucide-react';
import { getCategories } from '../services/categoryApi';
import { useAuthStore } from '../store/authStore';
import { useCartDrawerStore } from '../store/cartDrawerStore';
import MiniCartDrawer from './MiniCartDrawer';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openDrawer } = useCartDrawerStore();

  // Dynamic category navigation driven by DB categories via React Query (Rule 9)
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10,
  });

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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-full bg-[#6a9739]/10 flex items-center justify-center text-[#6a9739] group-hover:bg-[#6a9739] group-hover:text-white transition-colors duration-200">
                <Leaf className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight text-gray-900 leading-none">
                  Organic<span className="text-[#6a9739]">.</span>
                </span>
                <span className="text-[10px] tracking-widest text-gray-500 uppercase font-medium">
                  Store
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (Dynamic Categories driven by Database) */}
            <nav className="hidden xl:flex items-center gap-6 2xl:gap-8 text-sm">
              <NavLink to="/shop" className={activeLinkClass}>
                Everything
              </NavLink>

              {isLoading ? (
                <div className="flex gap-4 animate-pulse">
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              ) : (
                categories.slice(0, 5).map((category) => (
                  <NavLink
                    key={category.id}
                    to={`/category/${category.slug}`}
                    className={activeLinkClass}
                  >
                    {category.name}
                  </NavLink>
                ))
              )}

              <NavLink to="/about" className={activeLinkClass}>
                About
              </NavLink>
              <NavLink to="/contact" className={activeLinkClass}>
                Contact
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
                  <span className="absolute -top-1.5 -right-2 bg-[#6a9739] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                    0
                  </span>
                </div>
                <span className="hidden sm:inline-block font-semibold text-sm">
                  ₨ 0.00
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
                  <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-100 py-1.5 hidden group-hover:block transition-all">
                    <Link
                      to="/account/profile"
                      className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#6a9739]"
                    >
                      My Account
                    </Link>
                    <Link
                      to="/account/orders"
                      className="block px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 hover:text-[#6a9739]"
                    >
                      Orders
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/admin/dashboard"
                        className="block px-4 py-2 text-xs text-[#6a9739] font-medium hover:bg-gray-50"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
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
                className="xl:hidden p-2 text-gray-700 hover:text-[#6a9739] cursor-pointer rounded-lg hover:bg-gray-50 transition-colors"
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
        <div className="fixed inset-0 z-50 xl:hidden overflow-hidden">
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
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-[#6a9739]/10 flex items-center justify-center text-[#6a9739]">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    Organic<span className="text-[#6a9739]">.</span>
                  </span>
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

                  {categories.map((category) => (
                    <NavLink
                      key={category.id}
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
                      <span className="text-xs text-gray-400">
                        {category.productCount}
                      </span>
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
                      to="/account/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-1.5 text-xs text-gray-700 hover:text-[#6a9739]"
                    >
                      My Orders
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
