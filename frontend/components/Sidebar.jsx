import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import Router hooks
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  User, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  LogOut
} from 'lucide-react';

const Sidebar = ({ collapsed, setCollapsed, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'documents', label: 'Documents', icon: FileText, path: '/dashboard/documents' },
    { id: 'activity', label: 'Activity', icon: History, path: '/dashboard/activity' },
    { id: 'profile', label: 'Profile', icon: User, path: '/dashboard/profile' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-full bg-[#123458] border-r border-[#D4C9BE]/20 transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-black text-[#F1EFEC] text-xl tracking-wideer cursor-pointer"
          >
            <ShieldCheck size={24} className="text-[#D4C9BE]" />
            <span className="font-serif">Vault.io</span>
          </div>
        )}
        {collapsed && <ShieldCheck size={32} className="text-[#D4C9BE] mx-auto cursor-pointer" onClick={() => navigate('/')} />}
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:block p-1.5 rounded-lg bg-[#F1EFEC]/10 text-[#D4C9BE] hover:bg-[#F1EFEC] hover:text-[#123458] transition-all"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          // Check if current URL matches the item path
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-[#F1EFEC] text-[#123458] shadow-xl shadow-black/20 translate-x-1' 
                  : 'text-[#D4C9BE] hover:bg-[#F1EFEC]/5 hover:text-[#F1EFEC]'
              }`}
            >
              <item.icon size={22} className={isActive ? 'text-[#123458]' : ''} />
              {!collapsed && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
            </button>
          );
        })}
      </nav>
      
      {/* Bottom Logout Section */}
      <div className="p-4 border-t border-[#D4C9BE]/10">
         <button 
           onClick={() => {
             onLogout(); // Clears login state in App.jsx
             navigate('/'); // Redirects to Welcome page
           }}
           className="w-full flex items-center gap-3 px-3 py-4 bg-[#F1EFEC]/5 rounded-2xl border border-[#D4C9BE]/10 hover:bg-rose-500/10 hover:border-rose-500/30 group transition-all"
         >
            <LogOut size={20} className="text-[#D4C9BE] group-hover:text-rose-500" />
            {!collapsed && <span className="text-[#D4C9BE] group-hover:text-rose-500 font-bold text-sm tracking-tight">Logout</span>}
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;