import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  Cloud, 
  LogOut, 
  Key, 
  ShieldAlert, 
  Camera, 
  Mail, 
  Smartphone, 
  MapPin, 
  Shield, 
  Activity, 
  CreditCard, 
  Lock, 
  ExternalLink,
  Fingerprint,
  RefreshCw,
  Cpu,
  History,
  Trash2,
  ChevronRight,
  Zap,
  Share2
} from 'lucide-react';

const ProfilePage = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'security', label: 'Security', icon: Key },
    { id: 'sessions', label: 'Sessions', icon: History },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 animate-content-smooth">
            {/* Identity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#D4C9BE]/10 border-2 border-[#D4C9BE] rounded-3xl p-6 shadow-inner group transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-[#123458]/5 rounded-full blur-xl"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-[#F1EFEC] border border-[#D4C9BE] rounded-xl flex items-center justify-center text-[#123458] shadow-sm">
                    <Mail size={20} />
                  </div>
                  <span className="px-2 py-0.5 bg-[#123458]/10 text-[#123458] rounded-md text-[9px] font-black uppercase tracking-widest border border-[#123458]/20">Verified</span>
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#D4C9BE] mb-1">Primary Email</p>
                <h4 className="text-lg font-black text-[#123458] truncate">{user?.email || 'user@vault.io'}</h4>
                <button className="mt-4 text-xs font-black text-[#123458] flex items-center gap-1.5 hover:gap-2 transition-all">
                  Update <ExternalLink size={12} />
                </button>
              </div>

              <div className="bg-[#D4C9BE]/10 border-2 border-[#D4C9BE] rounded-3xl p-6 shadow-inner group transition-all duration-300 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 -mr-4 -mb-4 w-20 h-20 bg-[#123458]/5 rounded-full blur-xl"></div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-[#F1EFEC] border border-[#D4C9BE] rounded-xl flex items-center justify-center text-[#123458] shadow-sm">
                    <Smartphone size={20} />
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">Secured</span>
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-[#D4C9BE] mb-1">Biometric Node</p>
                <h4 className="text-lg font-black text-[#123458]">+1 (•••) •••-5421</h4>
                <button className="mt-4 text-xs font-black text-[#123458] flex items-center gap-1.5 hover:gap-2 transition-all">
                  Checkup <ChevronRight size={12} />
                </button>
              </div>
            </div>

            {/* Storage Card */}
            <div className="bg-[#123458] rounded-[2rem] p-8 text-[#F1EFEC] relative overflow-hidden group border border-[#D4C9BE]/20 shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4C9BE]/10 blur-[100px] rounded-full -mr-20 -mt-20"></div>
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                <div className="space-y-4 flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F1EFEC]/10 border border-[#D4C9BE]/30 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                    <Cloud size={12} className="text-[#D4C9BE]" />
                    Storage Health
                  </div>
                  <h3 className="text-2xl font-black tracking-wide leading-tight font-serif">Your digital legacy is <span className="text-[#D4C9BE]">secure.</span></h3>
                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-2xl font-black">0.0 MB</p>
                      <p className="text-[9px] font-bold text-[#D4C9BE]/60 uppercase tracking-widest">Utilized</p>
                    </div>
                    <div className="w-[1px] h-8 bg-[#F1EFEC]/10"></div>
                    <div>
                      <p className="text-2xl font-black">3.0 GB</p>
                      <p className="text-[9px] font-bold text-[#D4C9BE]/60 uppercase tracking-widest">Allocated</p>
                    </div>
                  </div>
                </div>
                <div className="w-full lg:w-64 space-y-4 bg-[#F1EFEC]/5 p-5 rounded-2xl border border-[#D4C9BE]/20 backdrop-blur-sm">
                  <div className="h-2 w-full bg-[#F1EFEC]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4C9BE] rounded-full w-[2%]"></div>
                  </div>
                  <button className="w-full bg-[#F1EFEC] text-[#123458] py-3 rounded-xl font-black text-xs hover:bg-[#D4C9BE] transition-all shadow-lg active:scale-95">
                    Expand Storage
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6 animate-content-smooth">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-[#123458] tracking-tight font-serif">Security Protocols</h2>
              <button 
                onClick={handleRefresh}
                className={`p-2 bg-[#D4C9BE]/20 rounded-lg text-[#123458] hover:bg-[#D4C9BE]/40 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { title: "Encryption Phrase", desc: "Seed for AES-256 local keys.", status: "Configured", icon: Key, action: "Cycle", danger: false },
                { title: "Biometric Key", desc: "FIDO2 hardware auth protocol.", status: "Active", icon: Fingerprint, action: "Sync", danger: false },
                { title: "Total Lockdown", desc: "Instantly revoke all access.", status: "Ready", icon: ShieldAlert, action: "Engage", danger: true }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 bg-[#F1EFEC] border-2 border-[#D4C9BE] p-5 rounded-2xl hover:border-[#123458] transition-all group shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.danger ? 'bg-rose-500/10 text-rose-600' : 'bg-[#123458]/5 text-[#123458]'}`}>
                      <item.icon size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-[#123458]">{item.title}</h4>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${item.danger ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>{item.status}</span>
                      </div>
                      <p className="text-[11px] text-[#D4C9BE] font-bold uppercase tracking-widest">{item.desc}</p>
                    </div>
                  </div>
                  <button className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${item.danger ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg' : 'bg-[#123458] text-[#F1EFEC] hover:bg-[#030303]'}`}>
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    /* Changed max-w-5xl to w-full to fill the screen */
   <div className="w-full min-h-full bg-[#F1EFEC] animate-page-smooth font-inter">
      {/* Container div now has horizontal padding p-8 instead of external centering margins */}
      <div className="flex-1 p-8 md:p-12 space-y-10">
        
        {/* Profile Hero Section - Rotated to Deep Navy #123458 */}
        <section className="relative h-48 md:h-64 bg-[#123458] rounded-[2rem] overflow-hidden shadow-2xl flex items-end p-6 md:p-10 group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#030303]/60 via-transparent to-transparent z-10"></div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-[#D4C9BE]/10 blur-[100px] rounded-full"></div>
          
          <div className="relative z-20 flex items-center gap-6 w-full translate-y-2">
            <div className="relative group/avatar">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] p-1 bg-gradient-to-tr from-[#D4C9BE] to-[#F1EFEC] relative shadow-2xl overflow-hidden transition-all duration-500 group-hover/avatar:scale-105">
                <div className="w-full h-full rounded-[1.75rem] overflow-hidden bg-[#123458] border-2 border-[#123458]">
                  <img src={user?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop"} alt="Profile" className="w-full h-full object-cover transition-transform duration-1000 group-hover/avatar:scale-110" />
                </div>
                <button className="absolute inset-0 bg-[#030303]/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-[#F1EFEC] backdrop-blur-sm">
                  <Camera size={24} strokeWidth={2} />
                </button>
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-2 border-[#123458] rounded-xl flex items-center justify-center text-white shadow-xl">
                <ShieldCheck size={16} strokeWidth={3} />
              </div>
            </div>
            
            <div className="flex-1 mb-2">
              <div className="flex items-center gap-2 mb-2">
                 <span className="px-3 py-1 bg-[#F1EFEC]/10 backdrop-blur-md border border-[#D4C9BE]/20 rounded-full text-[8px] font-black uppercase tracking-widest text-[#F1EFEC]">
                   Verified
                 </span>
                 <span className="px-3 py-1 bg-[#D4C9BE]/20 backdrop-blur-md border border-[#D4C9BE]/20 rounded-full text-[8px] font-black uppercase tracking-widest text-[#D4C9BE]">
                   3 Nodes
                 </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-[#F1EFEC] tracking-tight font-serif leading-none">
                 {user?.name || 'Authorized User'}
              </h1>
              <div className="flex items-center gap-4 text-[#D4C9BE] font-bold text-[10px] uppercase tracking-widest mt-2">
                 <div className="flex items-center gap-1.5"><MapPin size={12} className="text-[#F1EFEC]" />US-PACIFIC-1</div>
                 <div className="w-1 h-1 bg-[#D4C9BE]/30 rounded-full"></div>
                 <div className="flex items-center gap-1.5"><Shield size={12} className="text-emerald-500" />Admin</div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid: Navigation + Content area expands to fill the wide container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Navigation - Sidebar Navigation Area */}
          <nav className="space-y-2">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#D4C9BE] mb-6 ml-4">System Menu</p>
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full group relative flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all text-left overflow-hidden ${
                  activeTab === item.id 
                    ? 'bg-[#123458] text-[#F1EFEC] shadow-xl shadow-[#123458]/30 translate-x-1' 
                    : 'text-[#D4C9BE] hover:bg-[#D4C9BE]/10 hover:text-[#123458]'
                }`}
              >
                <item.icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
                {item.label}
                {activeTab === item.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
              </button>
            ))}
            
            <div className="pt-10 px-6 space-y-6">
               <div className="h-[1px] bg-[#D4C9BE]/30"></div>
               <button className="flex items-center gap-3 font-black text-[9px] uppercase tracking-[0.4em] text-[#D4C9BE] hover:text-rose-500 transition-all active:scale-95">
                  <LogOut size={16} />
                  Sign Out
               </button>
            </div>
          </nav>

          {/* Content Area - Now occupies 3/4 of the width */}
          <div className="lg:col-span-3 min-w-0 pb-20">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;