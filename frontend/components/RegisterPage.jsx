import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for Routing
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ChevronLeft, 
  Sun, 
  Moon, 
  CreditCard, 
  CheckCircle2, 
  Shield, 
  Zap, 
  Building2,
  Calendar,
  LockKeyhole,
  Info,
  ShieldAlert
} from 'lucide-react';

const RegisterPage = ({ onRegisterSuccess, isDarkMode, toggleTheme }) => {
  const navigate = useNavigate(); // Initialize navigator
  const [step, setStep] = useState('account');
  const [selectedPlan, setSelectedPlan] = useState(1); // Default to Professional
  const [loading, setLoading] = useState(false);

  const pricingTiers = [
    { name: "Personal", price: 0, icon: User, features: ["1GB Storage", "Basic Security"] },
    { name: "Professional", price: 600, icon: Zap, features: ["50GB Storage", "AI Security", "Priority Support"] },
    { name: "Enterprise", price: 2000, icon: Building2, features: ["Unlimited", "Hardware Keys", "SSO"] }
  ];

  const handleNextStep = () => {
    if (step === 'account') {
      setStep('plan');
    } else if (step === 'plan') {
      if (pricingTiers[selectedPlan].price > 0) {
        setStep('payment');
      } else {
        completeRegistration();
      }
    } else if (step === 'payment') {
      completeRegistration();
    }
  };

  const completeRegistration = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onRegisterSuccess();
      navigate('/dashboard'); // Route to dashboard upon success
    }, 2000);
  };

  const getStepBranding = () => {
    switch(step) {
      case 'account':
        return {
          tag: "Identity Protocol",
          title: "Claim your space in the vault.",
          desc: "Create your decentralized profile in seconds. Your identity is protected by advanced E2E encryption.",
          icon: <User size={40} className="text-[#123458]" />
        };
      case 'plan':
        return {
          tag: "Scaling Access",
          title: "Choose your level of protection.",
          desc: "From personal archives to enterprise-grade governance. Pick the tier that matches your security.",
          icon: <Zap size={40} className="text-[#123458]" />
        };
      case 'payment':
        return {
          tag: "Secure Settlement",
          title: "Finalizing your digital sanctum.",
          desc: "Your billing info is never stored on our servers. We use PCI-DSS bridges to ensure zero leakage.",
          icon: <ShieldCheck size={40} className="text-[#123458]" />
        };
      default:
        return {};
    }
  };

  const branding = getStepBranding();
  const labelClass = "text-[12px] font-black uppercase tracking-widest text-[#123458]/100 ml-1 mb-1.5 block";
  const inputContainerClass = "relative group";
  const inputClass = "w-full bg-[#D4C9BE]/10 border-2 border-[#D4C9BE] rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-4 focus:ring-[#123458]/5 focus:border-[#123458] transition-all font-semibold text-[#030303] shadow-inner placeholder:text-[#123458]/30";
  const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 text-[#D4C9BE] group-focus-within:text-[#123458] transition-colors duration-300";

  return (
<div className="min-h-screen w-full flex flex-col md:flex-row bg-[#F1EFEC] text-[#030303] font-inter transition-colors duration-500 animate-page-smooth overflow-y-auto">      
      {/* --- Visual Side (Deep Navy) --- */}
      <div className="hidden md:flex flex-col justify-between w-[35%] lg:w-[40%] bg-[#123458] p-12 relative overflow-hidden text-[#F1EFEC] shadow-2xl">
        <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] bg-[#D4C9BE]/10 blur-[80px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#F1EFEC]/5 blur-[100px] rounded-full"></div>

        <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group z-10 w-fit">
          <div className="bg-[#F1EFEC] p-2.5 rounded-2xl shadow-xl shadow-black/20 text-[#123458] group-hover:scale-110 transition-transform">
            <ShieldCheck size={28} strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-black tracking-wideest font-serif">Vault.io</span>
        </div>

        <div className="z-10 space-y-8 animate-content-smooth" key={step}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1EFEC]/10 border border-[#D4C9BE]/30 text-[10px] font-black uppercase tracking-[0.3em]">
            <Zap size={12} className="animate-pulse" />
            {branding.tag}
          </div>
          <div className="space-y-4">
            <h1 className="text-6xl font-black leading-[1.1] tracking-wider font-serif">{branding.title}</h1>
            <p className="text-[#D4C9BE]/80 text-lg font-medium max-w-sm leading-relaxed">{branding.desc}</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="p-4 bg-[#F1EFEC] rounded-2xl shadow-xl">{branding.icon}</div>
             <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4C9BE]">
               Step {step === 'account' ? '1' : step === 'plan' ? '2' : '3'} of 3
             </div>
          </div>
        </div>

        <div className="z-10 flex flex-col gap-6">
           <p className="text-[10px] font-bold text-[#D4C9BE]/40 uppercase tracking-[0.2em]">Verified Security System &copy; 2026</p>
        </div>
      </div>

      {/* --- Form Side (Bone) --- */}
    <div className="flex-1 flex flex-col relative bg-[#F1EFEC] p-8 md:p-12 lg:p-20 py-24 min-h-screen justify-center">
        
        {/* Controls */}
        <div className="absolute top-8 right-8 flex items-center gap-4 z-50">
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 bg-[#D4C9BE]/30 border border-[#D4C9BE] rounded-xl text-[#123458] transition-all font-black text-[10px] uppercase tracking-widest hover:bg-[#D4C9BE]/100 active:scale-95 shadow-sm"
          >
            Log In
          </button>
        </div>

        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#D4C9BE]/30">
          <div className="h-full bg-[#123458] transition-all duration-700 ease-in-out" style={{ width: step === 'account' ? '33%' : step === 'plan' ? '66%' : '100%' }}></div>
        </div>

       <div className="w-full max-w-xl mx-auto space-y-8 animate-content-smooth">
          <div className="space-y-2">
            <h2 className="text-5xl font-black text-[#123458] tracking-wider font-serif">
              {step === 'account' ? 'Create Account' : step === 'plan' ? 'Select Plan' : 'Secure Billing'}
            </h2>
            <p className="text-[#123458]/60 font-medium">Please provide the necessary details below.</p>
          </div>

          <div className="min-h-[380px] flex flex-col justify-center">
            {step === 'account' && (
              <div className="space-y-5 animate-content-smooth">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Full Name</label>
                    <div className={inputContainerClass}>
                      <User className={iconClass} size={18} />
                      <input type="text" placeholder="Alex Morgan" className={inputClass} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Email</label>
                    <div className={inputContainerClass}>
                      <Mail className={iconClass} size={18} />
                      <input type="email" placeholder="alex@vault.io" className={inputClass} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Password</label>
                    <div className={inputContainerClass}>
                      <Lock className={iconClass} size={18} />
                      <input type="password" placeholder="••••••••••••" className={inputClass} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Confirm Password</label>
                    <div className={inputContainerClass}>
                      <ShieldAlert className={iconClass} size={18} />
                      <input type="password" placeholder="••••••••••••" className={inputClass} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 'plan' && (
              <div className="space-y-4 animate-content-smooth">
                {pricingTiers.map((tier, i) => (
                  <button 
                    key={i}
                    onClick={() => setSelectedPlan(i)}
                    className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all group relative overflow-hidden ${
                      selectedPlan === i 
                        ? 'border-[#123458] bg-white ring-4 ring-[#123458]/5 shadow-md' 
                        : 'border-[#D4C9BE]/30 bg-[#D4C9BE]/10 hover:border-[#D4C9BE] shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedPlan === i ? 'bg-[#123458] text-[#F1EFEC] shadow-lg' : 'bg-[#D4C9BE]/30 text-[#123458]/50'}`}>
                        <tier.icon size={22} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-black text-[#123458]">{tier.name}</h4>
                        <div className="flex gap-2 mt-1">
                          {tier.features.map((f, idx) => (
                            <span key={idx} className="text-[9px] font-black uppercase text-[#123458]/40 border border-[#D4C9BE]/30 px-2 py-0.5 rounded-md">{f}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-xl font-black ${selectedPlan === i ? 'text-[#123458]' : 'text-[#123458]/40'}`}>₹{tier.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-6 animate-content-smooth">
                <div className="bg-[#123458] p-6 rounded-3xl text-[#F1EFEC] flex justify-between items-center shadow-xl border border-white/5 relative">
                   <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Selected Plan</p>
                     <p className="text-xl font-black">{pricingTiers[selectedPlan].name} Tier</p>
                   </div>
                   <div className="text-right">
                     <p className="text-2xl font-black">₹{pricingTiers[selectedPlan].price}.00</p>
                     <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Charged Monthly</p>
                   </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Card Information</label>
                    <div className={inputContainerClass}>
                      <CreditCard className={iconClass} size={18} />
                      <input type="text" placeholder="0000 0000 0000 0000" className={inputClass} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="MM / YY" className={inputClass.replace('pl-12', 'pl-6')} />
                    <input type="text" placeholder="CVC" className={inputClass.replace('pl-12', 'pl-6')} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 pt-4">
            {step !== 'account' && (
              <button 
                onClick={() => setStep(step === 'payment' ? 'plan' : 'account')}
                className="p-5 bg-[#D4C9BE]/30 text-[#123458] rounded-2xl hover:bg-[#D4C9BE]/50 transition-all border border-[#D4C9BE] shadow-sm active:scale-95"
              >
                <ChevronLeft size={24} strokeWidth={3} />
              </button>
            )}
            <button 
              disabled={loading}
              onClick={handleNextStep}
              className="flex-1 group relative bg-[#123458] hover:opacity-95 text-[#F1EFEC] py-5 px-8 rounded-2xl font-black text-lg transition-all shadow-xl shadow-[#123458]/20 active:scale-[0.98] disabled:opacity-50 hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] transition-transform"></div>
              <div className="flex items-center justify-center gap-4 relative z-10">
                {loading ? (
                  <div className="w-6 h-6 border-[3px] border-[#F1EFEC]/30 border-t-[#F1EFEC] rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="tracking-wide">{step === 'payment' ? 'Secure Finalization' : 'Proceed Forward'}</span>
                    <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform duration-300" />
                  </>
                )}
              </div>
            </button>
          </div>

          <p className="text-center text-[#123458]/60 font-medium text-sm">
            Already a resident?
            <button 
              onClick={() => navigate('/login')}
              className="ml-2 text-[#123458] font-black hover:underline focus:outline-none"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;