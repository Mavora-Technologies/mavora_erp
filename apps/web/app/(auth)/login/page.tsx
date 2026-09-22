'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Cpu, 
  Code2, 
  Globe, 
  Smartphone, 
  ShieldAlert, 
  Cloud, 
  BarChart3, 
  Zap,
  Eye,
  EyeOff,
  ArrowUpRight
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
const OFFICIAL_WEBSITE = 'https://mavoratechnologies.com/';

const MAVORA_SERVICES = [
  { title: 'AI & Automation', description: 'Workflow automation, chatbots, predictive analytics, and custom AI tools.', icon: Cpu },
  { title: 'Software Development', description: 'Enterprise ERPs, CRMs, POS platforms, and robust custom business systems.', icon: Code2 },
  { title: 'Web Development', description: 'High-performance, dynamic, SEO-optimized web applications and corporate portals.', icon: Globe },
  { title: 'Mobile Applications', description: 'Native and cross-platform mobile solutions for iOS and Android.', icon: Smartphone },
  { title: 'Cybersecurity', description: 'Vulnerability assessments, network defense, threat monitoring, and data safety.', icon: ShieldAlert },
  { title: 'Cloud & IT Solutions', description: 'Cloud migration, infrastructure management, data backups, and IT support.', icon: Cloud },
  { title: 'Data Analytics', description: 'Business intelligence dashboards, KPI tracking, and data visualization.', icon: BarChart3 },
  { title: 'Digital Transformation', description: 'Strategic consulting to modernize legacy systems and operations.', icon: Zap },
];

export default function LoginPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [activeService, setActiveService] = useState(0);

  // Smooth rotation for capabilities showcase
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveService((prev) => (prev + 1) % MAVORA_SERVICES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed. Please verify your credentials.');
      }

      localStorage.setItem('mavora_token', data.data.token);
      localStorage.setItem('mavora_user', JSON.stringify(data.data.user));
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 lg:p-8 bg-[#F8FAFC] relative overflow-hidden font-sans">
      
      {/* Subtle Corporate Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#075BFF]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] -right-[10%] w-[40%] h-[40%] bg-[#19D3C5]/5 rounded-full blur-[120px]" />
      </div>

      {/* Main Authentication Container */}
      <div className="w-full max-w-6xl bg-white rounded-2xl md:rounded-3xl shadow-[0_8px_30px_rgb(4,21,47,0.06)] overflow-hidden flex flex-col md:flex-row min-h-[640px] border border-[#E2E8F0] relative z-10">
        
        {/* Left Panel: Official Mavora Brand Showcase */}
        <div className="w-full md:w-1/2 bg-[#061A3A] p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden text-white shrink-0">
          
          {/* Brand Ribbon Aura Overlay */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#075BFF]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#19D3C5]/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Header Branding */}
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-3.5 mb-14">
                {/* Custom SVG Icon Matching Official Brand Emblem */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#075BFF] to-[#19D3C5] p-0.5 shadow-md shadow-[#075BFF]/20 shrink-0">
                  <div className="w-full h-full bg-[#04152F] rounded-[9px] flex items-center justify-center">
                    <span className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-[#075BFF] to-[#19D3C5]">
                      M
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-xl font-black tracking-wider text-white block leading-none mb-1">
                    MAVORA
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.22em] text-[#19D3C5] uppercase block leading-none">
                    TECHNOLOGIES
                  </span>
                </div>
              </div>
              
              <h2 className="text-3xl lg:text-[42px] font-light text-white leading-[1.15] tracking-tight">
                Innovate.<br />
                Build.<br />
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#075BFF] to-[#19D3C5]">
                  Transform.
                </span>
              </h2>
            </div>

            {/* Auto-Rotating Services Carousel */}
            <div className="relative z-10 h-[140px] mt-12 mb-6">
              {MAVORA_SERVICES.map((service, index) => {
                const Icon = service.icon;
                const isActive = index === activeService;
                
                return (
                  <div 
                    key={index}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out flex flex-col justify-center ${
                      isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2.5 text-[#19D3C5]">
                      <Icon className="w-5 h-5" />
                      <h3 className="text-xs font-bold tracking-wider uppercase">{service.title}</h3>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
                      {service.description}
                    </p>
                    <a 
                      href={OFFICIAL_WEBSITE} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-[#075BFF] hover:text-[#19D3C5] transition-colors w-fit group"
                    >
                      <span>Explore Mavora</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                );
              })}
              
              {/* Brand Progress Bars */}
              <div className="absolute -bottom-2 left-0 flex items-center gap-1.5">
                {MAVORA_SERVICES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveService(idx)}
                    className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === activeService ? 'w-8 bg-[#19D3C5]' : 'w-2 bg-[#04152F] hover:bg-slate-700'
                    }`}
                    aria-label={`Go to capability ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex items-center justify-between text-[11px] text-[#64748B] font-medium tracking-wide uppercase pt-6 border-t border-slate-700/50 mt-4">
              <span>&copy; {new Date().getFullYear()} Mavora Technologies</span>
              <span className="flex items-center gap-1.5 text-[#19D3C5]">
                <ShieldCheck className="w-3.5 h-3.5" /> Enterprise SSL
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Clean Enterprise Authentication */}
        <div className="w-full md:w-1/2 bg-white p-8 lg:p-14 flex flex-col justify-center relative">
          <div className="w-full max-w-[380px] mx-auto">
            
            <div className="mb-8">
              <h1 className="text-2xl font-extrabold text-[#061A3A] tracking-tight">Enterprise Access</h1>
              <p className="text-sm text-[#64748B] mt-1.5 font-medium">Sign in with your organizational account to proceed.</p>
            </div>

            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in duration-300">
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <span className="text-xs text-[#DC2626] font-medium leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#061A3A] mb-1.5">
                  Work Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="w-4 h-4 text-[#64748B] group-focus-within:text-[#075BFF] transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@mavoratech.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#061A3A] placeholder:text-[#64748B] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#075BFF]/20 focus:border-[#075BFF] focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#061A3A]">
                    Password
                  </label>
                  <a 
                    href={OFFICIAL_WEBSITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#075BFF] hover:text-[#087CFF] transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-[#64748B] group-focus-within:text-[#075BFF] transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm font-medium text-[#061A3A] placeholder:text-[#64748B] placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#075BFF]/20 focus:border-[#075BFF] focus:bg-white transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#64748B] hover:text-[#061A3A] transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#075BFF] hover:bg-[#087CFF] text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-md shadow-[#075BFF]/20 disabled:opacity-70 disabled:cursor-not-allowed mt-6 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B] font-semibold">
              <span>Secure RBAC Authentication</span>
              <a href={OFFICIAL_WEBSITE} target="_blank" rel="noopener noreferrer" className="hover:text-[#061A3A] transition-colors flex items-center gap-1">
                Corporate Site &rarr;
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}