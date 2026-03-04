'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getDashboard } from '@/lib/api';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8', submitted: '#3b82f6', manager_review: '#f59e0b', it_review: '#8b5cf6',
  approved: '#22c55e', denied: '#ef4444', in_progress: '#06b6d4', completed: '#10b981', cancelled: '#6b7280',
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', manager_review: 'Manager Review', it_review: 'IT Review',
  approved: 'Approved', denied: 'Denied', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
};
const TYPE_LABELS: Record<string, string> = {
  hardware: 'Hardware', software: 'Software', permission: 'Permission', access: 'Access', other: 'Other',
};

export default function DashboardPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'it_admin') { router.replace('/requests'); return; }
    if (!token) return;
    getDashboard(token).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [token, user, router]);

  if (loading) return <div className="animate-fade-in-up"><div className="card"><p className="text-theme-muted">Loading...</p></div></div>;

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-theme-primary">Dashboard</h1>
          <p className="text-sm text-theme-muted mt-1">Welcome back, {user?.name}</p>
        </div>
        <Link href="/requests/new" className="btn-accent">New Request</Link>
      </div>

      {/* Stats cards */}
      {(user?.role === 'manager' || user?.role === 'it_admin') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user?.role === 'it_admin' && (
            <div className="card">
              <p className="text-sm text-theme-muted font-semibold">Pending IT Review</p>
              <p className="text-3xl font-extrabold mt-1" style={{ color: '#8b5cf6' }}>{data?.pendingItReview || 0}</p>
            </div>
          )}
          <div className="card">
            <p className="text-sm text-theme-muted font-semibold">Pending Manager Review</p>
            <p className="text-3xl font-extrabold mt-1" style={{ color: '#f59e0b' }}>{data?.pendingManagerReview || 0}</p>
          </div>
          <div className="card">
            <p className="text-sm text-theme-muted font-semibold">Total Requests</p>
            <p className="text-3xl font-extrabold mt-1 text-theme-primary">{Object.values(data?.statusCounts || {}).reduce((a: number, b: any) => a + b, 0)}</p>
          </div>
        </div>
      )}

      {/* Status breakdown */}
      <div className="card">
        <h2 className="text-lg font-bold text-theme-primary mb-4">Requests by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(data?.statusCounts || {}).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2 p-3 rounded-lg" style={{ background: 'var(--bg-card-hover)' }}>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[status] || '#94a3b8' }} />
              <div>
                <p className="text-xs text-theme-muted">{STATUS_LABELS[status] || status}</p>
                <p className="text-lg font-bold text-theme-primary">{count as number}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Type breakdown */}
      <div className="card">
        <h2 className="text-lg font-bold text-theme-primary mb-4">Requests by Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(data?.typeCounts || {}).map(([type, count]) => (
            <div key={type} className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-card-hover)' }}>
              <p className="text-xs text-theme-muted">{TYPE_LABELS[type] || type}</p>
              <p className="text-2xl font-bold text-theme-primary">{count as number}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent requests */}
      <div className="card">
        <h2 className="text-lg font-bold text-theme-primary mb-4">Recent Requests</h2>
        {data?.recent?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-table-head">
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">#</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Title</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Type</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((r: any) => (
                  <tr key={r.id} className="border-t border-theme hover:bg-card-hover-surface transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/requests/${r.id}`} className="text-accent font-semibold hover:underline">{r.request_number}</Link>
                    </td>
                    <td className="px-4 py-3 text-theme-primary font-medium">{r.title}</td>
                    <td className="px-4 py-3"><span className="badge" style={{ background: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}>{TYPE_LABELS[r.request_type] || r.request_type}</span></td>
                    <td className="px-4 py-3"><span className="badge" style={{ background: `${STATUS_COLORS[r.status]}20`, color: STATUS_COLORS[r.status] }}>{STATUS_LABELS[r.status] || r.status}</span></td>
                    <td className="px-4 py-3 text-theme-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-theme-muted text-sm">No requests yet. <Link href="/requests/new" className="text-accent hover:underline">Create one</Link></p>
        )}
      </div>
    </div>
  );
}
