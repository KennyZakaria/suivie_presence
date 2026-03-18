import React, { useState, useEffect } from 'react';
import { getJustifications, reviewJustification } from '../services/justificationService';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const STATUS_TABS = [
  { key: null, label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'accepted', label: 'Acceptées' },
  { key: 'rejected', label: 'Rejetées' },
];

const statusConfig = {
  pending: { label: 'En attente', color: 'amber', icon: '⏳' },
  accepted: { label: 'Acceptée', color: 'green', icon: '✅' },
  rejected: { label: 'Rejetée', color: 'red', icon: '❌' },
};

export default function Justifications() {
  const [justifications, setJustifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reviewModal, setReviewModal] = useState(null); // justification being reviewed
  const [reviewAction, setReviewAction] = useState('accepted');
  const [adminComment, setAdminComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getJustifications(statusFilter);
      setJustifications(data);
    } catch {
      toast.error('Erreur lors du chargement des justifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleReview = async () => {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      await reviewJustification(reviewModal.id, {
        status: reviewAction,
        admin_comment: adminComment || null,
      });
      toast.success(reviewAction === 'accepted' ? 'Justification acceptée' : 'Justification rejetée');
      setReviewModal(null);
      setAdminComment('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const pendingCount = justifications.filter(j => j.status === 'pending').length;

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Justifications d'absence</h1>
          <p className="text-sm text-gray-500 mt-1">
            {statusFilter === 'pending' && pendingCount > 0
              ? `${pendingCount} justification(s) en attente de validation`
              : `${justifications.length} justification(s)`}
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key ?? 'all'}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.key
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Justifications list */}
      {justifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-400">Aucune justification trouvée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {justifications.map(j => {
            const sc = statusConfig[j.status] || statusConfig.pending;
            return (
              <div key={j.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-gray-900">{j.student_name || 'Étudiant'}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-${sc.color}-50 text-${sc.color}-700 border border-${sc.color}-200`}>
                        {sc.icon} {sc.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Date d'absence:</span> {formatDate(j.date)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Raison:</span> {j.reason}
                    </p>
                    {j.admin_comment && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        💬 Commentaire admin: {j.admin_comment}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Soumis le {formatDate(j.created_at)}
                      {j.reviewed_at && <> · Traité le {formatDate(j.reviewed_at)}</>}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {j.document_url && (
                      <button
                        onClick={() => setPreviewUrl(j.document_url)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Document
                      </button>
                    )}
                    {j.status === 'pending' && (
                      <>
                        <button
                          onClick={() => { setReviewModal(j); setReviewAction('accepted'); setAdminComment(''); }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          ✓ Accepter
                        </button>
                        <button
                          onClick={() => { setReviewModal(j); setReviewAction('rejected'); setAdminComment(''); }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          ✗ Rejeter
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review confirmation modal */}
      <Modal
        isOpen={!!reviewModal}
        onClose={() => setReviewModal(null)}
        title={reviewAction === 'accepted' ? 'Accepter la justification' : 'Rejeter la justification'}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {reviewAction === 'accepted'
              ? "L'absence sera marquée comme justifiée."
              : "La justification sera rejetée. L'absence reste non justifiée."}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire (optionnel)
            </label>
            <textarea
              value={adminComment}
              onChange={e => setAdminComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ajouter un commentaire..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setReviewModal(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Annuler
            </button>
            <button
              onClick={handleReview}
              disabled={submitting}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                reviewAction === 'accepted'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {submitting ? 'Traitement...' : reviewAction === 'accepted' ? 'Accepter' : 'Rejeter'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Document preview modal */}
      <Modal
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="Document justificatif"
      >
        <div className="flex flex-col items-center gap-4">
          <img
            src={previewUrl}
            alt="Document justificatif"
            className="max-w-full max-h-[60vh] rounded-lg border border-gray-200"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden flex-col items-center gap-2 p-8 text-gray-400">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Impossible d'afficher l'aperçu</p>
          </div>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ouvrir dans un nouvel onglet
          </a>
        </div>
      </Modal>
    </div>
  );
}
