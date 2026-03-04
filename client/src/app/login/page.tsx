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
  const [selectedEmail, setSelectedEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [testUsers, setTestUsers] = useState<{ email: string; name: string; role: string }[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!loading && user) router.replace(user.role === 'it_admin' ? '/dashboard' : '/requests');
  }, [user, loading, router]);

  useEffect(() => {
    getTestUsers()
      .then((users) => {
        setTestUsers(users);
        if (users.length > 0) setSelectedEmail(users[0].email);
      })
      .catch((err) => setError('Cannot connect to server: ' + err.message))
      .finally(() => setLoadingUsers(false));
  }, []);

  async function handleLogin() {
    if (!selectedEmail) return;
    setError('');
    setSubmitting(true);
    try {
      await login(selectedEmail, 'admin123!');
      const selectedUser = testUsers.find((u) => u.email === selectedEmail);
      router.replace(selectedUser?.role === 'it_admin' ? '/dashboard' : '/requests');
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

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
            {error}
          </div>
        )}

        {loadingUsers ? (
          <p className="text-sm text-theme-muted">Connecting to server...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-theme-secondary mb-1.5">Select User</label>
              <select value={selectedEmail} onChange={(e) => setSelectedEmail(e.target.value)} className="input-field">
                {testUsers.map((u) => (
                  <option key={u.email} value={u.email}>
                    {u.name} ({u.role.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>

            {selectedEmail && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--bg-card-hover)' }}>
                <span className="text-theme-muted">Logging in as: </span>
                <span className="font-semibold text-theme-primary">{selectedEmail}</span>
              </div>
            )}

            <button onClick={handleLogin} disabled={submitting || !selectedEmail} className="btn-accent w-full">
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
