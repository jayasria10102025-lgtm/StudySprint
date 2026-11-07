import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import api from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { ConfirmModal } from '../components/ConfirmModal';
import { formatDate } from '../utils/formatters';

export const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    subjectId: '',
    title: '',
    content: ''
  });

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);

  const fetchNotes = async (search = searchQuery, subjectId = selectedSubjectFilter) => {
    try {
      setLoading(true);
      let url = '/notes?';
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;
      if (subjectId !== 'all') url += `subjectId=${subjectId}&`;

      const [notesRes, subjectsRes] = await Promise.all([
        api.get(url),
        api.get('/subjects')
      ]);

      if (notesRes.data.success) setNotes(notesRes.data.data);
      if (subjectsRes.data.success) {
        setSubjects(subjectsRes.data.data);
        if (subjectsRes.data.data.length > 0 && !formData.subjectId) {
          setFormData(prev => ({ ...prev, subjectId: subjectsRes.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes(searchQuery, selectedSubjectFilter);
  }, [selectedSubjectFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNotes(searchQuery, selectedSubjectFilter);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedNoteId(null);
    setModalError('');
    setFormData({
      subjectId: subjects[0]?._id || '',
      title: '',
      content: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (note) => {
    setIsEditing(true);
    setSelectedNoteId(note._id);
    setModalError('');
    setFormData({
      subjectId: note.subjectId?._id || note.subjectId || '',
      title: note.title,
      content: note.content
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.title.trim()) {
      return setModalError('Please enter a note title');
    }
    if (!formData.subjectId) {
      return setModalError('Please select a subject');
    }
    if (!formData.content.trim()) {
      return setModalError('Please write some note content');
    }

    try {
      setIsSubmitting(true);
      if (isEditing) {
        const res = await api.put(`/notes/${selectedNoteId}`, formData);
        if (res.data.success) {
          setIsModalOpen(false);
          fetchNotes();
        }
      } else {
        const res = await api.post('/notes', formData);
        if (res.data.success) {
          setIsModalOpen(false);
          fetchNotes();
        }
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!noteToDelete) return;
    try {
      await api.delete(`/notes/${noteToDelete._id}`);
      setIsDeleteModalOpen(false);
      setNoteToDelete(null);
      fetchNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Study Notes</h2>
          <p className="text-xs text-slate-400">
            Write, review, and search revision notes organized by academic discipline
          </p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={subjects.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all shadow-md shadow-purple-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Note</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-2xl bg-[#131A29] border border-slate-800 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by keyword or title..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#161F33] border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Subject:</span>
          </div>
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#161F33] border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-purple-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      ) : notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <div
              key={note._id}
              className="p-5 rounded-2xl bg-[#131A29] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg shadow-black/20 group"
            >
              <div>
                {/* Subject badge & action buttons */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5"
                    style={{
                      backgroundColor: `${note.subjectId?.color || '#8B5CF6'}20`,
                      color: note.subjectId?.color || '#A78BFA',
                      border: `1px solid ${note.subjectId?.color || '#8B5CF6'}40`
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: note.subjectId?.color || '#8B5CF6' }}
                    />
                    <span>{note.subjectId?.name || 'Subject'}</span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(note)}
                      title="Edit note"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setNoteToDelete(note);
                        setIsDeleteModalOpen(true);
                      }}
                      title="Delete note"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight mb-2">{note.title}</h3>
                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-normal line-clamp-6 bg-[#161F33]/60 p-3 rounded-xl border border-slate-800/80">
                  {note.content}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(note.updatedAt || note.createdAt)}
                </span>
                <span>{note.content.length} chars</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No study notes found"
          description={
            searchQuery
              ? `No notes matched your search query "${searchQuery}". Try different keywords.`
              : 'Write down summaries, key theorems, equations, and cheat-sheets for your subjects.'
          }
          actionText={subjects.length === 0 ? 'Create Subject First' : 'Create First Note'}
          onAction={subjects.length === 0 ? () => (window.location.href = '/subjects') : openCreateModal}
        />
      )}

      {/* Create / Edit Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl p-6 rounded-2xl bg-[#161F33] border border-slate-700 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">
              {isEditing ? 'Edit Study Note' : 'Create New Study Note'}
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
                  Note Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Master Theorem & Recurrence Relations"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block uppercase font-semibold text-slate-300 mb-1">
                  Note Content *
                </label>
                <textarea
                  rows="8"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write formulas, proofs, summary points, or code snippets..."
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#1A2234] border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-purple-500"
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
                  {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Note'}
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
        title="Delete Study Note?"
        message={`Are you sure you want to delete note "${noteToDelete?.title}"? This cannot be undone.`}
        confirmText="Yes, Delete Note"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};

