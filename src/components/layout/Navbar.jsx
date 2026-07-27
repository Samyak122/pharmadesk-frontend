import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, Search, BellRing } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listInventory } from '../../services/pharmaService';
import { resolvePharmacyLogo } from '../../utils/logoUtils';

function titleFromPath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (!parts.length) return 'Dashboard';
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
}

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const breadcrumb = titleFromPath(location.pathname);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [expiryAlerts, setExpiryAlerts] = useState([]);

  useEffect(() => {
    let active = true;
    const loadAlerts = async () => {
      try {
        const [stockData, expiryData, expiredData] = await Promise.all([
          listInventory({ lowStock: true, lowStockThreshold: 5 }),
          listInventory({ expiringSoon: 30 }),
          listInventory({ expired: true }),
        ]);
        if (!active) return;
        const stockItems = (stockData || []).slice(0, 4);
        const expiryItems = [...(expiredData || []), ...(expiryData || [])].slice(0, 4);
        setStockAlerts(stockItems);
        setExpiryAlerts(expiryItems);
      } catch {
        setStockAlerts([]);
        setExpiryAlerts([]);
      }
    };

    loadAlerts();
    return () => {
      active = false;
    };
  }, []);

  const alertCount = useMemo(() => stockAlerts.length + expiryAlerts.length, [stockAlerts, expiryAlerts]);

  return (
    <header className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-white/80 px-6 py-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <img src={resolvePharmacyLogo()} alt="PharmaDesk logo" className="h-10 w-10 rounded-2xl object-cover" />
        <div>
          <p className="text-sm font-medium text-slate-500">Overview</p>
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span>{breadcrumb}</span>
            <ChevronRight size={16} className="text-slate-400" />
            <span className="text-slate-500">Operations</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          <Search size={16} />
          <input className="bg-transparent outline-none" placeholder="Search" />
        </label>
        <div className="relative">
          <button type="button" onClick={() => setAlertsOpen((prev) => !prev)} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <BellRing size={16} />
            Alerts
            {alertCount ? <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs text-white">{alertCount}</span> : null}
          </button>
          {alertsOpen ? (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-[24px] border border-slate-200 bg-white p-3 shadow-xl">
              <div className="rounded-2xl border border-slate-100 p-3">
                <button type="button" onClick={() => { setAlertsOpen(false); navigate('/inventory/stock-alerts'); }} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-900">
                  <span className="flex items-center gap-2"><AlertTriangle size={14} /> Stock Alerts</span>
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">{stockAlerts.length}</span>
                </button>
                {stockAlerts.length ? stockAlerts.map((item, index) => (
                  <div key={`${item.stock_id}-${index}`} className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                    <p className="font-medium text-slate-900">{item.medicine?.medicine_name || 'Unknown'}</p>
                    <p>Remaining stock {item.quantity}</p>
                  </div>
                )) : <p className="mt-2 text-sm text-slate-500">No Alerts</p>}
              </div>
              <div className="mt-3 rounded-2xl border border-slate-100 p-3">
                <button type="button" onClick={() => { setAlertsOpen(false); navigate('/inventory/expiry-alerts'); }} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-900">
                  <span className="flex items-center gap-2"><AlertTriangle size={14} /> Expiry Alerts</span>
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white">{expiryAlerts.length}</span>
                </button>
                {expiryAlerts.length ? expiryAlerts.map((item, index) => (
                  <div key={`${item.stock_id}-${index}`} className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-600">
                    <p className="font-medium text-slate-900">{item.medicine?.medicine_name || 'Unknown'}</p>
                    <p>{item.isExpired ? 'Expired' : `Expires in ${item.daysToExpiry ?? 0} days`}</p>
                  </div>
                )) : <p className="mt-2 text-sm text-slate-500">No Alerts</p>}
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{user?.username || 'User'}</p>
            <p className="text-xs text-slate-500">{user?.role || 'Role'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
