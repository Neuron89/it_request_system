'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getRequest, managerReview, itReview, updateRequestStatus, cancelRequest, addComment } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8', submitted: '#3b82f6', manager_review: '#f59e0b', it_review: '#8b5cf6',
  approved: '#22c55e', denied: '#ef4444', in_progress: '#06b6d4', completed: '#10b981', cancelled: '#6b7280',
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', manager_review: 'Manager Review', it_review: 'IT Review',
  approved: 'Approved', denied: 'Denied', in_progress: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
};

export default function RequestDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function load() {
    if (!token || !id) return;
    getRequest(token, parseInt(id as string)).then(setRequest).catch(console.error).finally(() => setLoading(false));
  }

  useEffect(load, [token, id]);

  async function handleManagerReview(decision: string) {
    if (!token || !id) return;
    setSubmitting(true);
    try {
      await managerReview(token, parseInt(id as string), { decision, notes: reviewNotes });
      setReviewNotes('');
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleItReview(decision: string) {
    if (!token || !id) return;
    setSubmitting(true);
    try {
      await itReview(token, parseInt(id as string), { decision, notes: reviewNotes });
      setReviewNotes('');
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (!token || !id) return;
    setSubmitting(true);
    try {
      await updateRequestStatus(token, parseInt(id as string), { status });
      load();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!token || !id || !confirm('Are you sure you want to cancel this request?')) return;
    try {
      await cancelRequest(token, parseInt(id as string));
      load();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleAddComment() {
    if (!token || !id || !commentText.trim()) return;
    try {
      await addComment(token, parseInt(id as string), commentText);
      setCommentText('');
      load();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div className="animate-fade-in-up"><div className="card"><p className="text-theme-muted">Loading...</p></div></div>;
  if (!request) return <div className="card"><p className="text-theme-muted">Request not found.</p></div>;

  const r = request;
  const canManagerReview = r.status === 'manager_review' && (user?.role === 'manager' || user?.role === 'it_admin');
  const canItReview = (r.status === 'it_review' || r.status === 'submitted') && user?.role === 'it_admin';
  const canCancel = !['completed', 'cancelled'].includes(r.status) && (r.requester_id === user?.id || user?.role === 'it_admin');
  const canChangeStatus = user?.role === 'it_admin' && ['approved', 'in_progress'].includes(r.status);

  return (
    <div className="animate-fade-in-up max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-accent hover:underline mb-1 block">&larr; Back</button>
          <h1 className="text-2xl font-extrabold text-theme-primary">{r.request_number}</h1>
          <p className="text-sm text-theme-muted">{r.title}</p>
        </div>
        <span className="badge text-base px-4 py-1.5" style={{ background: `${STATUS_COLORS[r.status]}20`, color: STATUS_COLORS[r.status] }}>
          {STATUS_LABELS[r.status] || r.status}
        </span>
      </div>

      {/* Request info */}
      <div className="card">
        <h2 className="text-lg font-bold text-theme-primary mb-3">Request Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-theme-muted">Requester:</span> <span className="font-semibold text-theme-primary">{r.requester_name}</span></div>
          <div><span className="text-theme-muted">Department:</span> <span className="font-semibold text-theme-primary">{r.requester_department || 'N/A'}</span></div>
          <div><span className="text-theme-muted">Type:</span> <span className="font-semibold text-theme-primary capitalize">{r.request_type}</span></div>
          <div><span className="text-theme-muted">Urgency:</span> <span className="font-semibold text-theme-primary capitalize">{r.urgency}</span></div>
          <div><span className="text-theme-muted">Manager:</span> <span className="font-semibold text-theme-primary">{r.manager_name || 'N/A'}</span> {r.manager_email && <span className="text-theme-faint text-xs">({r.manager_email})</span>}</div>
          <div><span className="text-theme-muted">Submitted:</span> <span className="font-semibold text-theme-primary">{new Date(r.created_at).toLocaleString()}</span></div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-theme-muted mb-1">Justification:</p>
          <p className="text-sm text-theme-primary whitespace-pre-wrap">{r.justification}</p>
        </div>
      </div>

      {/* Type-specific details */}
      {r.hardware_specs && (
        <div className="card">
          <h2 className="text-lg font-bold text-theme-primary mb-3">Hardware Details</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(typeof r.hardware_specs === 'string' ? JSON.parse(r.hardware_specs) : r.hardware_specs).map(([k, v]) => v ? (
              <div key={k}><span className="text-theme-muted">{k.replace(/_/g, ' ')}:</span> <span className="font-semibold text-theme-primary">{Array.isArray(v) ? (v as string[]).join(', ') : String(v)}</span></div>
            ) : null)}
          </div>
        </div>
      )}
      {r.software_details && (
        <div className="card">
          <h2 className="text-lg font-bold text-theme-primary mb-3">Software Details</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(typeof r.software_details === 'string' ? JSON.parse(r.software_details) : r.software_details).map(([k, v]) => v ? (
              <div key={k}><span className="text-theme-muted">{k.replace(/_/g, ' ')}:</span> <span className="font-semibold text-theme-primary">{String(v)}</span></div>
            ) : null)}
          </div>
        </div>
      )}
      {r.permission_details && (
        <div className="card">
          <h2 className="text-lg font-bold text-theme-primary mb-3">Permission Details</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(typeof r.permission_details === 'string' ? JSON.parse(r.permission_details) : r.permission_details).map(([k, v]) => v ? (
              <div key={k}><span className="text-theme-muted">{k.replace(/_/g, ' ')}:</span> <span className="font-semibold text-theme-primary">{String(v)}</span></div>
            ) : null)}
          </div>
        </div>
      )}
      {r.access_details && (
        <div className="card">
          <h2 className="text-lg font-bold text-theme-primary mb-3">Access Details</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(typeof r.access_details === 'string' ? JSON.parse(r.access_details) : r.access_details).map(([k, v]) => v ? (
              <div key={k}><span className="text-theme-muted">{k.replace(/_/g, ' ')}:</span> <span className="font-semibold text-theme-primary">{String(v)}</span></div>
            ) : null)}
          </div>
        </div>
      )}
      {r.other_details && (
        <div className="card">
          <h2 className="text-lg font-bold text-theme-primary mb-3">Other Details</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(typeof r.other_details === 'string' ? JSON.parse(r.other_details) : r.other_details).map(([k, v]) => v ? (
              <div key={k}><span className="text-theme-muted">{k.replace(/_/g, ' ')}:</span> <span className="font-semibold text-theme-primary">{String(v)}</span></div>
            ) : null)}
          </div>
        </div>
      )}

      {/* Review notes */}
      {r.manager_notes && (
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <p className="text-sm font-bold text-theme-secondary">Manager Notes</p>
          <p className="text-sm text-theme-primary mt-1">{r.manager_notes}</p>
          {r.manager_decision_at && <p className="text-xs text-theme-muted mt-2">{new Date(r.manager_decision_at).toLocaleString()}</p>}
        </div>
      )}
      {r.it_admin_notes && (
        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <p className="text-sm font-bold text-theme-secondary">IT Admin Notes</p>
          <p className="text-sm text-theme-primary mt-1">{r.it_admin_notes}</p>
          {r.it_decision_at && <p className="text-xs text-theme-muted mt-2">{new Date(r.it_decision_at).toLocaleString()}</p>}
        </div>
      )}

      {/* Actions */}
      {(canManagerReview || canItReview) && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <h2 className="text-lg font-bold text-theme-primary mb-3">{canManagerReview ? 'Manager Review' : 'IT Review'}</h2>
          <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} className="input-field mb-3" rows={2} placeholder="Add notes (optional)..." />
          <div className="flex gap-3">
            <button onClick={() => canManagerReview ? handleManagerReview('approved') : handleItReview('approved')} disabled={submitting}
              className="btn-primary" style={{ background: '#22c55e', borderColor: '#22c55e' }}>Approve</button>
            <button onClick={() => canManagerReview ? handleManagerReview('denied') : handleItReview('denied')} disabled={submitting}
              className="btn-danger">Deny</button>
          </div>
        </div>
      )}

      {canChangeStatus && (
        <div className="card">
          <h2 className="text-lg font-bold text-theme-primary mb-3">Update Status</h2>
          <div className="flex gap-3">
            {r.status === 'approved' && <button onClick={() => handleStatusChange('in_progress')} className="btn-primary">Mark In Progress</button>}
            {(r.status === 'approved' || r.status === 'in_progress') && <button onClick={() => handleStatusChange('completed')} className="btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }}>Mark Completed</button>}
          </div>
        </div>
      )}

      {canCancel && (
        <button onClick={handleCancel} className="btn-danger">Cancel Request</button>
      )}

      {/* Comments */}
      <div className="card">
        <h2 className="text-lg font-bold text-theme-primary mb-3">Comments</h2>
        {r.comments?.length > 0 ? (
          <div className="space-y-3 mb-4">
            {r.comments.map((c: any) => (
              <div key={c.id} className="p-3 rounded-lg" style={{ background: 'var(--bg-card-hover)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-theme-primary">{c.user_name}</span>
                  <span className="text-xs text-theme-muted">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-theme-secondary">{c.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-theme-muted mb-4">No comments yet.</p>
        )}
        <div className="flex gap-2">
          <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} className="input-field" placeholder="Add a comment..."
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }} />
          <button onClick={handleAddComment} className="btn-primary flex-shrink-0">Post</button>
        </div>
      </div>

      {/* History */}
      <div className="card">
        <h2 className="text-lg font-bold text-theme-primary mb-3">History</h2>
        {r.history?.length > 0 ? (
          <div className="space-y-2">
            {r.history.map((h: any) => (
              <div key={h.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: STATUS_COLORS[h.to_status] || '#94a3b8' }} />
                <div>
                  <span className="font-semibold text-theme-primary">{h.changed_by_name}</span>
                  <span className="text-theme-muted"> changed status to </span>
                  <span className="font-semibold" style={{ color: STATUS_COLORS[h.to_status] }}>{STATUS_LABELS[h.to_status] || h.to_status}</span>
                  {h.comment && <p className="text-theme-secondary text-xs mt-0.5">{h.comment}</p>}
                  <p className="text-xs text-theme-faint">{new Date(h.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-theme-muted">No history.</p>
        )}
      </div>
    </div>
  );
}
