import React, { useState, useEffect, useCallback } from 'react';
import { MdDownload, MdRefresh } from 'react-icons/md';
import { getActivityLog, exportActivityCSV } from '../services/activityService';

const ROLE_LABELS = { admin: 'Admin', teacher: 'Enseignant', student: 'Étudiant' };
const ACTION_COLORS = { login: 'bg-green-100 text-green-800', logout: 'bg-gray-100 text-gray-700' };

function formatDuration(seconds) {
  if (seconds == null || seconds === '') return '—';
  const s = Number(seconds);
  if (Number.isNaN(s)) return '—';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('fr-FR');
}

export default function ActivityLog() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActivityLog(500);
      setRecords(data);
    } catch (e) {
      setError('Erreur lors du chargement du journal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let data = records;
    if (roleFilter) data = data.filter((r) => r.user_role === roleFilter);
    if (actionFilter) data = data.filter((r) => r.action === actionFilter);
    setFiltered(data);
  }, [records, roleFilter, actionFilter]);

  const handleExport = async () => {
    try {
      const blob = await exportActivityCSV();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'journal_activite.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Erreur lors de l'export.");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Journal d'activité</h1>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
          >
            <MdRefresh /> Actualiser
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
          >
            <MdDownload /> Exporter CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tous les rôles</option>
          <option value="admin">Admin</option>
          <option value="teacher">Enseignant</option>
          <option value="student">Étudiant</option>
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Toutes les actions</option>
          <option value="login">Connexion</option>
          <option value="logout">Déconnexion</option>
        </select>
        <span className="text-sm text-gray-500 self-center">{filtered.length} entrée(s)</span>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {loading ? (
        <div className="text-gray-500">Chargement...</div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 border-b">
                <th className="px-4 py-3 text-left">Date / Heure</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Rôle</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Durée session</th>
                <th className="px-4 py-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Aucune activité enregistrée.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(r.timestamp)}</td>
                  <td className="px-4 py-3">{r.user_email}</td>
                  <td className="px-4 py-3">{ROLE_LABELS[r.user_role] ?? r.user_role}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[r.action] ?? 'bg-gray-100'}`}>
                      {r.action === 'login' ? 'Connexion' : 'Déconnexion'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDuration(r.duration_seconds)}</td>
                  <td className="px-4 py-3 text-gray-400">{r.ip_address ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
