import React, { useState } from 'react';
import { 
  HardDrive, Image as ImageIcon, FileText, FileQuestion, 
  Zap, Building2, User, CheckCircle2 
} from 'lucide-react';

const StoragePage = () => {
  const [isYearly, setIsYearly] = useState(true);
  const [hoveredTier, setHoveredTier] = useState(1);

  const pricingTiers = [
    { name: "Personal", price: 0, icon: User, current: true },
    { name: "Professional", price: isYearly ? 300 : 600, icon: Zap, current: false },
    { name: "Enterprise", price: 2000, icon: Building2, current: false }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F1EFEC] p-4 md:p-8 font-inter">
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        
        {/* Header */}
        <div className="flex items-center gap-3 text-[#123458]">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-[#D4C9BE]/30">
            <HardDrive size={28} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-serif tracking-tight">Storage & Plans</h1>
        </div>

        {/* --- TOP SECTION: Storage Breakdown --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Storage Bar */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-[#D4C9BE]/50 shadow-sm relative overflow-hidden">
            <h2 className="text-xl font-bold text-[#123458] mb-6">Storage Usage</h2>
            
            <div className="flex justify-between text-sm font-bold text-[#123458] mb-3">
              <span className="text-2xl">1.98 <span className="text-sm opacity-60">MB Used</span></span>
              <span className="opacity-50 flex items-end">1024 MB Total</span>
            </div>
            
            {/* Multi-color Progress Bar */}
            <div className="w-full h-4 bg-[#F1EFEC] rounded-full overflow-hidden flex shadow-inner mb-8">
              <div className="bg-[#123458] h-full transition-all duration-1000" style={{ width: '45%' }}></div>
              <div className="bg-[#D4C9BE] h-full transition-all duration-1000" style={{ width: '30%' }}></div>
              <div className="bg-rose-400 h-full transition-all duration-1000" style={{ width: '10%' }}></div>
            </div>

            {/* Legend / Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-[#F1EFEC]/50 rounded-xl">
                <div className="w-3 h-3 rounded-full bg-[#123458]"></div>
                <div>
                  <p className="text-xs font-bold text-[#123458]/60 uppercase tracking-wider">Documents</p>
                  <p className="font-bold text-[#123458]">1.1 MB</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#F1EFEC]/50 rounded-xl">
                <div className="w-3 h-3 rounded-full bg-[#D4C9BE]"></div>
                <div>
                  <p className="text-xs font-bold text-[#123458]/60 uppercase tracking-wider">Images</p>
                  <p className="font-bold text-[#123458]">0.7 MB</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#F1EFEC]/50 rounded-xl">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div>
                  <p className="text-xs font-bold text-[#123458]/60 uppercase tracking-wider">Other</p>
                  <p className="font-bold text-[#123458]">0.18 MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Plan Status */}
          <div className="bg-[#123458] text-[#F1EFEC] rounded-[2rem] p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <div>
              <p className="text-xs font-bold text-[#D4C9BE] uppercase tracking-widest mb-2">Current Plan</p>
              <h3 className="text-3xl font-black font-serif mb-1">Personal</h3>
              <p className="text-[#F1EFEC]/70 text-sm font-medium">Basic cryptographic sovereignty.</p>
            </div>
            
            <div className="space-y-3 mt-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-sm font-medium text-[#F1EFEC]/70">Bandwidth</span>
                <span className="font-bold text-sm">Standard</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#F1EFEC]/70">Support</span>
                <span className="font-bold text-sm">Community</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- BOTTOM SECTION: Upgrade Plans --- */}
        <div className="pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-6">
            <h2 className="text-2xl md:text-3xl font-black text-[#123458] font-serif">Upgrade Your Vault</h2>
            
            {/* Toggle Switch */}
            <div className="flex items-center gap-3 text-sm font-bold bg-white p-1.5 rounded-full border border-[#D4C9BE]/50 shadow-sm">
              <button 
                onClick={() => setIsYearly(false)} 
                className={`px-4 py-2 rounded-full transition-all ${!isYearly ? 'bg-[#D4C9BE]/30 text-[#123458]' : 'text-[#123458]/50 hover:text-[#123458]'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setIsYearly(true)} 
                className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${isYearly ? 'bg-[#123458] text-[#F1EFEC]' : 'text-[#123458]/50 hover:text-[#123458]'}`}
              >
                Yearly <span className={`text-[10px] px-2 py-0.5 rounded-full ${isYearly ? 'bg-white/20' : 'bg-[#123458]/10 text-[#123458]'}`}>-50%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map((tier, i) => (
              <div 
                key={i} 
                onMouseEnter={() => setHoveredTier(i)} 
                className={`p-8 rounded-[2rem] flex flex-col transition-all duration-300 cursor-pointer border-2 ${
                  tier.current ? 'border-[#123458] bg-[#123458]/5' : 
                  hoveredTier === i ? 'bg-[#123458] text-[#F1EFEC] scale-105 shadow-2xl z-10 border-[#123458]' : 'bg-white text-[#030303] border-[#D4C9BE]/30 hover:border-[#D4C9BE]'
                }`}
              >
                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                    hoveredTier === i && !tier.current ? 'bg-white/10' : 'bg-[#123458]/10'
                  }`}>
                    <tier.icon size={24} className={hoveredTier === i && !tier.current ? 'text-[#F1EFEC]' : 'text-[#123458]'} />
                  </div>
                  <h3 className="text-xl font-black mb-2">{tier.name}</h3>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black">₹{tier.price}</span>
                    <span className="text-sm pb-1 font-medium opacity-60">/mo</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8 flex-1">
                  {["E2E Encryption", i > 0 ? "AI Security Audits" : "Basic Security", i > 0 ? "Cross-Platform Sync" : "Web Only", i === 2 ? "24/7 Priority Support" : "Standard Support"].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm font-medium">
                      <CheckCircle2 size={16} className={hoveredTier === i && !tier.current ? 'text-[#D4C9BE]' : 'text-[#123458]'} />
                      <span className={hoveredTier === i && !tier.current ? 'text-[#F1EFEC]' : 'text-[#123458]/80'}>{feat}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  disabled={tier.current}
                  className={`w-full py-4 rounded-xl font-black text-sm transition-all ${
                    tier.current ? 'bg-transparent border-2 border-[#123458]/20 text-[#123458]/50 cursor-not-allowed' :
                    hoveredTier === i ? 'bg-[#F1EFEC] text-[#123458] hover:bg-white shadow-lg' : 'bg-[#123458] text-[#F1EFEC] hover:opacity-90 shadow-lg'
                  }`}
                >
                  {tier.current ? 'Current Plan' : 'Upgrade Now'}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StoragePage;