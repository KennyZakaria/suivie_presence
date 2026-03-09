import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getClasses, createClass, assignTeacher, assignStudents,
} from '../services/classService';
import { getTeachers, getStudents } from '../services/userService';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null); // holds classId
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', grade: '' });
  const [assignTeacherId, setAssignTeacherId] = useState('');
  const [assignStudentIds, setAssignStudentIds] = useState([]);

  useEffect(() => {
    Promise.all([
      getClasses().then(setClasses),
      getTeachers().then(setTeachers),
      getStudents().then(setStudents),
    ]).catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const getTeacherName = (tid) => teachers.find(t => t.id === tid)?.full_name || 'Unassigned';

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.subject || !form.grade) return toast.error('All fields are required');
    setSubmitting(true);
    try {
      const cls = await createClass(form);
      setClasses(prev => [...prev, cls]);
      setForm({ name: '', subject: '', grade: '' });
      setShowModal(false);
      toast.success('Class created');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssign = async (classId) => {
    setSubmitting(true);
    try {
      if (assignTeacherId) await assignTeacher(classId, assignTeacherId);
      if (assignStudentIds.length > 0) await assignStudents(classId, assignStudentIds);
      const updated = await getClasses();
      setClasses(updated);
      setShowAssignModal(null);
      setAssignTeacherId('');
      setAssignStudentIds([]);
      toast.success('Assignments saved');
    } catch {
      toast.error('Failed to save assignments');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStudent = (id) => {
    setAssignStudentIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><LoadingSpinner size="lg" /></div>;

  const selectedClass = classes.find(c => c.id === showAssignModal);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-16 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p>No classes yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {classes.map(cls => (
            <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500">{cls.subject} · Grade {cls.grade}</p>
                </div>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-1 rounded-lg">
                  {cls.student_ids?.length || 0} students
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {getTeacherName(cls.teacher_id)}
              </div>
              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                <button
                  onClick={() => { setShowAssignModal(cls.id); setAssignTeacherId(cls.teacher_id || ''); setAssignStudentIds([]); }}
                  className="flex-1 text-xs py-1.5 border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50"
                >
                  Assign
                </button>
                <Link
                  to={`/classes/${cls.id}`}
                  className="flex-1 text-xs py-1.5 text-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Class">
        <form onSubmit={handleCreate} className="space-y-4 py-4 px-4">
          {[
            { label: 'Class Name', key: 'name', placeholder: 'Mathematics 10A' },
            { label: 'Subject', key: 'subject', placeholder: 'Mathematics' },
            { label: 'Grade', key: 'grade', placeholder: '10' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label} *</label>
              <input type="text" required value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder={f.placeholder} />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting}
              className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={!!showAssignModal} onClose={() => setShowAssignModal(null)} title={`Assign — ${selectedClass?.name}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
            <select value={assignTeacherId} onChange={e => setAssignTeacherId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">— Select teacher —</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Students (click to select)</label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y">
              {students.map(s => {
                const selected = assignStudentIds.includes(s.id);
                const already = selectedClass?.student_ids?.includes(s.id);
                return (
                  <button key={s.id} type="button" onClick={() => toggleStudent(s.id)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${selected ? 'bg-indigo-50' : ''}`}>
                    <input type="checkbox" readOnly checked={selected || already} className="rounded" />
                    <span className={already ? 'text-gray-400' : 'text-gray-800'}>{s.full_name}</span>
                    {already && <span className="text-xs text-gray-400">(already assigned)</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAssignModal(null)}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={() => handleAssign(showAssignModal)} disabled={submitting}
              className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
