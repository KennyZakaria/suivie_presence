import React, { useState, useEffect } from 'react';
import { getReviews, resolveReview, unresolveReview, createConseilDiscipline } from '../services/reviewService';
import { getStudents, getTeachers } from '../services/userService';
import { getClasses } from '../services/classService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const LEVEL_STYLES = {
  1: { badge: 'bg-yellow-100 text-yellow-800', label: 'Niveau 1 – Avertissement' },
  2: { badge: 'bg-orange-100 text-orange-800', label: 'Niveau 2 – Contact parent' },
  3: { badge: 'bg-red-100 text-red-800', label: 'Niveau 3 – Suspension' },
};

const SENTIMENT_STYLES = {
  positive: { badge: 'bg-green-100 text-green-800', label: 'Positif', icon: '👍' },
  negative: { badge: 'bg-red-100 text-red-800', label: 'Négatif', icon: '👎' },
};

const TODAY = new Date().toISOString().split('T')[0];

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'conseil'
  const [statusFilter, setStatusFilter] = useState('all');
  const [resolveTarget, setResolveTarget] = useState(null); // { review, action: 'resolve'|'unresolve' }
  const [resolving, setResolving] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [showConseilModal, setShowConseilModal] = useState(false);
  const [conseilForm, setConseilForm] = useState({ student_id: '', class_id: '', level: 1, title: '', description: '', date: TODAY });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      getReviews(),
      getStudents(),
      getTeachers(),
      getClasses(),
    ]).then(([r, s, t, c]) => {
      setReviews(r);
      setStudents(s);
      setTeachers(t);
      setClasses(c);
    }).catch(() => toast.error('Échec du chargement'))
      .finally(() => setLoading(false));
  }, []);

  const handleResolveToggle = async () => {
    setResolving(true);
    const isResolving = resolveTarget.action === 'resolve';
    try {
      await (isResolving ? resolveReview(resolveTarget.review.id) : unresolveReview(resolveTarget.review.id));
      setReviews(prev => prev.map(r => r.id === resolveTarget.review.id ? { ...r, is_resolved: isResolving } : r));
      toast.success(isResolving ? 'Marqué comme résolu' : 'Résolution annulée');
    } catch { toast.error(isResolving ? 'Échec de la résolution' : 'Échec de l’annulation'); }
    finally { setResolving(false); setResolveTarget(null); }
  };

  const handleCreateConseil = async (e) => {
    e.preventDefault();
    if (!conseilForm.student_id || !conseilForm.class_id) return toast.error('Étudiant et classe requis');
    setSubmitting(true);
    try {
      const result = await createConseilDiscipline({ ...conseilForm, level: parseInt(conseilForm.level) });
      setReviews(prev => [result, ...prev]);
      setShowConseilModal(false);
      setConseilForm({ student_id: '', class_id: '', level: 1, title: '', description: '', date: TODAY });
      toast.success('Conseil de discipline créé');
    } catch (err) {
      toast.error(err.message || 'Échec de la création');
    } finally { setSubmitting(false); }
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  // Name lookup helpers
  const getStudentName = (id) => students.find(s => s.id === id)?.full_name || id;
  const getTeacherName = (id) => teachers.find(t => t.id === id)?.full_name || id;
  const getClassName = (id) => classes.find(c => c.id === id)?.name || id;

  // Separate reviews by type (old records without review_type default to conseil_discipline)
  const comments = reviews.filter(r => r.review_type === 'comment');
  const conseils = reviews.filter(r => !r.review_type || r.review_type === 'conseil_discipline');

  const activeList = activeTab === 'comments' ? comments : conseils;
  const filtered = activeList.filter(r => {
    if (statusFilter === 'open' && r.is_resolved) return false;
    if (statusFilter === 'resolved' && !r.is_resolved) return false;
    return true;
  });

  if (loading) return <div className="flex justify-center h-64 items-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Commentaires & Conseils de discipline</h1>
        <button
          onClick={() => setShowConseilModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          Nouveau conseil de discipline
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{reviews.filter(r => !r.is_resolved).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Ouverts</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{comments.filter(r => r.sentiment === 'positive').length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Commentaires positifs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{comments.filter(r => r.sentiment === 'negative').length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Commentaires négatifs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{conseils.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Conseils de discipline</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {[
          { key: 'comments', label: `Commentaires enseignants (${comments.length})` },
          { key: 'conseil', label: `Conseils de discipline (${conseils.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Statut :</label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="all">Tous</option>
          <option value="open">Ouverts</option>
          <option value="resolved">Résolus</option>
        </select>
        <span className="ml-auto text-sm text-gray-400">{filtered.length} élément(s)</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Aucun élément ne correspond aux filtres sélectionnés.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const isExpanded = expanded[r.id];
            const isComment = r.review_type === 'comment';
            const sentimentStyle = SENTIMENT_STYLES[r.sentiment] || SENTIMENT_STYLES.negative;
            const levelStyle = LEVEL_STYLES[r.level] || LEVEL_STYLES[1];
            return (
              <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-start gap-4 p-5">
                  {isComment ? (
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${sentimentStyle.badge}`}>
                      {sentimentStyle.icon} {sentimentStyle.label}
                    </span>
                  ) : (
                    <span className={`shrink-0 inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${levelStyle.badge}`}>
                      {levelStyle.label}
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{r.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Étudiant : <span className="font-medium text-gray-700">{getStudentName(r.student_id)}</span>
                          {' · '}Par : <span className="font-medium text-gray-700">{getTeacherName(r.teacher_id)}</span>
                          {' · '}{r.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.is_resolved ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Résolu</span>
                            <button
                              onClick={() => setResolveTarget({ review: r, action: 'unresolve' })}
                              className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-lg hover:bg-gray-200 transition-colors"
                              title="Annuler la résolution"
                            >
                              ↺ Rouvrir
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResolveTarget({ review: r, action: 'resolve' })}
                            className="text-xs bg-indigo-50 text-indigo-700 font-medium px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            Résoudre
                          </button>
                        )}
                        <button onClick={() => toggleExpand(r.id)} className="text-gray-400 hover:text-gray-600">
                          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.description}</p>
                        {r.class_id && <p className="text-xs text-gray-400 mt-2">Classe : {getClassName(r.class_id)}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Conseil de Discipline Modal */}
      <Modal isOpen={showConseilModal} onClose={() => setShowConseilModal(false)} title="Nouveau conseil de discipline">
        <form onSubmit={handleCreateConseil} className="space-y-4 py-4 px-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Étudiant *</label>
            <select required value={conseilForm.student_id}
              onChange={e => setConseilForm(p => ({ ...p, student_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">Sélectionner un étudiant</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.full_name} – {s.email}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Classe *</label>
            <select required value={conseilForm.class_id}
              onChange={e => setConseilForm(p => ({ ...p, class_id: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">Sélectionner une classe</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Niveau de sanction *</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(lvl => (
                <button type="button" key={lvl}
                  onClick={() => setConseilForm(p => ({ ...p, level: lvl }))}
                  className={`py-2.5 rounded-lg text-xs font-semibold border-2 transition-colors ${
                    conseilForm.level === lvl
                      ? lvl === 1 ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                        : lvl === 2 ? 'bg-orange-50 border-orange-400 text-orange-800'
                        : 'bg-red-50 border-red-500 text-red-800'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}>
                  {lvl === 1 ? '⚠️ Avertissement' : lvl === 2 ? '📞 Contact parent' : '🚫 Suspension'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input type="date" required value={conseilForm.date}
              onChange={e => setConseilForm(p => ({ ...p, date: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
            <input type="text" required value={conseilForm.title}
              onChange={e => setConseilForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Objet du conseil"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea required rows={4} value={conseilForm.description}
              onChange={e => setConseilForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Détails de la décision du conseil..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowConseilModal(false)}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
              {submitting ? 'Création...' : 'Créer le conseil'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!resolveTarget}
        onCancel={() => setResolveTarget(null)}
        onConfirm={handleResolveToggle}
        title={resolveTarget?.action === 'resolve' ? 'Résoudre' : 'Rouvrir'}
        message={
          resolveTarget?.action === 'resolve'
            ? `Marquer "${resolveTarget?.review?.title}" comme résolu ?`
            : `Annuler la résolution de "${resolveTarget?.review?.title}" ?`
        }
        confirmLabel={resolving ? 'Résolution...' : 'Marquer comme résolu'}
      />
    </div>
  );
}
