import React, { useState, useEffect } from 'react';
import { getClasses } from '../services/classService';
import { getAttendanceReport } from '../services/attendanceService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';

export default function AttendanceReports() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    getClasses().then(setClasses).catch(() => toast.error('Failed to load classes'));
  }, []);

  const fetchReport = async () => {
    if (!classId) return toast.error('Please select a class');
    setLoading(true);
    try {
      const data = await getAttendanceReport(classId, startDate, endDate);
      setRecords(data);
      setFetched(true);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  // Aggregate per student
  const studentMap = records.reduce((acc, r) => {
    if (!acc[r.student_id]) acc[r.student_id] = { student_id: r.student_id, present: 0, absent: 0, late: 0, total: 0 };
    acc[r.student_id][r.status]++;
    acc[r.student_id].total++;
    return acc;
  }, {});
  const studentRows = Object.values(studentMap);

  const exportCSV = () => {
    const headers = ['Student ID', 'Present', 'Absent', 'Late', 'Total', 'Rate (%)'];
    const rows = studentRows.map(s => [
      s.student_id, s.present, s.absent, s.late, s.total,
      s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : '0',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `attendance_${classId}_${startDate}_${endDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select value={classId} onChange={e => setClassId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">— Select class —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <button onClick={fetchReport} disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? 'Loading...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {loading && <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>}

      {!loading && fetched && (
        <>
          {/* Summary Stats */}
          {studentRows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Students', value: studentRows.length, color: 'text-indigo-600' },
                { label: 'Total Sessions', value: records.length, color: 'text-gray-700' },
                { label: 'Present', value: records.filter(r => r.status === 'present').length, color: 'text-green-600' },
                { label: 'Absent', value: records.filter(r => r.status === 'absent').length, color: 'text-red-500' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Per-Student Summary</h2>
              {studentRows.length > 0 && (
                <button onClick={exportCSV}
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </button>
              )}
            </div>
            {studentRows.length === 0 ? (
              <p className="text-center py-16 text-gray-400 text-sm">No records found for the selected filters</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Student ID', 'Present', 'Absent', 'Late', 'Total', 'Rate'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {studentRows.sort((a, b) => (b.present / b.total) - (a.present / a.total)).map(s => {
                    const rate = s.total > 0 ? ((s.present / s.total) * 100).toFixed(1) : '0';
                    const rateNum = parseFloat(rate);
                    return (
                      <tr key={s.student_id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-800">{s.student_id}</td>
                        <td className="px-5 py-3 text-green-600 font-medium">{s.present}</td>
                        <td className="px-5 py-3 text-red-500 font-medium">{s.absent}</td>
                        <td className="px-5 py-3 text-orange-500 font-medium">{s.late}</td>
                        <td className="px-5 py-3 text-gray-500">{s.total}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${rate}%` }} />
                            </div>
                            <span className={`text-xs font-semibold ${rateNum < 70 ? 'text-red-600' : rateNum < 85 ? 'text-orange-600' : 'text-green-600'}`}>
                              {rate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Raw records */}
          {records.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <h2 className="font-semibold text-gray-900 px-5 py-4 border-b border-gray-100">All Records ({records.length})</h2>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {['Date', 'Student ID', 'Status', 'Notes'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-5 py-2.5 text-gray-700">{r.date}</td>
                        <td className="px-5 py-2.5 text-gray-500">{r.student_id}</td>
                        <td className="px-5 py-2.5"><Badge status={r.status} /></td>
                        <td className="px-5 py-2.5 text-gray-400">{r.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !fetched && (
        <div className="text-center py-20 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Select a class and date range, then click Generate Report.</p>
        </div>
      )}
    </div>
  );
}
