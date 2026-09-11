import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  ShoppingCart, 
  Users, 
  Tag, 
  Star, 
  Sliders, 
  ExternalLink, 
  LogOut, 
  Menu, 
  X, 
  Leaf, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { label: 'Customers', path: '/admin/customers', icon: Users },
    { label: 'Coupons', path: '/admin/coupons', icon: Tag },
    { label: 'Reviews', path: '/admin/reviews', icon: Star },
    { label: 'Marketing Content', path: '/admin/content', icon: Sliders },
  ];

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex">
      {/* Mobile Sidebar Backdrop */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity duration-300 ease-in-out ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 w-64 bg-[#1e293b] text-slate-300 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } h-screen shadow-xl`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800 bg-[#0f172a]/50">
            <Link to="/admin/dashboard" className="flex items-center gap-3 group">
              <img
                src="/image.png"
                alt="Organic Store"
                className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#8bc34a] bg-[#8bc34a]/10 px-2 py-0.5 rounded-full border border-[#8bc34a]/20">
                Admin
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-3 tracking-widest block mb-2">
              Store Management
            </span>

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#6a9739] text-white shadow-sm shadow-[#6a9739]/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </NavLink>
              );
            })}

            <div className="pt-4 mt-4 border-t border-slate-800">
              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-4 h-4 text-[#8bc34a]" />
                  <span>View Live Store</span>
                </div>
              </Link>
            </div>
          </nav>
        </div>

        {/* User Account & Logout Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0f172a]/70">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#6a9739] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-[#8bc34a] font-semibold block uppercase tracking-wider">
                  Admin Role
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <span className="hidden sm:inline">Organic Store Operations</span>
              <span className="hidden sm:inline text-gray-300">/</span>
              <span className="font-bold text-gray-800">Admin Control</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#6a9739] bg-green-50 hover:bg-green-100 rounded-lg border border-green-200/70 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#6a9739]" />
              <span className="font-bold text-gray-700 hidden sm:inline">
                {user?.email}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
