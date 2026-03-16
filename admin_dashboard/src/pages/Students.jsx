import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { createStudent, getStudents, deleteUser } from '../services/userService';
import { getClasses } from '../services/classService';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdCreds, setCreatedCreds] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });

  // Bulk import state
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null); // { success: [], errors: [] }
  const fileInputRef = useRef(null);

  useEffect(() => {
    Promise.all([fetchStudents(), fetchClasses()]).finally(() => setLoading(false));
  }, []);

  const fetchStudents = async () => {
    try { setStudents(await getStudents()); } catch { toast.error('Échec du chargement des étudiants'); }
  };

  const fetchClasses = async () => {
    try { setClasses(await getClasses()); } catch {}
  };

  const getStudentClasses = (classIds = []) =>
    classes.filter(c => classIds.includes(c.id)).map(c => c.name).join(', ') || '—';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email) return toast.error('Le nom et l\'email sont obligatoires');
    setSubmitting(true);
    try {
      const result = await createStudent(form);
      setCreatedCreds({ email: result.email, password: result.temp_password });
      setStudents(prev => [...prev, result]);
      setForm({ full_name: '', email: '', phone: '' });
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Échec de la création de l\'étudiant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      setStudents(prev => prev.filter(s => s.id !== id));
      toast.success('Étudiant supprimé');
    } catch { toast.error('Échec de la suppression de l\'étudiant'); }
    setConfirm(null);
  };

  // ── Excel import ──────────────────────────────────────────────────────────
  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    let rows;
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    } catch {
      return toast.error('Impossible de lire le fichier Excel.');
    }

    if (!rows.length) return toast.error('Le fichier Excel est vide.');

    // Normalise header names (case-insensitive)
    const normalise = (obj) => {
      const result = {};
      for (const [k, v] of Object.entries(obj)) {
        result[k.trim().toLowerCase()] = String(v).trim();
      }
      return result;
    };

    const valid = rows.map(normalise).filter(r => r.full_name && r.email);
    if (!valid.length) {
      return toast.error('Aucune ligne valide trouvée. Le fichier doit avoir les colonnes "full_name" et "email".');
    }

    setImporting(true);
    setImportResults(null);
    const success = [];
    const errors = [];

    for (const row of valid) {
      try {
        const result = await createStudent({
          full_name: row.full_name,
          email: row.email,
          phone: row.phone || '',
        });
        success.push({ full_name: result.full_name, email: result.email, password: result.temp_password });
        setStudents(prev => [...prev, result]);
      } catch (err) {
        errors.push({ email: row.email, reason: err.response?.data?.detail || err.message });
      }
    }

    setImporting(false);
    setImportResults({ success, errors });
    if (success.length) toast.success(`${success.length} étudiant(s) créé(s).`);
    if (errors.length) toast.error(`${errors.length} erreur(s) lors de l'importation.`);
  };

  // ── Excel export: bulk-created credentials ────────────────────────────────
  const handleExportCredentials = () => {
    if (!importResults?.success?.length) return;
    const ws = XLSX.utils.json_to_sheet(
      importResults.success.map(r => ({
        'Nom complet': r.full_name,
        'Email': r.email,
        'Mot de passe temporaire': r.password,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Identifiants');
    XLSX.writeFile(wb, 'identifiants_etudiants.xlsx');
  };

  // ── Excel export: all students list ───────────────────────────────────────
  const handleExportStudents = () => {
    const ws = XLSX.utils.json_to_sheet(
      students.map(s => ({
        'Nom complet': s.full_name,
        'Email': s.email,
        'Téléphone': s.phone || '',
        'Classes': getStudentClasses(s.class_ids),
        'Statut': s.is_active ? 'Actif' : 'Inactif',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Étudiants');
    XLSX.writeFile(wb, 'liste_etudiants.xlsx');
  };

  // ── Download blank import template ────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { full_name: 'Marie Martin', email: 'marie.martin@ecole.fr', phone: '+212600000001' },
      { full_name: 'Ahmed Benali', email: 'ahmed.benali@ecole.fr', phone: '' },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modèle');
    XLSX.writeFile(wb, 'modele_import_etudiants.xlsx');
  };

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center h-64 items-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Étudiants</h1>
        <div className="flex items-center gap-2">
          {/* Hidden file input for Excel import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportExcel}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {importing ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Importation...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M8 12l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Importer Excel
              </>
            )}
          </button>
          <button
            onClick={handleDownloadTemplate}
            title="Télécharger le modèle Excel"
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-green-300 text-green-700 text-sm font-medium rounded-lg hover:bg-green-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Modèle
          </button>
          <button
            onClick={handleExportStudents}
            disabled={!students.length}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v8m0 0l-4-4m4 4l4-4M8 8H4a2 2 0 00-2 2v4" />
            </svg>
            Exporter liste
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un étudiant
          </button>
        </div>
      </div>

      {/* Bulk import results panel */}
      {importResults && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-blue-900 text-sm">
              Résultat de l'importation — {importResults.success.length} créé(s), {importResults.errors.length} erreur(s)
            </p>
            <div className="flex items-center gap-2">
              {importResults.success.length > 0 && (
                <button
                  onClick={handleExportCredentials}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v8m0 0l-4-4m4 4l4-4" />
                  </svg>
                  Exporter identifiants (.xlsx)
                </button>
              )}
              <button onClick={() => setImportResults(null)} className="text-blue-400 hover:text-blue-700 text-sm">✕</button>
            </div>
          </div>
          {importResults.success.length > 0 && (
            <div className="overflow-x-auto max-h-48 overflow-y-auto rounded border border-blue-200">
              <table className="w-full text-xs">
                <thead className="bg-blue-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-blue-700">Nom</th>
                    <th className="px-3 py-2 text-left text-blue-700">Email</th>
                    <th className="px-3 py-2 text-left text-blue-700">Mot de passe temporaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100 bg-white">
                  {importResults.success.map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1.5 text-gray-700">{r.full_name}</td>
                      <td className="px-3 py-1.5 font-mono text-gray-600">{r.email}</td>
                      <td className="px-3 py-1.5 font-mono font-semibold text-indigo-700">{r.password}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {importResults.errors.length > 0 && (
            <div className="space-y-1">
              {importResults.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">✕ {e.email} — {e.reason}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {createdCreds && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 text-sm text-green-800">
            <p className="font-semibold">Compte étudiant créé. Partagez ces identifiants de connexion :</p>
            <p>Email : <span className="font-mono">{createdCreds.email}</span></p>
            <p>Mot de passe temporaire : <span className="font-mono font-semibold">{createdCreds.password}</span></p>
            <p className="text-xs mt-1 text-green-600">L'étudiant devra changer son mot de passe lors de sa première connexion.</p>
          </div>
          <button onClick={() => setCreatedCreds(null)} className="text-green-500 hover:text-green-700">✕</button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="text" placeholder="Rechercher des étudiants..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>{search ? 'Aucun étudiant ne correspond à votre recherche.' : 'Aucun étudiant pour le moment. Ajoutez-en un pour commencer.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Nom', 'Email', 'Téléphone', 'Classes', 'Statut', ''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-xs">
                        {s.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <Link to={`/students/${s.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                        {s.full_name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">{s.email}</td>
                  <td className="px-5 py-4 text-gray-500">{s.phone || '—'}</td>
                  <td className="px-5 py-4 text-gray-500 max-w-xs truncate">{getStudentClasses(s.class_ids)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {s.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-4 flex items-center gap-3">
                    <Link to={`/students/${s.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">Voir</Link>
                    <button
                      onClick={() => setConfirm({ id: s.id, name: s.full_name })}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Ajouter un nouvel étudiant">
        <form onSubmit={handleSubmit} className="space-y-4 py-4 px-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
            <input type="text" required value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Marie Martin" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" required value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="etudiant@ecole.fr" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="tel" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="+212 123 456 789" />
          </div>
          <p className="text-xs text-gray-400">L'étudiant devra changer son mot de passe lors de sa première connexion.</p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? 'Création...' : 'Créer l\'étudiant'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm?.id)}
        title="Supprimer l'étudiant"
        message={`Êtes-vous sûr de vouloir supprimer ${confirm?.name} ?`}
      />
    </div>
  );
}
