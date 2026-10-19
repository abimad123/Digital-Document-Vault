import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async event => {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.msg || 'Could not create your account.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };
  const input = 'mt-1 w-full rounded-xl border border-[#C7D5E1] bg-white px-4 py-3 text-[#123458] outline-none focus:border-[#123458] focus:ring-2 focus:ring-[#123458]/15';
  return (
    <main className="grid min-h-screen bg-[#F5F7F9] text-[#123458] lg:grid-cols-[minmax(320px,0.8fr)_1.2fr]">
      <aside className="hidden bg-[#123458] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-3 font-serif text-2xl font-bold"><ShieldCheck size={29} /> VaultX</Link>
        <div><h1 className="max-w-md font-serif text-5xl font-bold leading-tight">Your documents, organized.</h1><p className="mt-5 max-w-md text-[#D3E1ED]">Start with a free 1 GB vault. Review storage usage and request more capacity from your dashboard.</p></div>
        <p className="text-sm text-[#BFD0E0]">Secure file management for your workspace</p>
      </aside>
      <div className="flex min-w-0 items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-lg rounded-3xl border border-[#DEE7EE] bg-white p-6 shadow-[0_20px_55px_-35px_#123458] sm:p-10">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 font-serif text-xl font-bold lg:hidden"><ShieldCheck /> VaultX</Link>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#60788E]">Create your account</p>
          <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Join VaultX</h2>
          <p className="mt-2 text-sm text-[#526B82]">Personal includes 1 GB. You can request an upgrade after signing in.</p>
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
          <form onSubmit={submit} className="mt-7 space-y-5">
            <label className="block text-sm font-semibold">Full name<input name="name" autoComplete="name" required minLength={2} maxLength={80} value={form.name} onChange={update} className={input} /></label>
            <label className="block text-sm font-semibold">Email address<input name="email" type="email" autoComplete="email" required value={form.email} onChange={update} className={input} /></label>
            <label className="block text-sm font-semibold">Password<div className="relative"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={form.password} onChange={update} className={`${input} pr-12`} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 mt-0.5 -translate-y-1/2 rounded-lg p-2 hover:bg-[#EAF0F5]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
            <label className="block text-sm font-semibold">Confirm password<input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={form.confirmPassword} onChange={update} className={input} /></label>
            <button disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#123458] px-5 font-bold text-white hover:bg-[#1B456F] disabled:opacity-60">{loading ? 'Creating account…' : 'Create free account'} <ArrowRight size={18} /></button>
          </form>
          <p className="mt-6 text-center text-sm text-[#526B82]">Already have an account? <Link to="/login" className="font-bold text-[#123458] underline">Sign in</Link></p>
        </div>
      </div>
    </main>
  );
}
