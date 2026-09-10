import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, Package, MapPin, Heart, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function AccountLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Profile Settings', path: '/account/profile', icon: User },
    { label: 'My Orders', path: '/account/orders', icon: Package },
    { label: 'Saved Addresses', path: '/account/addresses', icon: MapPin },
    { label: 'Wishlist', path: '/account/wishlist', icon: Heart },
  ];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-[#f8f6f3] min-h-screen py-10 print:bg-white print:py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:px-0 print:max-w-none">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:block">
          {/* Left Sidebar (4 Cols) */}
          <aside className="lg:col-span-4 space-y-6 print:hidden">
            {/* User Profile Card */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-gray-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#6a9739] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {getInitials(user?.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-extrabold text-base text-gray-900 truncate">
                    {user?.name || 'Customer'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#6a9739]/10 text-[#6a9739] text-[10px] font-bold">
                    {user?.role || 'CUSTOMER'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-5 py-3.5 text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-[#6a9739]/10 text-[#6a9739] border-l-4 border-[#6a9739]'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-[#6a9739]'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </NavLink>
                );
              })}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-5 py-3.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </div>
              </button>
            </nav>

            {/* Security Assurance Card */}
            <div className="bg-green-50/60 rounded-2xl p-5 border border-green-200/70 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#6a9739] shrink-0 mt-0.5" />
              <div className="text-xs text-green-900 leading-relaxed">
                <span className="font-bold block mb-0.5">Customer Privacy First</span>
                Your personal details, saved addresses, and payment data are protected and never shared with third parties.
              </div>
            </div>
          </aside>

          {/* Right Main Content Panel (8 Cols) */}
          <main className="lg:col-span-8 print:w-full print:block">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
