import React, { useState, useEffect } from 'react';
import { getReviews, resolveReview } from '../services/reviewService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

const LEVEL_STYLES = {
  1: { badge: 'bg-yellow-100 text-yellow-800', label: 'Level 1 – Warning' },
  2: { badge: 'bg-orange-100 text-orange-800', label: 'Level 2 – Parent Contact' },
  3: { badge: 'bg-red-100 text-red-800', label: 'Level 3 – Suspension' },
};

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    getReviews()
      .then(setReviews)
      .catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async () => {
    setResolving(true);
    try {
      await resolveReview(resolveTarget.id);
      setReviews(prev => prev.map(r => r.id === resolveTarget.id ? { ...r, is_resolved: true } : r));
      toast.success('Review marked as resolved');
    } catch { toast.error('Failed to resolve review'); }
    finally { setResolving(false); setResolveTarget(null); }
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const filtered = reviews.filter(r => {
    if (levelFilter !== 'all' && r.level !== parseInt(levelFilter)) return false;
    if (statusFilter === 'open' && r.is_resolved) return false;
    if (statusFilter === 'resolved' && !r.is_resolved) return false;
    return true;
  });

  const counts = { 1: 0, 2: 0, 3: 0, open: 0 };
  reviews.forEach(r => {
    counts[r.level] = (counts[r.level] || 0) + 1;
    if (!r.is_resolved) counts.open++;
  });

  if (loading) return <div className="flex justify-center h-64 items-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Disciplinary Reviews</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Open Reviews', value: counts.open, color: 'text-indigo-600' },
          { label: 'Level 1 – Warning', value: counts[1] || 0, color: 'text-yellow-600' },
          { label: 'Level 2 – Parent', value: counts[2] || 0, color: 'text-orange-600' },
          { label: 'Level 3 – Suspension', value: counts[3] || 0, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Level:</label>
          <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="all">All Levels</option>
            <option value="1">Level 1 – Warning</option>
            <option value="2">Level 2 – Parent Contact</option>
            <option value="3">Level 3 – Suspension</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <span className="ml-auto text-sm text-gray-400 self-center">{filtered.length} review{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Review list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No reviews match the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const style = LEVEL_STYLES[r.level] || LEVEL_STYLES[1];
            const isExpanded = expanded[r.id];
            return (
              <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-start gap-4 p-5">
                  {/* Level badge */}
                  <span className={`shrink-0 inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${style.badge}`}>
                    {style.label}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{r.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Student: <span className="font-medium text-gray-700">{r.student_id}</span>
                          {' · '}Teacher: <span className="font-medium text-gray-700">{r.teacher_id}</span>
                          {' · '}{r.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.is_resolved ? (
                          <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Resolved</span>
                        ) : (
                          <button
                            onClick={() => setResolveTarget(r)}
                            className="text-xs bg-indigo-50 text-indigo-700 font-medium px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            Resolve
                          </button>
                        )}
                        <button onClick={() => toggleExpand(r.id)}
                          className="text-gray-400 hover:text-gray-600">
                          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.description}</p>
                        {r.class_id && (
                          <p className="text-xs text-gray-400 mt-2">Class: {r.class_id}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!resolveTarget}
        onClose={() => setResolveTarget(null)}
        onConfirm={handleResolve}
        title="Resolve Review"
        message={`Mark "${resolveTarget?.title}" as resolved?`}
        confirmLabel={resolving ? 'Resolving...' : 'Mark Resolved'}
      />
    </div>
  );
}
