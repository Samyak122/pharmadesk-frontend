import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Loader } from '../components/common/Loader';
import { useToast } from '../components/common/ToastProvider';
import { getSettings, updateSettings } from '../services/pharmaService';
import { resolvePharmacyLogo } from '../utils/logoUtils';

const initialFields = {
  pharmacy_name: '',
  owner_name: '',
  gstin: '',
  drug_license_number: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  pin_code: '',
  phone_number: '',
  email: '',
  website: '',
  logo_url: '',
  invoice_footer: '',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
};

export function SettingsPage() {
  const [form, setForm] = useState(initialFields);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSettings();
        setForm({ ...initialFields, ...(data || {}) });
      } catch (err) {
        showToast(err.response?.data?.message || 'Unable to load settings', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [showToast]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form };
      delete payload.logo_url;
      await updateSettings(payload);
      showToast('Settings saved', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader label="Loading settings" />;

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Pharmacy Settings</h2>
          <p className="text-sm text-slate-500">Manage the profile used across invoices, reports, and pharmacy branding.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="flex flex-wrap items-center gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <img src={resolvePharmacyLogo()} alt="PharmaDesk logo" className="h-14 w-14 rounded-2xl object-cover" />
          <div>
            <p className="font-semibold text-slate-900">Default pharmacy branding is active</p>
            <p>The built-in PharmaDesk logo will be used for the sidebar, login, navbar, invoice, print view, and exported PDFs. No logo URL entry is required.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Pharmacy Name</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.pharmacy_name} onChange={(e) => updateField('pharmacy_name', e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Owner Name</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.owner_name} onChange={(e) => updateField('owner_name', e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>GSTIN</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.gstin} onChange={(e) => updateField('gstin', e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Drug License Number</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.drug_license_number} onChange={(e) => updateField('drug_license_number', e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Address Line 1</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.address_line_1} onChange={(e) => updateField('address_line_1', e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Address Line 2</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.address_line_2} onChange={(e) => updateField('address_line_2', e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>City</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>State</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.state} onChange={(e) => updateField('state', e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>PIN Code</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.pin_code} onChange={(e) => updateField('pin_code', e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Phone Number</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.phone_number} onChange={(e) => updateField('phone_number', e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Email</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Website</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.website} onChange={(e) => updateField('website', e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Currency</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.currency} onChange={(e) => updateField('currency', e.target.value)} />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            <span>Timezone</span>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.timezone} onChange={(e) => updateField('timezone', e.target.value)} />
          </label>
        </div>

        <label className="block space-y-2 text-sm font-medium text-slate-700">
          <span>Invoice Footer</span>
          <textarea className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.invoice_footer} onChange={(e) => updateField('invoice_footer', e.target.value)} />
        </label>

        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70">
          <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
