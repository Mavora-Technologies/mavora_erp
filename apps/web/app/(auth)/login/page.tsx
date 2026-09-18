'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck, Building2, Globe2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@mavoratech.com');
  const [password, setPassword] = useState('Mavora@2026!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed');
      }

      localStorage.setItem('mavora_token', data.data.token);
      localStorage.setItem('mavora_user', JSON.stringify(data.data.user));

      router.push('/');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-gray-100">
      
      {/* Left Branding / Context Panel */}
      <div className="lg:col-span-5 bg-mavora-navy p-10 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-mavora-blue/20 rounded-full blur-3xl pointer-events-none" />
        
        <div>
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 rounded-lg bg-mavora-blue flex items-center justify-center font-bold text-lg shadow-md">
              M
            </div>
            <span className="text-xl font-extrabold tracking-wider">MAVORA ERP</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight mb-4 leading-tight">
            Enterprise Resource Planning.
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-8">
            Modular multi-tenant platform built for seamless operations, KES tax compliance, and automated workflows across East Africa.
          </p>
        </div>

        <div className="space-y-4 pt-6 border-t border-white/10 text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-mavora-teal shrink-0" />
            <span>Role-Based Access Control (RBAC) Enabled</span>
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="w-4 h-4 text-mavora-blue shrink-0" />
            <span>Mavora Technologies Ltd &copy; 2026</span>
          </div>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="lg:col-span-7 p-10 lg:p-12 flex flex-col justify-center bg-white">
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-mavora-navy tracking-tight">Welcome Back</h3>
          <p className="text-sm text-gray-500 mt-1">Please enter your credentials to access your portal.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Work Email
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mavoratech.com"
                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-300 rounded-lg text-sm text-mavora-charcoal focus:outline-none focus:ring-2 focus:ring-mavora-blue focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                Password
              </label>
              <a href="#" className="text-xs text-mavora-blue hover:underline font-medium">
                Forgot password?
              </a>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-300 rounded-lg text-sm text-mavora-charcoal focus:outline-none focus:ring-2 focus:ring-mavora-blue focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-mavora-blue hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Secure 256-bit SSL Session</span>
          <span className="flex items-center gap-1">
            <Globe2 className="w-3.5 h-3.5" /> Nairobi, Kenya
          </span>
        </div>
      </div>

    </div>
  );
}