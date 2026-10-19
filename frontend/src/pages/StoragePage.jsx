import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, HardDrive, Image, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { clearSession, getValidToken } from '../auth/session';

const MB = 1024 * 1024;
const plans = [
  { name: 'Personal', capacity: '1 GB', limit: 1024 },
  { name: 'Professional', capacity: '50 GB', limit: 51200 },
  { name: 'Enterprise', capacity: 'Unlimited', limit: Infinity }
];
const bytesFor = file => typeof file.sizeBytes === 'number' ? file.sizeBytes : (parseFloat(file.fileSize) || 0) * MB;
const formatSize = bytes => bytes >= 1024 * MB ? `${(bytes / (1024 * MB)).toFixed(2)} GB` : bytes >= MB ? `${(bytes / MB).toFixed(2)} MB` : `${Math.round(bytes / 1024)} KB`;

async function api(path, options = {}) {
  const token = getValidToken();
  if (!token) throw new Error('Your session expired. Please sign in again.');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) clearSession();
  if (!response.ok || !data.success) throw new Error(data.message || data.msg || `Request failed (${response.status})`);
  return data;
}

export default function StoragePage() {
  const [account, setAccount] = useState(null);
  const [files, setFiles] = useState([]);
  const [pending, setPending] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [me, all, request] = await Promise.all([
        api('/api/auth/me'), api('/api/files/all'), api('/api/auth/plan-request')
      ]);
      setAccount(me);
      setFiles(all.files || []);
      setPending(request.request);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const usage = useMemo(() => {
    const result = { documents: 0, images: 0, other: 0, trash: 0, total: 0, count: 0 };
    for (const file of files) {
      if (file.isFolder) continue;
      const bytes = bytesFor(file);
      result.total += bytes;
      if (file.trashedAt) result.trash += bytes;
      const type = (file.fileType || '').toLowerCase();
      if (type.startsWith('image/')) result.images += bytes;
      else if (/pdf|document|text|word|sheet|presentation/.test(type) || /\.(pdf|docx?|txt|csv|xlsx?|pptx?)$/i.test(file.fileName || '')) result.documents += bytes;
      else result.other += bytes;
      result.count++;
    }
    return result;
  }, [files]);

  const current = account?.user?.tier || 'Personal';
  const currentIndex = Math.max(0, plans.findIndex(plan => plan.name === current));
  const limit = plans[currentIndex].limit;
  const limitBytes = limit * MB;
  const percent = Number.isFinite(limitBytes) ? Math.min(100, usage.total / limitBytes * 100) : 0;
  const largest = [...files].filter(file => !file.isFolder && !file.trashedAt).sort((a, b) => bytesFor(b) - bytesFor(a)).slice(0, 5);
  const card = 'rounded-3xl border border-[#DCE5ED] bg-white p-5 shadow-[0_14px_38px_-30px_#123458] sm:p-7';

  const requestUpgrade = async plan => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data = await api('/api/auth/plan-request', { method: 'POST', body: JSON.stringify({ plan }) });
      setPending(data.request);
      setNotice(`${plan} request submitted. Your current plan stays active while it is reviewed. No payment was taken.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-w-0 flex-1 overflow-y-auto bg-[#F5F7F9] p-4 text-[#123458] sm:p-6 lg:p-9">
      <div className="mx-auto max-w-6xl space-y-6 pb-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5F7890]">Your workspace</p><h1 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Manage storage</h1><p className="mt-2 text-sm text-[#526B82]">See what uses space and manage your plan.</p></div>
          <button onClick={load} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D5E0E9] bg-white px-4 font-semibold hover:bg-[#EEF4F8] disabled:opacity-50"><RefreshCw size={17} /> Refresh</button>
        </header>
        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error} {(!account && !loading) && <button onClick={load} className="ml-2 font-bold underline">Try again</button>}</div>}
        {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</div>}
        {loading && !account ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="animate-spin" aria-label="Loading storage" /></div> : account && <>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
            <section className={card}>
              <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-sm font-bold"><HardDrive size={19} /> Storage used</div><p className="mt-5 text-3xl font-bold sm:text-4xl">{formatSize(usage.total)}</p><p className="mt-1 text-sm text-[#5F7890]">of {plans[currentIndex].capacity} · {usage.count} files including Trash</p></div><span className="rounded-full bg-[#E8F0F6] px-3 py-1.5 text-sm font-bold">{current}</span></div>
              <div className="mt-7 h-4 overflow-hidden rounded-full bg-[#E7EDF2]" role="progressbar" aria-label="Storage used" aria-valuenow={Math.round(percent)} aria-valuemin="0" aria-valuemax="100"><div className={`h-full rounded-full ${percent >= 90 ? 'bg-red-500' : 'bg-[#123458]'}`} style={{ width: `${percent}%` }} /></div>
              <div className="mt-3 flex justify-between text-sm font-medium text-[#526B82]"><span>{Number.isFinite(limit) ? `${percent.toFixed(1)}% used` : 'No set storage limit'}</span><span>{Number.isFinite(limit) ? `${formatSize(Math.max(0, limitBytes - usage.total))} available` : ''}</span></div>
              <p className="mt-4 text-xs text-[#60778D]">Files in Trash continue to use storage until permanently deleted.</p>
            </section>
            <section className={`${card} bg-[#123458] text-white`}><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#BFD0E0]">Current plan</p><h2 className="mt-3 font-serif text-3xl font-bold">{current}</h2><p className="mt-2 text-sm text-[#D3E1ED]">{plans[currentIndex].capacity} storage capacity</p><div className="mt-7 flex flex-col gap-3"><Link to="/dashboard/documents" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 font-bold text-[#123458]">Open My Drive</Link><Link to="/dashboard/trash" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/40 px-4 font-bold text-white"><Trash2 size={17} /> Review Trash</Link></div></section>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <section className={card}><h2 className="font-serif text-2xl font-bold">What uses your storage</h2><div className="mt-5 space-y-4">{[
              ['Documents', usage.documents, FileText, 'bg-[#123458]'], ['Images', usage.images, Image, 'bg-[#4E8CB4]'], ['Other files', usage.other, HardDrive, 'bg-[#D4924D]'], ['In Trash', usage.trash, Trash2, 'bg-[#A55D62]']
            ].map(([label, bytes, Icon, color]) => <div key={label} className="flex min-w-0 items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${color}`}><Icon size={18} /></span><span className="min-w-0 flex-1 text-sm font-semibold">{label}</span><span className="text-sm font-bold">{formatSize(bytes)}</span></div>)}</div><p className="mt-5 text-xs text-[#60778D]">Trash is also counted in the file categories above.</p></section>
            <section className={card}><h2 className="font-serif text-2xl font-bold">Largest active files</h2><div className="mt-4 divide-y divide-[#E7EDF2]">{largest.length ? largest.map(file => <div key={file._id} className="flex min-w-0 items-center gap-3 py-3"><FileText size={17} className="shrink-0 text-[#5F7890]" /><span className="min-w-0 flex-1 truncate text-sm font-medium" title={file.fileName}>{file.fileName}</span><span className="shrink-0 text-sm font-semibold">{formatSize(bytesFor(file))}</span></div>) : <p className="py-4 text-sm text-[#60778D]">No active files yet.</p>}</div><Link to="/dashboard/documents" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#123458] hover:underline">Manage files <ArrowRight size={16} /></Link></section>
          </div>
          <section className={card}><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-serif text-2xl font-bold">Storage plans</h2><p className="mt-2 text-sm text-[#526B82]">Upgrade requests are reviewed manually. Your plan changes only after approval; no card or payment is collected here.</p></div>{pending && <span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-900">{pending.plan} request pending</span>}</div><div className="mt-6 grid gap-4 md:grid-cols-3">{plans.map((plan, index) => <div key={plan.name} className={`flex flex-col rounded-2xl border p-5 ${index === currentIndex ? 'border-[#123458] bg-[#F1F6FA]' : 'border-[#DCE5ED]'}`}><p className="text-sm font-bold">{plan.name}</p><p className="mt-2 text-2xl font-bold">{plan.capacity}</p><p className="mt-2 flex-1 text-sm text-[#60778D]">Storage capacity</p><button disabled={index <= currentIndex || !!pending || busy} onClick={() => requestUpgrade(plan.name)} className="mt-5 min-h-11 rounded-xl bg-[#123458] px-4 text-sm font-bold text-white disabled:cursor-default disabled:bg-[#E4EBF1] disabled:text-[#5B7185]">{index === currentIndex ? 'Current plan' : pending ? 'Request pending' : index > currentIndex ? 'Request upgrade' : 'Included in your plan'}</button></div>)}</div></section>
        </>}
      </div>
    </main>
  );
}
