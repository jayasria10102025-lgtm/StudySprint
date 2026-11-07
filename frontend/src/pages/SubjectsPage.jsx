import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Clock,
  CheckCircle2,
  Target,
  Edit2,
  Trash2,
  AlertCircle,
  Palette,
  ShieldAlert
} from 'lucide-react';
import api from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatDuration } from '../utils/formatters';

const PRESET_COLORS = [
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#EF4444'  // Red
];

export const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#8B5CF6'
  });

  // Safe delete dialog & cascade state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [cascadeRequired, setCascadeRequired] = useState(false);
  const [relationCounts, setRelationCounts] = useState({ goals: 0, sessions: 0, notes: 0 });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subjects');
      if (res.data.success) {
        setSubjects(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedSubjectId(null);
    setModalError('');
    setFormData({
      name: '',
      description: '',
      color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (subject) => {
    setIsEditing(true);
    setSelectedSubjectId(subject._id);
    setModalError('');
    setFormData({
      name: subject.name,
      description: subject.description || '',
      color: subject.color || '#8B5CF6'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.name.trim()) {
      return setModalError('Please enter a subject name');
    }

    try {
      setIsSubmitting(true);
      if (isEditing) {
        const res = await api.put(`/subjects/${selectedSubjectId}`, formData);
        if (res.data.success) {
          setIsModalOpen(false);
          fetchSubjects();
        }
      } else {
        const res = await api.post('/subjects', formData);
        if (res.data.success) {
          setIsModalOpen(false);
          fetchSubjects();
        }
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe delete handler: checks if deletion would orphan records
  const initiateDelete = async (subject) => {
    setSubjectToDelete(subject);
    setCascadeRequired(false);
    setRelationCounts({ goals: 0, sessions: 0, notes: 0 });

    try {
      // First attempt a normal safe delete
      const res = await api.delete(`/subjects/${subject._id}`);
      if (res.data.success) {
        fetchSubjects();
      }
    } catch (err) {
      if (err.response && err.response.status === 409 && err.response.data.requiresCascade) {
        // Subject has relations! Open safe cascade confirmation modal
        setCascadeRequired(true);
        setRelationCounts(err.response.data.counts || { goals: 0, sessions: 0, notes: 0 });
        setIsDeleteModalOpen(true);
      } else {
        alert(err.response?.data?.message || err.message || 'Failed to delete subject');
      }
    }
  };

  // User confirmed cascade deletion
  const confirmCascadeDelete = async () => {
    if (!subjectToDelete) return;
    try {
      const res = await api.delete(`/subjects/${subjectToDelete._id}?cascade=true`);
      if (res.data.success) {
        setIsDeleteModalOpen(false);
        setSubjectToDelete(null);
        setCascadeRequired(false);
        fetchSubjects();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Cascade deletion failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Academic Subjects</h2>
          <p className="text-xs text-slate-400">
            Organize coursework, track accumulated study hours, and monitor completed sessions
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-md shadow-purple-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      ) : subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <div
              key={sub._id}
              className="p-6 rounded-2xl bg-[#131A29] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg shadow-black/20 group"
            >
              <div>
                {/* Header with color pill and action buttons */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-md"
                      style={{ backgroundColor: sub.color || '#8B5CF6' }}
                    />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Subject
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(sub)}
                      title="Edit subject"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => initiateDelete(sub)}
                      title="Delete subject"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Name & Description */}
                <h3 className="text-lg font-bold text-white tracking-tight mb-1.5">{sub.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[32px]">
                  {sub.description || 'No additional syllabus description provided.'}
                </p>

                {/* Subject Statistics */}
                <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-xl bg-[#161F33] border border-slate-800/80 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Time</p>
                    <p className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                      {formatDuration(sub.totalStudySeconds)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Sessions</p>
                    <p className="text-sm font-bold font-mono text-white mt-0.5">
                      {sub.completedSessionsCount || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Active Goals</p>
                    <p className="text-sm font-bold font-mono text-purple-300 mt-0.5">
                      {sub.activeGoalsCount || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Action Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <a
                  href="/timer"
                  className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-1"
                >
                  <Clock className="w-3 h-3" /> Focus on this subject
                </a>
                <a
                  href="/notes"
                  className="text-slate-400 hover:text-slate-200"
                >
                  View Notes →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No subjects registered yet"
          description="Create your first subject (e.g. Mathematics, Machine Learning, Chemistry) to categorize your study sprints."
          actionText="Add New Subject"
          onAction={openCreateModal}
        />
      )}

      {/* Create / Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#161F33] border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {isEditing ? 'Edit Subject' : 'Add Academic Subject'}
            </h3>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase font-semibold text-slate-300 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Distributed Systems"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block uppercase font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Course overview, textbook, exam schedule..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block uppercase font-semibold text-slate-300 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        formData.color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#161F33]' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-medium text-slate-300 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-md shadow-purple-600/30"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Cascade Deletion Protection Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        isDanger={true}
        title="Safe Deletion Protection Triggered"
        message={`Cannot safely delete "${subjectToDelete?.name}" because it contains linked items in your workspace:`}
        details={
          <div className="space-y-1">
            <p>• <span className="font-bold text-white">{relationCounts.goals}</span> Study Goals linked</p>
            <p>• <span className="font-bold text-white">{relationCounts.sessions}</span> Study Sessions recorded</p>
            <p>• <span className="font-bold text-white">{relationCounts.notes}</span> Study Notes written</p>
            <p className="mt-2 text-amber-300 font-semibold">
              Deleting this subject will cleanly remove all associated records to avoid orphan data.
            </p>
          </div>
        }
        confirmText="Confirm Cascade Delete"
        cancelText="Cancel & Keep Data"
        onConfirm={confirmCascadeDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSubjectToDelete(null);
        }}
      />
    </div>
  );
};

