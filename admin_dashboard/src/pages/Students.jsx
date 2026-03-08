import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  useEffect(() => {
    Promise.all([fetchStudents(), fetchClasses()]).finally(() => setLoading(false));
  }, []);

  const fetchStudents = async () => {
    try { setStudents(await getStudents()); } catch { toast.error('Failed to load students'); }
  };

  const fetchClasses = async () => {
    try { setClasses(await getClasses()); } catch {}
  };

  const getStudentClasses = (classIds = []) =>
    classes.filter(c => classIds.includes(c.id)).map(c => c.name).join(', ') || '—';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email) return toast.error('Name and email are required');
    setSubmitting(true);
    try {
      const result = await createStudent(form);
      setCreatedCreds({ email: result.email, password: result.temp_password });
      setStudents(prev => [...prev, result]);
      setForm({ full_name: '', email: '', phone: '' });
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      setStudents(prev => prev.filter(s => s.id !== id));
      toast.success('Student deleted');
    } catch { toast.error('Failed to delete student'); }
    setConfirm(null);
  };

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center h-64 items-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </button>
      </div>

      {createdCreds && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 text-sm text-green-800">
            <p className="font-semibold">Student account created. Share these login credentials:</p>
            <p>Email: <span className="font-mono">{createdCreds.email}</span></p>
            <p>Temp Password: <span className="font-mono font-semibold">{createdCreds.password}</span></p>
            <p className="text-xs mt-1 text-green-600">Student will be prompted to change password on first login.</p>
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
          type="text" placeholder="Search students..."
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
            <p>{search ? 'No students match your search.' : 'No students yet. Add one to get started.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Phone', 'Classes', 'Status', ''].map(h => (
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
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 flex items-center gap-3">
                    <Link to={`/students/${s.id}`} className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">View</Link>
                    <button
                      onClick={() => setConfirm({ id: s.id, name: s.full_name })}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add New Student">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input type="text" required value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Jane Smith" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" required value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="student@school.edu" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="+1 234 567 8900" />
          </div>
          <p className="text-xs text-gray-400">Student will be required to change their password on first login.</p>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => handleDelete(confirm?.id)}
        title="Delete Student"
        message={`Are you sure you want to delete ${confirm?.name}?`}
      />
    </div>
  );
}
