import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  Filter,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatMinutesToHours, formatDate } from '../utils/formatters';

export const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    subjectId: '',
    title: '',
    description: '',
    plannedDuration: 60,
    targetDate: '',
    goalType: 'weekly'
  });

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [goalsRes, subjectsRes] = await Promise.all([
        api.get('/goals'),
        api.get('/subjects')
      ]);
      if (goalsRes.data.success) setGoals(goalsRes.data.data);
      if (subjectsRes.data.success) {
        setSubjects(subjectsRes.data.data);
        if (subjectsRes.data.data.length > 0 && !formData.subjectId) {
          setFormData(prev => ({ ...prev, subjectId: subjectsRes.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedGoalId(null);
    setModalError('');
    // Default target date 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setFormData({
      subjectId: subjects[0]?._id || '',
      title: '',
      description: '',
      plannedDuration: 120,
      targetDate: d.toISOString().split('T')[0],
      goalType: 'weekly'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (goal) => {
    setIsEditing(true);
    setSelectedGoalId(goal._id);
    setModalError('');
    setFormData({
      subjectId: goal.subjectId?._id || goal.subjectId || '',
      title: goal.title,
      description: goal.description || '',
      plannedDuration: goal.plannedDuration,
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
      goalType: goal.goalType || 'custom'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.title.trim()) {
      return setModalError('Please enter a goal title');
    }
    if (!formData.subjectId) {
      return setModalError('Please select a subject');
    }
    if (formData.plannedDuration <= 0) {
      return setModalError('Planned duration must be greater than 0 minutes');
    }
    if (!formData.targetDate) {
      return setModalError('Please specify a target date');
    }

    try {
      setIsSubmitting(true);
      if (isEditing) {
        const res = await api.put(`/goals/${selectedGoalId}`, formData);
        if (res.data.success) {
          setIsModalOpen(false);
          fetchData();
        }
      } else {
        const res = await api.post('/goals', formData);
        if (res.data.success) {
          setIsModalOpen(false);
          fetchData();
        }
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (goal) => {
    const newStatus = goal.status === 'completed' ? 'in_progress' : 'completed';
    try {
      await api.put(`/goals/${goal._id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error('Error toggling goal status:', err);
    }
  };

  const handleDelete = async () => {
    if (!goalToDelete) return;
    try {
      await api.delete(`/goals/${goalToDelete._id}`);
      setIsDeleteModalOpen(false);
      setGoalToDelete(null);
      fetchData();
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  const filteredGoals = goals.filter((g) => {
    const matchSubject = filterSubject === 'all' || String(g.subjectId?._id || g.subjectId) === filterSubject;
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'completed' && (g.status === 'completed' || g.progressPercent >= 100)) ||
      (filterStatus === 'in_progress' && g.status === 'in_progress' && g.progressPercent < 100);
    return matchSubject && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Study Goals</h2>
          <p className="text-xs text-slate-400">
            Define target durations and compare against actual focused study time in MongoDB
          </p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={subjects.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all shadow-md shadow-purple-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Study Goal</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#131A29] border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-[#161F33] border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-[#161F33] border border-slate-700 text-slate-200 focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Statuses</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <span className="ml-auto text-slate-400">
          Showing {filteredGoals.length} of {goals.length} goals
        </span>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      ) : filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const isFinished = goal.status === 'completed' || goal.progressPercent >= 100;
            return (
              <div
                key={goal._id}
                className="p-5 rounded-2xl bg-[#131A29] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg shadow-black/20"
              >
                <div>
                  {/* Subject badge & options */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${goal.subjectId?.color || '#8B5CF6'}20`,
                        color: goal.subjectId?.color || '#A78BFA',
                        border: `1px solid ${goal.subjectId?.color || '#8B5CF6'}40`
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: goal.subjectId?.color || '#8B5CF6' }}
                      />
                      <span>{goal.subjectId?.name || 'Subject'}</span>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(goal)}
                        title="Edit goal"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setGoalToDelete(goal);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Delete goal"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white tracking-tight mb-1">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {goal.description}
                    </p>
                  )}

                  {/* Progress Bar & Durations */}
                  <div className="my-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Study Progress</span>
                      <span className="font-mono font-bold text-cyan-300">
                        {goal.completedDurationMinutes || 0}m / {goal.plannedDuration}m
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFinished
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                            : 'bg-gradient-to-r from-purple-500 to-cyan-400'
                        }`}
                        style={{ width: `${Math.min(100, goal.progressPercent || 0)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{goal.progressPercent || 0}% Completed</span>
                      <span className="capitalize">{goal.goalType} Goal</span>
                    </div>
                  </div>
                </div>

                {/* Footer: Target date & Toggle complete */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Target: {formatDate(goal.targetDate)}</span>
                  </span>

                  <button
                    onClick={() => handleToggleStatus(goal)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      isFinished
                        ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-purple-600 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{isFinished ? 'Completed' : 'Mark Done'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No study goals found"
          description={
            subjects.length === 0
              ? 'Create a subject first before defining your goals.'
              : 'Set your first academic goal to track planned duration against actual focus time.'
          }
          actionText={subjects.length === 0 ? 'Create Subject' : 'Add Study Goal'}
          onAction={subjects.length === 0 ? () => (window.location.href = '/subjects') : openCreateModal}
        />
      )}

      {/* Create / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-[#161F33] border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {isEditing ? 'Edit Study Goal' : 'Create New Study Goal'}
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
                  Subject *
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  {subjects.map((sub) => (
                    <option key={sub._id} value={sub._id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block uppercase font-semibold text-slate-300 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Master Binary Search Trees"
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
                  placeholder="Outline syllabus units or chapters to complete..."
                  className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase font-semibold text-slate-300 mb-1">
                    Planned Duration (mins) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.plannedDuration}
                    onChange={(e) => setFormData({ ...formData, plannedDuration: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    ≈ {formatMinutesToHours(formData.plannedDuration)}
                  </span>
                </div>

                <div>
                  <label className="block uppercase font-semibold text-slate-300 mb-1">
                    Goal Type
                  </label>
                  <select
                    value={formData.goalType}
                    onChange={(e) => setFormData({ ...formData, goalType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="daily">Daily Target</option>
                    <option value="weekly">Weekly Target</option>
                    <option value="custom">Custom Milestone</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block uppercase font-semibold text-slate-300 mb-1">
                  Target Completion Date *
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
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
                  {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        isDanger={true}
        title="Delete Study Goal?"
        message={`Are you sure you want to delete "${goalToDelete?.title}"? Completed study sessions will remain preserved in your history, but will be unlinked from this goal.`}
        confirmText="Yes, Delete Goal"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
