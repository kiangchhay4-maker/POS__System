import { NavLink } from 'react-router-dom';
import { Coffee, ShoppingCart, Clock, Settings, Package, ShieldCheck, Users, Store } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';

export default function Sidebar() {
  const { user } = useAuthStore();

  const mainNavigation = [
    { name: 'Sell (POS)', path: '/pos', icon: ShoppingCart },
    { name: 'Orders History', path: '/orders', icon: Coffee },
    { name: 'Shift & Drawer', path: '/shift', icon: Clock },
  ];

  const adminNavigation = [
    { name: 'Manage Products', path: '/admin/products', icon: Package, badge: 'Admin' },
    { name: 'Staff & Cashiers', path: '/admin/staff', icon: Users, badge: 'Admin' },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-xs">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 bg-amber-50/40">
        <div className="w-9 h-9 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-sm">
          <Coffee className="w-5 h-5" />
        </div>
        <div className="ml-3">
          <span className="text-base font-extrabold text-gray-900 leading-none block">
            Coffee POS
          </span>
          <span className="text-[11px] font-semibold text-amber-700 tracking-wide">
            Enterprise Edition
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-5 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-6">
          {/* Main cashier operations */}
          <div>
            <span className="px-3 text-[11px] font-extrabold uppercase text-gray-400 tracking-wider block mb-2">
              Operations
            </span>
            <nav className="space-y-1">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-amber-50/60 hover:text-gray-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Admin and Management - visible only to ADMIN */}
          {user?.role === 'ADMIN' && (
            <div>
              <span className="px-3 text-[11px] font-extrabold uppercase text-gray-400 tracking-wider block mb-2">
                Management
              </span>
              <nav className="space-y-1">
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-amber-50/60 hover:text-gray-900'
                        }`
                      }
                    >
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User Card Bottom */}
        <div className="pt-4 border-t border-gray-200">
          <div className="p-3 bg-gray-50 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 text-amber-800 font-black rounded-xl flex items-center justify-center text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs text-gray-900 truncate">
                {user?.name || (user?.role === 'ADMIN' ? 'Administrator' : 'Staff Cashier')}
              </div>
              <div className="text-[10px] text-gray-500 flex items-center gap-1">
                {user?.role === 'ADMIN' ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                    <span className="font-bold text-purple-700">SUPER ADMIN</span>
                  </>
                ) : (
                  <>
                    <Store className="w-3 h-3 text-amber-600" />
                    <span className="font-semibold text-amber-800">STAFF CASHIER</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
