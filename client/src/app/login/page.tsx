'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { getTestUsers } from '@/lib/api';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [testUsers, setTestUsers] = useState<{ email: string; name: string; role: string }[]>([]);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    getTestUsers().then(setTestUsers).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="card w-full max-w-md animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center font-extrabold text-base"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>
              IT
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-theme-primary">IT<span className="text-accent">Requests</span></h1>
              <p className="text-xs text-theme-muted">Service Request Portal</p>
            </div>
          </div>
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-card-hover-surface transition-colors" title="Toggle theme">
            {theme === 'dark' ? (
              <svg className="w-5 h-5 text-theme-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-theme-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-theme-secondary mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="your.email@facility.local" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-theme-secondary mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" placeholder="Enter your password" required />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {testUsers.length > 0 && (
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
            <p className="text-xs font-bold text-theme-muted uppercase tracking-wider mb-2">Quick Login (Dev)</p>
            <div className="space-y-1">
              {testUsers.map((u) => (
                <button key={u.email} onClick={() => { setEmail(u.email); setPassword('admin123!'); }}
                  className="block w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-card-hover-surface">
                  <span className="font-semibold text-theme-primary">{u.name}</span>
                  <span className="text-theme-muted ml-2">{u.role}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
