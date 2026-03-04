'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getRequests } from '@/lib/api';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  manager_review: '#f59e0b', it_review: '#8b5cf6',
};
const URGENCY_COLORS: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
};
const TYPE_LABELS: Record<string, string> = {
  hardware: 'Hardware', software: 'Software', permission: 'Permission', access: 'Access', other: 'Other',
};

export default function ReviewPage() {
  const { token, user } = useAuth();
  const [managerRequests, setManagerRequests] = useState<any[]>([]);
  const [itRequests, setItRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const promises: Promise<any>[] = [];
    if (user?.role === 'manager' || user?.role === 'it_admin') {
      promises.push(getRequests(token, { status: 'manager_review', limit: '50' }).then((r) => setManagerRequests(r.data)));
    }
    if (user?.role === 'it_admin') {
      promises.push(getRequests(token, { status: 'it_review', limit: '50' }).then((r) => setItRequests(r.data)));
    }
    Promise.all(promises).catch(console.error).finally(() => setLoading(false));
  }, [token, user]);

  if (loading) return <div className="animate-fade-in-up"><div className="card"><p className="text-theme-muted">Loading...</p></div></div>;

  function RequestTable({ title, requests, color }: { title: string; requests: any[]; color: string }) {
    return (
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full" style={{ background: color }} />
          <h2 className="text-lg font-bold text-theme-primary">{title}</h2>
          <span className="badge" style={{ background: `${color}20`, color }}>{requests.length}</span>
        </div>
        {requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-table-head">
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">#</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Requester</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Title</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Type</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Urgency</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r: any) => (
                  <tr key={r.id} className="border-t border-theme hover:bg-card-hover-surface transition-colors">
                    <td className="px-4 py-3"><Link href={`/requests/${r.id}`} className="text-accent font-semibold hover:underline">{r.request_number}</Link></td>
                    <td className="px-4 py-3 text-theme-primary">{r.requester_name}</td>
                    <td className="px-4 py-3 text-theme-primary font-medium">{r.title}</td>
                    <td className="px-4 py-3"><span className="badge" style={{ background: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}>{TYPE_LABELS[r.request_type] || r.request_type}</span></td>
                    <td className="px-4 py-3"><span className="badge" style={{ background: `${URGENCY_COLORS[r.urgency]}20`, color: URGENCY_COLORS[r.urgency] }}>{r.urgency}</span></td>
                    <td className="px-4 py-3 text-theme-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-theme-muted">No pending requests.</p>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      <h1 className="text-2xl font-extrabold text-theme-primary">Pending Review</h1>
      {(user?.role === 'manager' || user?.role === 'it_admin') && (
        <RequestTable title="Manager Review" requests={managerRequests} color="#f59e0b" />
      )}
      {user?.role === 'it_admin' && (
        <RequestTable title="IT Review" requests={itRequests} color="#8b5cf6" />
      )}
    </div>
  );
}
