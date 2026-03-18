import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getClass, removeStudentFromClass } from '../services/classService';
import { getTeachers } from '../services/userService';
import { getClassAttendance } from '../services/attendanceService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

export default function ClassDetail() {
  const { id } = useParams();
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('students');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [loadingAtt, setLoadingAtt] = useState(false);

  useEffect(() => {
    Promise.all([getClass(id), getTeachers()])
      .then(([data, t]) => {
        setCls(data);
        setStudents(data.students || []);
        setTeachers(t);
      })
      .catch(() => toast.error('Échec du chargement de la classe'))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchAttendance = async () => {
    setLoadingAtt(true);
    try {
      const data = await getClassAttendance(id, dateFilter);
      setAttendance(data);
    } catch {
      toast.error('Échec du chargement de la présence');
    } finally {
      setLoadingAtt(false);
    }
  };

  useEffect(() => { if (tab === 'attendance') fetchAttendance(); }, [tab, dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRemoveStudent = async (sid) => {
    try {
      await removeStudentFromClass(id, sid);
      setStudents(prev => prev.filter(s => s.id !== sid));
      toast.success('Étudiant retiré de la classe');
    } catch { toast.error('Échec du retrait de l\'étudiant'); }
    setConfirmRemove(null);
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><LoadingSpinner size="lg" /></div>;
  if (!cls) return <div className="text-center py-16 text-gray-400">Classe non trouvée</div>;

  const getTeacherName = (tid) => teachers.find(t => t.id === tid)?.full_name || 'Non assigné';
  const getStudentName = (sid) => students.find(s => s.id === sid)?.full_name || sid;
  const statusCount = (status) => attendance.filter(a => a.status === status).length;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link to="/classes" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
          <p className="text-sm text-gray-500">{cls.subject} · Grade {cls.grade}</p>
        </div>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Étudiants', value: cls.student_ids?.length || 0 },
          { label: 'Enseignant', value: getTeacherName(cls.teacher_id) },
          { label: 'Statut', value: cls.is_active ? 'Actif' : 'Inactif' },
        ].map(item => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
            <p className="text-lg font-bold text-gray-900 truncate">{item.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {['students', 'attendance'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
              tab === t ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'students' ? `Étudiants (${students.length})` : 'Historique de présence'}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {students.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">Aucun étudiant assigné à cette classe</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Nom', 'Email', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold">
                          {s.full_name?.charAt(0)}
                        </div>
                        <Link to={`/students/${s.id}`} className="font-medium text-gray-900 hover:text-indigo-600">{s.full_name}</Link>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{s.email}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => setConfirmRemove({ id: s.id, name: s.full_name })}
                        className="text-red-500 hover:text-red-700 text-xs font-medium">Retirer</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Date :</label>
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          {attendance.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Présent', count: statusCount('present'), color: 'text-green-600' },
                { label: 'Absent', count: statusCount('absent'), color: 'text-red-500' },
                { label: 'En retard', count: statusCount('late'), color: 'text-orange-500' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {loadingAtt ? (
              <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : attendance.length === 0 ? (
              <p className="text-center py-12 text-gray-400 text-sm">Aucun enregistrement de présence pour le {dateFilter}</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Étudiant', 'Statut', 'Notes'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendance.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-700">{getStudentName(a.student_id)}</td>
                      <td className="px-5 py-3"><Badge status={a.status} /></td>
                      <td className="px-5 py-3 text-gray-400">{a.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmRemove} onClose={() => setConfirmRemove(null)}
        onConfirm={() => handleRemoveStudent(confirmRemove?.id)}
        title="Retirer l'étudiant"
        message={`Retirer ${confirmRemove?.name} de cette classe ?`}
      />
    </div>
  );
}
