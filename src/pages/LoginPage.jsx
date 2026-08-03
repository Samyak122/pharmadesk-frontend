import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { resolvePharmacyLogo } from '../utils/logoUtils';

export function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 flex justify-center">
          <img src={resolvePharmacyLogo()} alt="GenPharma logo" className="h-16 w-16 rounded-3xl object-cover" />
        </div>
        <h1 className="text-3xl font-semibold text-slate-900">Welcome to GenPharma</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to manage your pharmacy operations.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input type="password" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">Login</button>
          <button type="button" onClick={() => setForm({ username: 'admin', password: 'admin' })} className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700">Demo Login</button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Need an account?{' '}
          <Link to="/contact" className="font-semibold text-slate-900">Contact our team.</Link>
        </p>
      </div>
    </div>
  );
}
