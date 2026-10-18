import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronRight,
  CircleCheck, Clock3, Cloud, Eye, EyeOff, FileText, HardDrive,
  KeyRound, LoaderCircle, LockKeyhole, LogOut, Mail, Pencil,
  RefreshCw, Save, ShieldCheck, UserRound, X
} from 'lucide-react';
import { API_BASE_URL } from '../config';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'details', label: 'Personal details', icon: UserRound },
  { id: 'security', label: 'Security', icon: ShieldCheck }
];

const formatDate = value => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
};

const initials = name => (name || 'V').trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('vaultToken');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) throw new Error(data.msg || data.message || `Request failed (${response.status})`);
  return data;
}

const InfoRow = ({ icon: Icon, label, value, copyable = false }) => (
  <div className="flex min-w-0 items-center gap-4 py-4 first:pt-0 last:pb-0">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EFEC] text-[#123458]"><Icon size={18} /></span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-[#718198]">{label}</p>
      <p className={`mt-0.5 text-sm font-semibold text-[#123458] ${copyable ? 'break-all' : ''}`}>{value}</p>
    </div>
  </div>
);

const ProfilePage = ({ onLogout, onProfileUpdated }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profile, setProfile] = useState(null);
  const [activity, setActivity] = useState([]);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState(null);
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [passwordStatus, setPasswordStatus] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    setLoadError('');
    const [accountResult, activityResult] = await Promise.allSettled([
      apiRequest('/api/auth/me'),
      apiRequest('/api/files/logs')
    ]);
    if (accountResult.status === 'fulfilled') {
      setProfile(accountResult.value);
      setName(accountResult.value.user?.name || '');
    } else {
      setLoadError(accountResult.reason.message || 'Could not load your account.');
    }
    if (activityResult.status === 'fulfilled') setActivity(activityResult.value.logs || []);
    setLoading(false);
  };

  useEffect(() => { loadProfile(); }, []);

  const saveName = async event => {
    event.preventDefault();
    const cleanName = name.trim().replace(/\s+/g, ' ');
    if (cleanName.length < 2 || cleanName.length > 80) {
      setNameStatus({ type: 'error', text: 'Use a name between 2 and 80 characters.' });
      return;
    }
    setSavingName(true);
    setNameStatus(null);
    try {
      const result = await apiRequest('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ name: cleanName }) });
      setProfile(previous => ({ ...previous, user: { ...previous.user, ...result.user } }));
      setName(result.user.name);
      setNameStatus({ type: 'success', text: 'Your display name has been updated.' });
      onProfileUpdated?.(result.user);
    } catch (error) {
      setNameStatus({ type: 'error', text: error.message });
    } finally {
      setSavingName(false);
    }
  };

  const changePassword = async event => {
    event.preventDefault();
    setPasswordStatus(null);
    if (password.next.length < 8) {
      setPasswordStatus({ type: 'error', text: 'Use at least 8 characters for your new password.' });
      return;
    }
    if (password.next !== password.confirm) {
      setPasswordStatus({ type: 'error', text: 'The new passwords do not match.' });
      return;
    }
    setSavingPassword(true);
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'PUT', body: JSON.stringify({ currentPassword: password.current, newPassword: password.next })
      });
      setPassword({ current: '', next: '', confirm: '' });
      setPasswordStatus({ type: 'success', text: 'Password updated. Use the new password the next time you sign in.' });
    } catch (error) {
      setPasswordStatus({ type: 'error', text: error.message });
    } finally {
      setSavingPassword(false);
    }
  };

  const signOut = () => {
    onLogout?.();
    navigate('/login');
  };

  if (loading) return <div className="flex h-full min-h-96 items-center justify-center bg-[#F7F8FA] text-[#123458]"><LoaderCircle size={30} className="animate-spin" /><span className="ml-3 text-sm font-medium">Loading your profile...</span></div>;
  if (loadError || !profile?.user) return <div className="flex h-full min-h-96 flex-col items-center justify-center gap-4 bg-[#F7F8FA] p-6 text-center"><p className="text-[#123458]">{loadError || 'Could not load your account.'}</p><button onClick={loadProfile} className="inline-flex items-center gap-2 rounded-xl bg-[#123458] px-4 py-2 text-sm font-semibold text-white"><RefreshCw size={16} /> Try again</button></div>;

  const { user, stats = {} } = profile;
  const tier = user.tier || 'Personal';
  const used = Number(stats.storageUsed) || 0;
  const limit = stats.storageLimit;
  const unlimited = limit === 'Unlimited';
  const percent = unlimited ? 0 : Math.min(100, Math.max(0, Number(stats.storagePercent) || 0));
  const displayName = user.name || 'Vault member';

  return (
    <main className="h-full overflow-y-auto bg-[#F7F8FA] text-[#123458]">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-7 sm:px-7 lg:px-10 lg:pt-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#8290A2]">Account / Profile</p>
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">Your account</h1>
            <p className="mt-2 text-sm text-[#718198]">Manage your details, storage, and account access.</p>
          </div>
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-xl border border-[#DDE3EA] bg-white px-4 py-2.5 text-sm font-semibold text-[#52647A] transition hover:border-[#123458] hover:text-[#123458]"><LogOut size={16} /> Sign out</button>
        </div>

        <section className="relative overflow-hidden rounded-[28px] bg-[#123458] px-6 py-7 text-white shadow-[0_24px_55px_-35px_#123458] sm:px-8 sm:py-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-36 h-96 w-96 rounded-full border border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-5 -top-24 h-72 w-72 rounded-full border border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute right-10 top-8 h-44 w-44 rounded-full bg-[#6DA9C4]/15 blur-3xl" />
          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-white/25 bg-white/15 font-serif text-3xl font-bold shadow-inner sm:h-24 sm:w-24 sm:text-4xl" aria-label={`${displayName} avatar`}>{initials(displayName)}</div>
              <div className="min-w-0">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#A9C7D8]">Your VaultX profile</p>
                <h2 className="truncate font-serif text-2xl font-bold sm:text-3xl">{displayName}</h2>
                <p className="mt-1 truncate text-sm text-[#C8D8E4]" title={user.email}>{user.email}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold"><ShieldCheck size={13} /> {tier} plan</div>
              </div>
            </div>
            <button onClick={() => setTab('details')} className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#123458] transition hover:bg-[#EAF1F5]"><Pencil size={15} /> Edit profile</button>
          </div>
        </section>

        <div role="tablist" aria-label="Profile sections" className="mt-7 flex gap-2 overflow-x-auto border-b border-[#DEE5EB] pb-px">
          {tabs.map(item => <button key={item.id} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${tab === item.id ? 'border-[#123458] text-[#123458]' : 'border-transparent text-[#8290A2] hover:text-[#123458]'}`}><item.icon size={17} /> {item.label}</button>)}
        </div>

        <div role="tabpanel" className="mt-7">
          {tab === 'overview' && <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <div className="space-y-6">
              <section className="rounded-[24px] border border-[#E4E9EE] bg-white p-6 shadow-[0_12px_32px_-28px_#123458] sm:p-7">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8290A2]">Storage</p><h3 className="mt-2 font-serif text-2xl font-bold">Your space</h3></div><span className="rounded-xl bg-[#EBF2F7] p-3 text-[#123458]"><Cloud size={22} /></span></div>
                <div className="mt-7 flex items-baseline gap-2"><span className="text-4xl font-bold tracking-tight">{used.toFixed(2)}</span><span className="text-sm font-medium text-[#8290A2]">MB used {unlimited ? '· Unlimited plan' : `of ${limit} MB`}</span></div>
                <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#E9EEF2]" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used"><div className="h-full rounded-full bg-[#2D7797] transition-all" style={{ width: `${percent}%` }} /></div>
                <div className="mt-3 flex justify-between text-xs text-[#8290A2]"><span>{unlimited ? 'No storage limit' : `${percent.toFixed(1)}% used`}</span><span>{stats.fileCount || 0} active files</span></div>
                <button onClick={() => navigate('/dashboard/storage')} className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B6689] hover:text-[#123458]">Manage storage <ArrowUpRight size={16} /></button>
              </section>
              <section className="rounded-[24px] border border-[#E4E9EE] bg-white p-6 shadow-[0_12px_32px_-28px_#123458] sm:p-7">
                <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8290A2]">Timeline</p><h3 className="mt-2 font-serif text-2xl font-bold">Recent activity</h3></div><span className="rounded-xl bg-[#F1EFEC] p-3"><Clock3 size={20} /></span></div>
                {activity.length ? <div className="mt-5 divide-y divide-[#EBEEF1]">{activity.slice(0, 4).map(item => <div key={item._id} className="flex gap-3 py-3.5"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EBF2F7] text-[#1B6689]"><Activity size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.details || item.action}</p><p className="mt-0.5 text-xs text-[#8290A2]">{formatDate(item.createdAt)}</p></div></div>)}</div> : <p className="mt-5 rounded-xl bg-[#F7F8FA] px-4 py-5 text-sm text-[#8290A2]">No recent activity to show.</p>}
                <button onClick={() => navigate('/dashboard/activity')} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1B6689] hover:text-[#123458]">View all activity <ArrowRight size={16} /></button>
              </section>
            </div>
            <div className="space-y-6">
              <section className="rounded-[24px] border border-[#E4E9EE] bg-white p-6 shadow-[0_12px_32px_-28px_#123458] sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8290A2]">At a glance</p><h3 className="mt-2 font-serif text-2xl font-bold">Account details</h3><div className="mt-6 divide-y divide-[#EBEEF1]"><InfoRow icon={Mail} label="Email address" value={user.email} copyable /><InfoRow icon={CalendarDays} label="Member since" value={formatDate(user.createdAt)} /><InfoRow icon={HardDrive} label="Current plan" value={tier} /><InfoRow icon={user.isVerified ? CircleCheck : Mail} label="Email status" value={user.isVerified ? 'Verified' : 'Not verified'} /></div></section>
              <button onClick={() => setTab('security')} className="flex w-full items-center gap-4 rounded-[24px] border border-[#DDE8ED] bg-[#EAF3F6] p-5 text-left transition hover:border-[#A9C7D8]"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#1B6689]"><LockKeyhole size={21} /></span><span className="flex-1"><span className="block text-sm font-bold">Review account security</span><span className="mt-0.5 block text-xs text-[#718198]">Change your password and manage this session.</span></span><ChevronRight size={18} /></button>
            </div>
          </div>}

          {tab === 'details' && <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <section className="rounded-[24px] border border-[#E4E9EE] bg-white p-6 shadow-[0_12px_32px_-28px_#123458] sm:p-8"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#EBF2F7] p-3"><UserRound size={20} /></span><div><h3 className="font-serif text-2xl font-bold">Personal details</h3><p className="mt-1 text-sm text-[#8290A2]">Choose the name shown throughout your dashboard.</p></div></div><form onSubmit={saveName} className="mt-8 space-y-6"><div><label htmlFor="profile-name" className="mb-2 block text-sm font-semibold">Display name</label><input id="profile-name" value={name} onChange={event => setName(event.target.value)} maxLength={80} required className="w-full rounded-xl border border-[#D8E1E8] bg-[#FBFCFD] px-4 py-3 text-sm outline-none transition focus:border-[#2D7797] focus:ring-4 focus:ring-[#2D7797]/10" /><p className="mt-2 text-xs text-[#8290A2]">2–80 characters. This is visible on your profile and dashboard.</p></div><div><label htmlFor="profile-email" className="mb-2 block text-sm font-semibold">Email address</label><input id="profile-email" value={user.email || ''} readOnly className="w-full cursor-not-allowed rounded-xl border border-[#E5EAEE] bg-[#F4F6F8] px-4 py-3 text-sm text-[#718198]" /><p className="mt-2 text-xs text-[#8290A2]">Your sign-in email cannot be changed here.</p></div>{nameStatus && <p role="status" className={`rounded-xl px-4 py-3 text-sm ${nameStatus.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{nameStatus.text}</p>}<div className="flex flex-wrap gap-3"><button type="submit" disabled={savingName || name.trim() === user.name} className="inline-flex items-center gap-2 rounded-xl bg-[#123458] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1B496A] disabled:cursor-not-allowed disabled:opacity-50">{savingName ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />} Save changes</button><button type="button" onClick={() => { setName(user.name || ''); setNameStatus(null); }} className="inline-flex items-center gap-2 rounded-xl border border-[#D8E1E8] px-5 py-3 text-sm font-semibold text-[#52647A] hover:bg-[#F7F8FA]"><X size={16} /> Reset</button></div></form></section>
            <section className="h-fit rounded-[24px] border border-[#E4E9EE] bg-white p-6 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8290A2]">Account record</p><div className="mt-5 divide-y divide-[#EBEEF1]"><InfoRow icon={CalendarDays} label="Joined VaultX" value={formatDate(user.createdAt)} /><InfoRow icon={ShieldCheck} label="Plan" value={tier} /><InfoRow icon={FileText} label="Active files" value={String(stats.fileCount || 0)} /></div></section>
          </div>}

          {tab === 'security' && <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <section className="rounded-[24px] border border-[#E4E9EE] bg-white p-6 shadow-[0_12px_32px_-28px_#123458] sm:p-8"><div className="flex items-center gap-3"><span className="rounded-xl bg-[#EBF2F7] p-3"><KeyRound size={20} /></span><div><h3 className="font-serif text-2xl font-bold">Change password</h3><p className="mt-1 text-sm text-[#8290A2]">Keep your account access up to date.</p></div></div><form onSubmit={changePassword} className="mt-8 space-y-5"><div><label htmlFor="current-password" className="mb-2 block text-sm font-semibold">Current password</label><input id="current-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password.current} onChange={event => setPassword(previous => ({ ...previous, current: event.target.value }))} className="w-full rounded-xl border border-[#D8E1E8] bg-[#FBFCFD] px-4 py-3 text-sm outline-none focus:border-[#2D7797] focus:ring-4 focus:ring-[#2D7797]/10" /></div><div><label htmlFor="new-password" className="mb-2 block text-sm font-semibold">New password</label><input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} required value={password.next} onChange={event => setPassword(previous => ({ ...previous, next: event.target.value }))} className="w-full rounded-xl border border-[#D8E1E8] bg-[#FBFCFD] px-4 py-3 text-sm outline-none focus:border-[#2D7797] focus:ring-4 focus:ring-[#2D7797]/10" /><p className="mt-2 flex items-center gap-1.5 text-xs text-[#8290A2]"><Check size={14} /> At least 8 characters</p></div><div><label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold">Confirm new password</label><input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required value={password.confirm} onChange={event => setPassword(previous => ({ ...previous, confirm: event.target.value }))} className="w-full rounded-xl border border-[#D8E1E8] bg-[#FBFCFD] px-4 py-3 text-sm outline-none focus:border-[#2D7797] focus:ring-4 focus:ring-[#2D7797]/10" /></div><button type="button" onClick={() => setShowPassword(value => !value)} className="inline-flex items-center gap-2 text-xs font-semibold text-[#52647A] hover:text-[#123458]">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />} {showPassword ? 'Hide passwords' : 'Show passwords'}</button>{passwordStatus && <p role="status" className={`rounded-xl px-4 py-3 text-sm ${passwordStatus.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{passwordStatus.text}</p>}<div><button type="submit" disabled={savingPassword} className="inline-flex items-center gap-2 rounded-xl bg-[#123458] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1B496A] disabled:opacity-50">{savingPassword ? <LoaderCircle size={16} className="animate-spin" /> : <LockKeyhole size={16} />} Update password</button></div></form></section>
            <div className="space-y-6"><section className="rounded-[24px] border border-[#E4E9EE] bg-white p-6 sm:p-7"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3F6] text-[#1B6689]"><ShieldCheck size={21} /></span><h3 className="mt-5 font-serif text-xl font-bold">Account access</h3><p className="mt-2 text-sm leading-6 text-[#718198]">You are signed in as <span className="font-semibold text-[#123458]">{user.email}</span>. Changing your password updates the credentials for future sign-ins.</p></section><section className="rounded-[24px] border border-[#E4E9EE] bg-white p-6 sm:p-7"><h3 className="font-serif text-xl font-bold">This session</h3><p className="mt-2 text-sm leading-6 text-[#718198]">Sign out when you finish using a shared device.</p><button onClick={signOut} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"><LogOut size={16} /> Sign out now</button></section></div>
          </div>}
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
