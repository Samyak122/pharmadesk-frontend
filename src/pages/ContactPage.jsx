import { useState } from 'react';
import emailjs from '@emailjs/browser';
import { Link } from 'react-router-dom';
import api from '../api/client';

const initialState = {
  pharmacyName: '',
  ownerName: '',
  phone: '',
  email: '',
  gst: '',
  license: '',
  city: '',
  state: '',
  currentSoftware: '',
  message: '',
};

export function ContactPage() {
  const [form, setForm] = useState(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const contact = {
        pharmacyName: form.pharmacyName,
        ownerName: form.ownerName,
        phone: form.phone,
        email: form.email,
        gst: form.gst,
        license: form.license,
        city: form.city,
        state: form.state,
        currentSoftware: form.currentSoftware,
        message: form.message,
      };

      await api.post('/contact', contact);
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          pharmacy_name: contact.pharmacyName,
          owner_name: contact.ownerName,
          phone: contact.phone,
          email: contact.email,
          gst: contact.gst || 'Not provided',
          license: contact.license || 'Not provided',
          city: contact.city,
          state: contact.state,
          current_software: contact.currentSoftware || 'Not provided',
          message: contact.message,
          submitted_at: new Date().toLocaleString(),
        },
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
      );
      setSubmitted(true);
      setForm(initialState);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send your request right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-semibold text-white">GenPharma</Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            <a href="/" className="transition hover:text-white">Home</a>
            <a href="/login" className="transition hover:text-white">Login</a>
          </nav>
        </div>
      </header>

      <main className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[40px] border border-slate-200 bg-white p-8 shadow-2xl lg:grid-cols-[0.95fr_1.05fr] lg:p-12">
          <div className="rounded-[32px] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-900 p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">Contact GenPharma</p>
            <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Let’s discuss your pharmacy growth.</h1>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Share your pharmacy details and our team will reach out with the right solution for your billing and operations needs.
            </p>
            <div className="mt-8 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">📧 support@genpharma.com</div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">📞 +91 98765 43210</div>
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-8 text-center">
                <h2 className="text-2xl font-semibold text-slate-900">Thank you for contacting GenPharma.</h2>
                <p className="mt-4 text-slate-600">Our team will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <input required name="pharmacyName" value={form.pharmacyName} onChange={handleChange} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Pharmacy Name" />
                  <input required name="ownerName" value={form.ownerName} onChange={handleChange} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Owner Name" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input required name="phone" value={form.phone} onChange={handleChange} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Phone Number" />
                  <input required type="email" name="email" value={form.email} onChange={handleChange} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Email Address" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input name="gst" value={form.gst} onChange={handleChange} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="GST Number (Optional)" />
                  <input name="license" value={form.license} onChange={handleChange} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Drug License Number (Optional)" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input required name="city" value={form.city} onChange={handleChange} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="City" />
                  <input required name="state" value={form.state} onChange={handleChange} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="State" />
                </div>
                <input name="currentSoftware" value={form.currentSoftware} onChange={handleChange} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Current Billing Software" />
                <textarea required name="message" value={form.message} onChange={handleChange} rows="5" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500" placeholder="Message" />
                {error ? <p className="text-sm text-rose-600">{error}</p> : null}
                <button type="submit" className="rounded-full bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
