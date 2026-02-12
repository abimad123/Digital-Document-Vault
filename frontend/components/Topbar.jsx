import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  ShieldCheck,
  Zap
} from 'lucide-react';

const Topbar = ({ user }) => {
  const navigate = useNavigate(); // Initialize navigator

  return (
    <header className="h-20 bg-[#F1EFEC] border-b border-[#D4C9BE] flex items-center justify-between px-8 sticky top-0 z-40 transition-colors">
      
      {/* Search Section - Recessed Tactile Style */}
      <div className="flex-1 max-w-xl relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#D4C9BE] group-focus-within:text-[#123458] transition-colors">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Search your secure vault..." 
          className="w-full bg-[#D4C9BE]/10 border-2 border-[#D4C9BE] rounded-2xl py-2.5 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-[#123458]/5 focus:border-[#123458] transition-all font-semibold text-[#030303] placeholder-[#123458]/40 shadow-inner"
        />
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-6">
        
        {/* Notifications - Eye Catching Badge */}
        <button className="relative p-2.5 text-[#123458] bg-[#D4C9BE]/30 hover:bg-[#D4C9BE]/50 border border-[#D4C9BE] rounded-xl transition-all active:scale-95 group">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#123458] border-2 border-[#F1EFEC] rounded-full animate-pulse"></span>
        </button>

        {/* Profile Dropdown Area */}
        <div className="flex items-center gap-4 pl-6 border-l border-[#D4C9BE]">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-[#123458] font-serif tracking-tight leading-none mb-1">
              {user?.name || 'Authorized User'}
            </p>
            <div className="flex items-center gap-1.5 justify-end">
              <Zap size={10} className="text-[#123458]" />
              <p className="text-[9px] font-black text-[#D4C9BE] uppercase tracking-widest">
                Pro Tier
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/dashboard/profile')} // Updated to use navigate
            className="flex items-center gap-2 p-1.5 bg-[#123458] rounded-2xl hover:opacity-90 transition-all shadow-lg group active:scale-95"
          >
            <div className="w-9 h-9 rounded-xl bg-[#F1EFEC] flex items-center justify-center text-[#123458] font-black overflow-hidden border border-[#D4C9BE]/50 shadow-inner">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={20} />
              )}
            </div>
            <ChevronDown size={16} className="text-[#F1EFEC] mr-1 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </header>
  );
};

export default Topbar;