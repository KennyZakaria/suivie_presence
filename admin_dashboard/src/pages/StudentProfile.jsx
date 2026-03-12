import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUser } from '../services/userService';
import { getStudentSummary, getStudentAttendance } from '../services/attendanceService';
import { getStudentReviews } from '../services/reviewService';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';

const COLORS = { present: '#22c55e', absent: '#ef4444', late: '#f97316' };

export default function StudentProfile() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [summary, setSummary] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getUser(id).then(setStudent),
      getStudentSummary(id).then(setSummary),
      getStudentAttendance(id).then(d => setAttendance(d.slice(0, 20))),
      getStudentReviews(id).then(setReviews),
    ]).catch(() => toast.error('Échec du chargement des données de l\'étudiant'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center h-64 items-center"><LoadingSpinner size="lg" /></div>;
  if (!student) return <div className="text-center py-16 text-gray-400">Étudiant non trouvé</div>;

  const pieData = summary ? [
    { name: 'Présent', value: summary.present },
    { name: 'Absent', value: summary.absent },
    { name: 'En retard', value: summary.late },
  ].filter(d => d.value > 0) : [];

  const levelColors = { 1: 'bg-yellow-100 text-yellow-700', 2: 'bg-orange-100 text-orange-700', 3: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link to="/students" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Profil de l'étudiant</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Student Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-3xl font-bold mb-4">
            {student.full_name?.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{student.full_name}</h2>
          <p className="text-sm text-gray-500">{student.email}</p>
          {student.phone && <p className="text-sm text-gray-500 mt-1">{student.phone}</p>}
          <div className="mt-3">
            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${student.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {student.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
          {summary && (
            <div className="mt-4 w-full border-t pt-4 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-green-600">{summary.present}</p>
                <p className="text-xs text-gray-500">Présent</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-500">{summary.absent}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
              <div>
                <p className="text-xl font-bold text-orange-500">{summary.late}</p>
                <p className="text-xs text-gray-500">En retard</p>
              </div>
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Répartition de la présence</h3>
          {summary && summary.total > 0 ? (
            <>
              <div className="text-center mb-2">
                <span className="text-3xl font-bold text-indigo-600">{summary.present_percentage}%</span>
                <p className="text-xs text-gray-500">Présence globale</p>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={COLORS[entry.name.toLowerCase()]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
            </>
          ) : (
            <p className="text-gray-400 text-sm text-center mt-10">Aucune donnée de présence pour le moment</p>
          )}
        </div>

        {/* Reviews Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Avis disciplinaires ({reviews.length})</h3>
          {reviews.length === 0 ? (
            <p className="text-gray-400 text-sm text-center mt-10">Aucun avis</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {reviews.map(r => (
                <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${levelColors[r.level]}`}>
                      Niveau {r.level}
                    </span>
                    {r.is_resolved && (
                      <span className="text-xs text-green-600 font-medium">Résolu</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800">{r.title}</p>
                  <p className="text-xs text-gray-400">{r.date}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Présence récente</h3>
        {attendance.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Aucun enregistrement de présence</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Date', 'Classe', 'Statut', 'Notes'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendance.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700 font-medium">{a.date}</td>
                    <td className="px-4 py-3 text-gray-500">{a.class_id}</td>
                    <td className="px-4 py-3">
                      <Badge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400">{a.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
