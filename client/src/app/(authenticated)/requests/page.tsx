'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getRequests } from '@/lib/api';
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
const URGENCY_COLORS: Record<string, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444',
};

export default function RequestsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getRequests(token, filters).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [token, filters]);

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-theme-primary">My Requests</h1>
        <Link href="/requests/new" className="btn-accent">New Request</Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <select className="input-field w-auto" value={filters.status || ''} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || '' }))}>
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="input-field w-auto" value={filters.type || ''} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value || '' }))}>
            <option value="">All Types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        {loading ? (
          <div className="p-6"><p className="text-theme-muted">Loading...</p></div>
        ) : data?.data?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-table-head">
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">#</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Title</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Type</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Urgency</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Status</th>
                  <th className="text-left px-4 py-3 text-theme-muted font-semibold">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((r: any) => (
                  <tr key={r.id} className="border-t border-theme hover:bg-card-hover-surface transition-colors">
                    <td className="px-4 py-3"><Link href={`/requests/${r.id}`} className="text-accent font-semibold hover:underline">{r.request_number}</Link></td>
                    <td className="px-4 py-3 text-theme-primary font-medium">{r.title}</td>
                    <td className="px-4 py-3"><span className="badge" style={{ background: 'var(--bg-card-hover)', color: 'var(--text-secondary)' }}>{TYPE_LABELS[r.request_type] || r.request_type}</span></td>
                    <td className="px-4 py-3"><span className="badge" style={{ background: `${URGENCY_COLORS[r.urgency]}20`, color: URGENCY_COLORS[r.urgency] }}>{r.urgency}</span></td>
                    <td className="px-4 py-3"><span className="badge" style={{ background: `${STATUS_COLORS[r.status]}20`, color: STATUS_COLORS[r.status] }}>{STATUS_LABELS[r.status] || r.status}</span></td>
                    <td className="px-4 py-3 text-theme-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6"><p className="text-theme-muted">No requests found.</p></div>
        )}
      </div>
    </div>
  );
}
