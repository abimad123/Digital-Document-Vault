import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for Routing
import { 
  ShieldCheck, Lock, Zap, Globe, CheckCircle2, ArrowRight, Fingerprint, Sparkles, Building2, Activity, Quote,
  Sun, Moon, User, Menu, X, ChevronDown, Cloud, Share2, ShieldAlert, FileText, Shield, Search, CheckCircle, HelpCircle, MessageSquare, CreditCard, Rocket, ChevronLeft, ChevronRight, Terminal, Server
} from 'lucide-react';
import Footer from '../components/Footer';

const Welcome = ({ onLogin, isDarkMode, toggleTheme }) => {
  const navigate = useNavigate(); // Initialize navigator
  const [isYearly, setIsYearly] = useState(true);
  const [hoveredTier, setHoveredTier] = useState(1);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(2);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  const pricingTiers = [
    { name: "Personal", price: 0, icon: User, color: "navy" },
    { name: "Professional", price: isYearly ? 300 : 600, icon: Zap, color: "navy" },
    { name: "Enterprise", price: 2000, icon: Building2, color: "navy" }
  ];

  const faqs = [
    {
      q: "What is VaultX?",
      a: "VaultX is a military-grade digital sovereign sanctum designed to protect your most sensitive documents through advanced client-side encryption and zero-knowledge storage protocols."
    },
    {
      q: "What does VaultX Premium offer?",
      a: "Premium provides 50GB of secure storage, AI-powered security auditing, biometric hardware key support, multi-device synchronization, and priority recovery services for elite users."
    },
    {
      q: "What is the benefit of end-to-end encryption?",
      a: "End-to-end encryption grants security and data ownership to the users. It ensures that their data remains private and inaccessible to anyone without appropriate authentication."
    },
    {
      q: "What platforms is VaultX available on?",
      a: "We are available as a secure Web platform, mobile apps for iOS and Android, and native desktop applications for Windows, macOS, and Linux to ensure your vault is always within reach."
    },
    {
      q: "What security methods does VaultX use?",
      a: "We utilize AES-256 for data at rest, TLS 1.3 for data in transit, and Argon2 for secure key derivation. We also strictly support FIDO2/WebAuthn for hardware-level biometric authentication."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F1EFEC] text-[#030303] selection:bg-[#123458]/30 overflow-x-hidden font-inter transition-colors duration-300"> 
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 border-b ${isScrolled ? 'bg-[#F1EFEC]/80 backdrop-blur-xl border-[#D4C9BE] shadow-sm py-3' : 'bg-transparent border-transparent py-2'}`}>
        <div className="max-w-vault mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-12">
            
            {/* --- 1. DESKTOP LOGO UPDATE --- */}
            <div 
              onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img 
                src="/logo.png" 
                alt="VaultX Logo" 
               className="h-16 w-auto object-contain scale-150 ml-2"// Adjust h-10 to match your preferred size
              />
            </div>

            <div className="hidden lg:flex items-center gap-8 text-sm font-bold">
              {/* Home is now the Active Button (Full Navy) */}
              <button 
                onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                className="text-[#123458] transition-colors"
              >
                Home
              </button>

              {/* Features is Muted */}
              <button 
                onClick={() => navigate('/features')} 
                className="text-[#123458]/70 hover:text-[#123458] transition-colors"
              >
                Features
              </button>

              {/* FAQ is Muted */}
              <button 
                onClick={() => {
                  navigate('/'); // Go to Welcome page
                  setTimeout(() => {
                    const element = document.getElementById('faq');
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                  }, 100); // Small delay to ensure component is mounted
                }} 
                className="text-[#123458]/70 hover:text-[#123458] transition-colors"
              >
                FAQ
              </button>

              {/* Contact is now Muted (70% opacity) */}
              <button 
                onClick={() => { navigate('/contact'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                className="text-[#123458]/70 hover:text-[#123458] transition-colors"
              >
                Contact
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => navigate('/login')} className="px-5 py-2.5 text-sm font-bold text-[#123458] hover:opacity-70 transition-colors">Login</button>
              <button onClick={() => navigate('/register')} className="bg-[#123458] text-[#F1EFEC] px-7 py-2.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-[#123458]/20 active:scale-95">Register</button>
            </div>

            <button className="lg:hidden p-2 text-[#123458] focus:outline-none" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={`fixed inset-0 z-[60] bg-[#F1EFEC] transition-all duration-500 lg:hidden ${isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
          <div className="flex items-center justify-between px-6 py-6 border-b border-[#D4C9BE] bg-[#F1EFEC]">
            
            {/* --- 2. MOBILE MENU LOGO UPDATE --- */}
            <div onClick={() => { setIsMenuOpen(false); navigate('/'); }} className="flex items-center gap-2 cursor-pointer">
               <img 
                src="/logo.png" 
                alt="VaultX Logo" 
                className="h-10 w-auto object-contain" 
              />
            </div>
            
            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-[#123458] bg-[#D4C9BE]/20 rounded-xl transition-colors">
              <X size={28} />
            </button>
          </div>

          <div className="flex flex-col h-[calc(100vh-80px)] overflow-y-auto px-6 py-10 space-y-8">
            <div className="flex flex-col space-y-2">
              {[
                { label: 'Home', icon: CreditCard, path: '/' },
                { label: 'Features', icon: Sparkles, path: '/features' },
                { label: 'FAQ', icon: HelpCircle, path: '/' },
                { label: 'Contact', icon: MessageSquare, path: '/contact' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => { setIsMenuOpen(false); navigate(item.path); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="group flex items-center justify-between w-full p-4 rounded-2xl bg-[#D4C9BE]/10 hover:bg-[#D4C9BE]/30 transition-all border border-transparent hover:border-[#D4C9BE]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F1EFEC] flex items-center justify-center text-[#123458] shadow-sm">
                      <item.icon size={22} />
                    </div>
                    <span className="text-xl font-bold text-[#030303] group-hover:text-[#123458] transition-colors">{item.label}</span>
                  </div>
                  <ArrowRight size={20} className="text-[#D4C9BE] group-hover:text-[#123458] group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            <div className="h-[1px] bg-[#D4C9BE]" />

            <div className="flex flex-col space-y-4">
              <button onClick={() => { setIsMenuOpen(false); navigate('/login'); }} className="flex items-center justify-center gap-3 w-full py-5 rounded-2xl font-bold text-xl text-[#123458] bg-[#D4C9BE]/20 hover:bg-[#D4C9BE]/40 transition-all">
                <User size={20} /> Login
              </button>
              <button onClick={() => { setIsMenuOpen(false); navigate('/register'); }} className="flex items-center justify-center gap-3 w-full py-5 rounded-2xl font-black text-xl text-[#F1EFEC] bg-[#123458] hover:opacity-90 transition-all shadow-xl shadow-[#123458]/30">
                <Rocket size={20} /> Get Started Free
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#123458]/5 blur-[180px] rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#D4C9BE]/20 blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-vault mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
          <div className="space-y-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-[#123458]/5 border border-[#D4C9BE] text-[10px] md:text-xs font-black text-[#123458] uppercase tracking-[0.4em] backdrop-blur-3xl animate-page-smooth">
              <div className="w-2 h-2 rounded-full bg-[#123458] animate-pulse"></div>
              Vault Status: Optimal Security Clearance
            </div>

            <div className="space-y-6">
              <h1 className="text-6xl md:text-8xl font-black text-[#123458] tracking-normalest leading-[0.95] animate-page-smooth font-serif">
                Your Digital <br />
                <span className="text-[#030303]">Legacy, Under <br /> Absolute Lock.</span>
              </h1>
              <p className="text-xl md:text-2xl text-[#123458]/70 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium animate-content-smooth">
                Experience the world's first zero-knowledge document sanctum. Built for those who demand absolute sovereign privacy.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-6 animate-content-smooth">
              <button onClick={() => navigate('/register')} className="group relative w-full sm:w-auto overflow-hidden bg-[#123458] text-[#F1EFEC] px-12 py-6 rounded-2xl font-black text-xl hover:opacity-90 transition-all shadow-2xl shadow-[#123458]/40 hover:-translate-y-1 active:scale-95">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shine_1s_infinite] transition-transform"></div>
                <div className="flex items-center justify-center gap-3 relative z-10">
                  Begin Enrollment <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={24} />
                </div>
              </button>
              <button onClick={() => navigate('/features')} className="w-full sm:w-auto px-10 py-6 bg-transparent border border-[#D4C9BE] text-[#123458] rounded-2xl font-bold text-xl hover:bg-[#D4C9BE]/10 transition-all">
                Learn More
              </button>
            </div>
          </div>

          <div className="relative group hidden lg:block">
            <div className="relative w-full aspect-square flex items-center justify-center animate-page-smooth">
              <div className="absolute inset-0 bg-[#D4C9BE]/30 blur-[120px] rounded-full"></div>
              <div className="relative z-30 bg-[#F1EFEC]/40 backdrop-blur-3xl border border-[#D4C9BE]/50 p-6 rounded-[3.5rem] shadow-2xl group-hover:scale-[1.02] transition-transform duration-1000 rotate-1 group-hover:rotate-0 overflow-hidden">
                <div className="w-100 h-[580px] flex flex-col items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#123458]/5 to-transparent pointer-events-none z-10" />
                  <div className="relative w-full h-full rounded-4xl overflow-hidden border-2 border-[#D4C9BE] bg-[#F1EFEC] shadow-inner">
                    <img src="/heroimage.png" alt="Vault Interface" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out" />
                    <div className="absolute inset-0 bg-[#123458]/5 pointer-events-none"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MANAGE FILES SECTION */}
      <section className="py-24 px-6 bg-[#F1EFEC]">
        <div className="max-w-vault mx-auto text-center">
          <div className="max-w-5xl mx-auto mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-12 tracking-wider text-[#123458] font-serif">Manage files privately with confidence</h2>
            <p className="text-xl text-[#123458]/70 leading-relaxed font-medium">VaultX keeps your data accessible without compromising its security thanks to zero-knowledge architecture and limitless end-to-end encryption.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Encrypted cloud storage",
                desc: "Upload files to the cloud storage and sync it across your devices and platforms. Complete access control and saves space on your device.",
                icon: Cloud,
                illustration: (
                  <div className="relative w-48 h-48 bg-[#123458]/5 rounded-full flex items-center justify-center overflow-hidden">
                    <div className="absolute -bottom-4 bg-[#123458] w-32 h-32 rounded-3xl rotate-12 flex items-center justify-center shadow-xl"><User size={64} className="text-[#F1EFEC] -rotate-12" /></div>
                    <div className="absolute top-4 right-4 bg-[#F1EFEC] p-2 rounded-lg shadow-lg rotate-6 border border-[#D4C9BE]"><FileText size={24} className="text-[#123458]" /></div>
                  </div>
                )
              },
              {
                title: "Private file sharing",
                desc: "Share your encrypted files via email or a link with anyone. A unique code adds an extra layer of security to your items.",
                icon: Share2,
                illustration: (
                  <div className="relative w-48 h-48 bg-[#D4C9BE]/20 rounded-full flex items-center justify-center overflow-hidden">
                    <div className="bg-[#F1EFEC] w-24 h-44 rounded-2xl border-4 border-[#123458] shadow-2xl flex flex-col items-center justify-center relative">
                      <Lock size={32} className="text-[#123458]" />
                    </div>
                  </div>
                )
              },
              {
                title: "No leaks or stolen files",
                desc: "Keep your personal files for your eyes only. Your data is backed up and protected from unauthorized access and malware.",
                icon: ShieldAlert,
                illustration: (
                  <div className="relative w-48 h-48 bg-[#F1EFEC] border border-[#D4C9BE] rounded-full flex items-center justify-center">
                    <Shield size={64} className="text-[#123458] fill-[#123458]/5" />
                  </div>
                )
              }
            ].map((feature, i) => (
              <div key={i} className="bg-[#F1EFEC] border border-[#D4C9BE] rounded-[2.5rem] p-10 flex flex-col items-center text-center shadow-sm hover:shadow-xl transition-all duration-500 group">
                <div className="mb-10 transform group-hover:scale-110 transition-transform duration-500">{feature.illustration}</div>
                <h3 className="text-2xl font-black mb-4 text-[#123458] font-serif">{feature.title}</h3>
                <p className="text-[#123458]/60 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 bg-[#D4C9BE]/10 border-y border-[#D4C9BE]">
        <div className="max-w-vault mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black mb-12 text-[#123458] font-serif">Professional Tiers</h2>
            <div className="flex items-center justify-center gap-4 text-sm font-bold">
              <span className={!isYearly ? "text-[#123458]" : "text-[#123458]/40"}>Monthly</span>
              <button onClick={() => setIsYearly(!isYearly)} className="w-12 h-6 bg-[#D4C9BE] rounded-full p-1">
                <div className={`w-4 h-4 bg-[#123458] rounded-full transition-transform ${isYearly ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
              <span className={isYearly ? "text-[#123458]" : "text-[#123458]/40"}>Yearly <span className="text-[10px] bg-[#123458]/10 text-[#123458] px-2 py-0.5 rounded-full">-50%</span></span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {pricingTiers.map((tier, i) => (
              <div key={i} onMouseEnter={() => setHoveredTier(i)} className={`p-10 rounded-[2.5rem] flex flex-col transition-all duration-500 cursor-default ${hoveredTier === i ? 'bg-[#123458] text-[#F1EFEC] scale-105 shadow-2xl z-10' : 'bg-[#F1EFEC] text-[#030303] border border-[#D4C9BE]'}`}>
                <div className="mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${hoveredTier === i ? 'bg-white/10' : 'bg-[#123458]/5'}`}><tier.icon size={24} className={hoveredTier === i ? 'text-[#F1EFEC]' : 'text-[#123458]'} /></div>
                  <h3 className="text-xl font-black mb-2">{tier.name}</h3>
                  <span className="text-4xl font-black">₹{tier.price}</span><span className="text-sm">/mo</span>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {["E2E Encryption", "AI Security Audits", "Cross-Platform Sync", "Priority Support"].map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm font-medium"><CheckCircle2 size={16} className={hoveredTier === i ? 'text-[#D4C9BE]' : 'text-[#123458]'} />{feat}</li>
                  ))}
                </ul>
                <button onClick={() => navigate('/register')} className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${hoveredTier === i ? 'bg-[#F1EFEC] text-[#123458]' : 'bg-[#123458] text-[#F1EFEC]'}`}>Select Plan</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 px-6 bg-[#F1EFEC]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-center mb-12 text-[#123458] font-serif">Frequently asked questions</h2>
          <div className="border-t border-[#D4C9BE]/50 w-full">
            {faqs.map((faq, i) => (
              <div key={i} className="border-b border-[#D4C9BE]/50">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between py-6 text-left px-4 md:px-8 hover:bg-[#D4C9BE]/10">
                  <span className={`text-lg md:text-xl font-bold ${openFaq === i ? 'text-[#123458]' : 'text-[#123458]/80'}`}>{faq.q}</span>
                  <div className={`transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`}><ChevronDown size={20} /></div>
                </button>
                <div className={`overflow-hidden transition-all duration-500 ${openFaq === i ? 'max-h-[700px] opacity-100 pb-8' : 'max-h-0 opacity-0'}`}>
                  <div className="text-sm md:text-base text-[#123458]/70 leading-relaxed font-medium px-4 md:px-8 max-w-3xl">{faq.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Welcome; 