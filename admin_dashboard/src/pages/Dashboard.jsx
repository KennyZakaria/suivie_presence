import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { getDashboardSummary, getAttendanceTrends, getClassComparison, getAtRiskStudents } from '../services/analyticsService';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [classComparison, setClassComparison] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [s, t, c, r] = await Promise.all([
        getDashboardSummary(),
        getAttendanceTrends(30),
        getClassComparison(),
        getAtRiskStudents(),
      ]);
      setSummary(s);
      setTrends(t.map(d => ({ ...d, date: d.date.slice(5) })));
      setClassComparison(c);
      setAtRisk(r);
    } catch {
      toast.error('Échec du chargement des données du tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total étudiants"
          value={summary?.total_students ?? 0}
          color="indigo"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          title="Total enseignants"
          value={summary?.total_teachers ?? 0}
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <StatCard
          title="Taux de présence"
          value={`${summary?.overall_attendance_rate ?? 0}%`}
          color="green"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Avis ouverts"
          value={summary?.open_reviews ?? 0}
          color="orange"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Attendance Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Tendance de présence sur 30 jours</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="rate" stroke="#6366f1" strokeWidth={2} dot={false} name="Présence %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Class Comparison */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Comparaison de présence par classe</h2>
          {classComparison.length === 0 ? (
            <p className="text-gray-400 text-sm text-center mt-16">Pas encore de données</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={classComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="class_name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="attendance_rate" fill="#6366f1" radius={[4, 4, 0, 0]} name="Présence %" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* At-Risk Students */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Étudiants à risque
          <span className="ml-2 text-xs font-normal text-gray-500">(présence inférieure à 70%)</span>
        </h2>
        {atRisk.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Aucun étudiant à risque</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-l-lg">Étudiant</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sessions</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Présent</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-r-lg">Taux</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {atRisk.map((s) => (
                  <tr key={s.student_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.full_name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.total_sessions}</td>
                    <td className="px-4 py-3 text-gray-500">{s.present}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${s.attendance_rate < 50 ? 'text-red-600' : 'text-orange-600'}`}>
                        {s.attendance_rate}%
                      </span>
                    </td>
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
