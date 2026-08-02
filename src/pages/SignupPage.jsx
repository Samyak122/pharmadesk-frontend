import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resolvePharmacyLogo } from '../utils/logoUtils';

export function SignupPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'Pharmacist' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { register } = useAuth();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create account.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex justify-center">
          <img src={resolvePharmacyLogo()} alt="GenPharma logo" className="h-16 w-16 rounded-3xl object-cover" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900">Create your GenPharma account</h1>
        <p className="mt-2 text-sm text-slate-500">Register a new Admin or Pharmacist account.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input type="email" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input type="password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="Pharmacist">Pharmacist</option>
            <option value="Admin">Admin</option>
          </select>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">Create Account</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-slate-900">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
