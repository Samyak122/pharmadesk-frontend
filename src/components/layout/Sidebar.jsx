import { LayoutDashboard, Receipt, Package, Boxes, ShoppingCart, Building2, Users, BarChart3, Settings, UserCircle2, LogOut, Circle } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resolvePharmacyLogo } from '../../utils/logoUtils';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/billing', label: 'Billing', icon: Receipt },
  { to: '/medicines', label: 'Medicine Catalog', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/purchases', label: 'Purchases', icon: ShoppingCart },
  { to: '/suppliers', label: 'Suppliers', icon: Building2 },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { user, isDemoMode, logout } = useAuth();

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-200 bg-white/80 px-6 py-6 shadow-sm backdrop-blur">
      <div>
        <div className="mb-8 flex items-center gap-3">
          <img src={resolvePharmacyLogo()} alt="GenPharma logo" className="h-11 w-11 rounded-2xl object-cover" />
          <div>
            <p className="text-lg font-semibold text-slate-900">GenPharma</p>
            <p className="text-sm text-slate-500">GenPharma Pharmacy Management</p>
          </div>
        </div>

        <nav className="space-y-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <UserCircle2 size={18} className="text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{user?.username || 'User'}</p>
              <p className={`text-xs font-semibold ${isDemoMode ? 'text-emerald-600' : 'text-slate-500'}`}>{isDemoMode ? 'Demo Mode' : (user?.role || 'Role')}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Circle size={8} fill="currentColor" className="text-emerald-500" />
              {isDemoMode ? 'Demo Status' : 'Backend Status'}
            </div>
            <span className="font-semibold text-emerald-600">{isDemoMode ? 'Local' : 'Online'}</span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={18} />
          Logout
        </button>
        <div className="border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p>Version 1.0.0</p>
          <p className="mt-1">{isDemoMode ? 'Demo • In memory only' : 'Backend • Connected'}</p>
        </div>
      </div>
    </aside>
  );
}
