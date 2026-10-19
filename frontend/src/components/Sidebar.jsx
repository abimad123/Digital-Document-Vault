import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Clock3, FileText, HardDrive, History,
  Home, LogOut, ShieldCheck, Star, Trash2, User, X
} from 'lucide-react';

const items = [
  { label: 'My Drive', icon: FileText, path: '/dashboard/documents' },
  { label: 'Starred', icon: Star, path: '/dashboard/starred' },
  { label: 'Recent', icon: Clock3, path: '/dashboard/recent' },
  { label: 'Trash', icon: Trash2, path: '/dashboard/trash' },
  { label: 'Storage', icon: HardDrive, path: '/dashboard/storage' },
  { label: 'Activity', icon: History, path: '/dashboard/activity' },
  { label: 'Profile', icon: User, path: '/dashboard/profile' }
];

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { setMobileOpen(false); }, [location.pathname, setMobileOpen]);

  const go = path => {
    setMobileOpen(false);
    navigate(path);
  };
  const signOut = () => {
    setMobileOpen(false);
    onLogout?.();
    navigate('/');
  };

  return <>
    {mobileOpen && <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-[55] bg-[#071D32]/60 lg:hidden" />}
    <aside id="dashboard-navigation" aria-label="Dashboard navigation" className={`fixed inset-y-0 left-0 z-[60] flex flex-col bg-[#123458] text-[#E5EDF5] shadow-xl transition-[width,transform] duration-200 ${mobileOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full'} ${collapsed ? 'lg:w-20' : 'lg:w-64'} lg:translate-x-0`}>
      <div className={`flex h-20 shrink-0 items-center border-b border-white/10 px-5 ${collapsed ? 'lg:justify-center' : 'justify-between'}`}>
        <button onClick={() => go('/dashboard/documents')} className="flex min-w-0 items-center gap-3 text-left" aria-label="VaultX My Drive">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#E9D7BE]"><ShieldCheck size={24} /></span>
          <span className={`font-serif text-2xl font-bold text-white ${collapsed ? 'lg:hidden' : ''}`}>VaultX</span>
        </button>
        <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-white hover:bg-white/10 lg:hidden"><X size={20} /></button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <p className={`px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#AFC3D5] ${collapsed ? 'lg:hidden' : ''}`}>Workspace</p>
        <div className="space-y-1">
          {items.map(item => {
            const active = location.pathname.startsWith(item.path);
            return <button key={item.path} title={collapsed ? item.label : undefined} aria-current={active ? 'page' : undefined} onClick={() => go(item.path)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${collapsed ? 'lg:justify-center' : ''} ${active ? 'bg-white text-[#123458] shadow-sm' : 'text-[#C7D6E3] hover:bg-white/10 hover:text-white'}`}>
              <item.icon size={19} className="shrink-0" />
              <span className={collapsed ? 'lg:hidden' : ''}>{item.label}</span>
            </button>;
          })}
        </div>
        <div className="my-5 border-t border-white/10" />
        <button onClick={() => go('/')} title={collapsed ? 'Back to home' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-[#C7D6E3] transition hover:bg-white/10 hover:text-white ${collapsed ? 'lg:justify-center' : ''}`}><Home size={19} /><span className={collapsed ? 'lg:hidden' : ''}>Back to home</span></button>
      </nav>

      <div className="border-t border-white/10 p-3">
        <button onClick={signOut} title={collapsed ? 'Sign out' : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[#C7D6E3] transition hover:bg-white/10 hover:text-white ${collapsed ? 'lg:justify-center' : ''}`}><LogOut size={19} /><span className={collapsed ? 'lg:hidden' : ''}>Sign out</span></button>
      </div>
      <button onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="absolute -right-4 top-9 hidden h-8 w-8 items-center justify-center rounded-full border border-[#DCE4EA] bg-white text-[#123458] shadow-md hover:bg-[#F1EFEC] lg:flex">{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button>
    </aside>
  </>;
};

export default Sidebar;
