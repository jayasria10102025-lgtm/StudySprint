import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Target,
  Sparkles,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';
import { useTimer } from '../context/TimerContext';
import { formatDigitalTime, formatDuration } from '../utils/formatters';
import { ConfirmModal } from '../components/ConfirmModal';

export const FocusTimerPage = () => {
  const {
    activeSession,
    elapsedSeconds,
    isLoading,
    error: timerError,
    startSession,
    pauseSession,
    resumeSession,
    completeSession,
    cancelSession
  } = useTimer();

  const [subjects, setSubjects] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Form State when no session is active
  const [formData, setFormData] = useState({
    subjectId: '',
    goalId: '',
    title: '',
    description: ''
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals for confirmation
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Load user's subjects and active goals
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoadingMetadata(true);
        const [subRes, goalRes] = await Promise.all([
          api.get('/subjects'),
          api.get('/goals')
        ]);
        if (subRes.data.success) {
          setSubjects(subRes.data.data);
          if (subRes.data.data.length > 0 && !formData.subjectId) {
            setFormData(prev => ({ ...prev, subjectId: subRes.data.data[0]._id }));
          }
        }
        if (goalRes.data.success) {
          setGoals(goalRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching timer metadata:', err);
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, []);

  // Filter goals for selected subject
  const availableGoals = goals.filter(
    g => g.subjectId && String(g.subjectId._id || g.subjectId) === String(formData.subjectId)
  );

  const handleStart = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!formData.subjectId) {
      return setFormError('Please select a subject to study');
    }
    if (!formData.title.trim()) {
      return setFormError('Please enter a session title');
    }

    const res = await startSession({
      subjectId: formData.subjectId,
      goalId: formData.goalId || null,
      title: formData.title.trim(),
      description: formData.description.trim()
    });

    if (!res.success) {
      setFormError(res.message || 'Failed to start session');
    } else {
      setFormData(prev => ({ ...prev, title: '', description: '' }));
    }
  };

  const handleConfirmComplete = async () => {
    setIsCompleteModalOpen(false);
    const res = await completeSession();
    if (res.success) {
      setSuccessMessage(`Great work! Focus sprint of ${formatDuration(res.session.duration)} successfully recorded.`);
      setTimeout(() => setSuccessMessage(''), 8000);
    }
  };

  const handleConfirmCancel = async () => {
    setIsCancelModalOpen(false);
    const res = await cancelSession();
    if (res.success) {
      setSuccessMessage('Session was cancelled. Duration was not added to your study statistics.');
      setTimeout(() => setSuccessMessage(''), 8000);
    }
  };

  // Circular progress representation (arbitrary 60m cycle)
  const cycleSeconds = 60 * 60; // 60 minutes circle
  const progressPercent = Math.min(100, (elapsedSeconds % cycleSeconds) / cycleSeconds * 100);
  const strokeDashoffset = 100 - progressPercent;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {(formError || timerError) && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <span>{formError || timerError}</span>
        </div>
      )}

      {/* Main Focus Timer Display Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-[#131A29] border border-slate-800 shadow-2xl shadow-black/40 flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow background accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Current Status Pill */}
        <div className="mb-6 flex items-center gap-2">
          {activeSession ? (
            <span
              className={`px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${
                activeSession.status === 'active'
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeSession.status === 'active' ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <span>{activeSession.status === 'active' ? 'Focus Session Active' : 'Session Paused'}</span>
            </span>
          ) : (
            <span className="px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-800/80 text-slate-400 border border-slate-700">
              Ready to Focus
            </span>
          )}
        </div>

        {/* Subject & Title display if session active */}
        {activeSession && (
          <div className="mb-6 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#161F33] border border-slate-700/80 text-xs font-medium text-slate-300 mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: activeSession.subjectId?.color || '#8B5CF6' }}
              />
              <span>{activeSession.subjectId?.name || 'Subject'}</span>
              {activeSession.goalId?.title && (
                <span className="text-slate-400 border-l border-slate-700 pl-2">
                  Goal: {activeSession.goalId.title}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{activeSession.title}</h2>
            {activeSession.description && (
              <p className="mt-1 text-xs text-slate-400">{activeSession.description}</p>
            )}
          </div>
        )}

        {/* Circular Digital Timer Display */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-4 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-[#1A2234] stroke-current"
              strokeWidth="5"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-purple-500 stroke-current transition-all duration-1000 ease-linear"
              strokeWidth="5"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 * (1 - (progressPercent / 100))}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Time digits */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-4xl sm:text-5xl font-black text-white tracking-tight">
              {formatDigitalTime(elapsedSeconds)}
            </span>
            <span className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
              {activeSession ? (activeSession.status === 'active' ? 'Elapsed Time' : 'Paused') : 'Sprint Ready'}
            </span>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {activeSession ? (
            <>
              {activeSession.status === 'active' ? (
                <button
                  type="button"
                  onClick={pauseSession}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-all shadow-lg shadow-amber-600/20 active:scale-95"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Timer</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeSession}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/30 active:scale-95"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume Timer</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCompleteModalOpen(true)}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Session</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCancelModalOpen(true)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <p className="text-xs text-slate-400">
              Fill in the session details below and click <span className="text-purple-400 font-semibold">Start Focus Session</span>.
            </p>
          )}
        </div>
      </div>

      {/* Start Session Setup Form (When No Active Session) */}
      {!activeSession && (
        <div className="p-6 rounded-2xl bg-[#131A29] border border-slate-800 shadow-xl shadow-black/20">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-purple-600/15 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Configure Next Study Sprint</h3>
              <p className="text-xs text-slate-400">Select your discipline, specify topic, and link a target goal</p>
            </div>
          </div>

          {subjects.length === 0 && !loadingMetadata ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-center justify-between">
              <span>You don't have any subjects yet. Create your first subject to begin tracking!</span>
              <a
                href="/subjects"
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
              >
                Add Subject
              </a>
            </div>
          ) : (
            <form onSubmit={handleStart} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Subject <span className="text-purple-400">*</span>
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value, goalId: '' })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    {subjects.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Optional Goal Link */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Link Study Goal <span className="text-slate-500">(Optional)</span>
                  </label>
                  <select
                    value={formData.goalId}
                    onChange={(e) => setFormData({ ...formData, goalId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="">No goal attached</option>
                    {availableGoals.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.title} ({g.plannedDuration}m)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Session Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Session Title <span className="text-purple-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Solving Dynamic Programming Practice Set"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A2234] border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Optional Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Session Notes / Agenda <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key problems to solve, chapters to read, or formulas to memorize..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A2234] border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || subjects.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-all shadow-lg shadow-purple-600/30"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Focus Session</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Confirmation Modal: Complete Session */}
      <ConfirmModal
        isOpen={isCompleteModalOpen}
        title="Complete Study Session?"
        message={`You are about to complete this session with an elapsed duration of ${formatDuration(elapsedSeconds)}. This will be permanently saved to your MongoDB database.`}
        confirmText="Save & Complete"
        cancelText="Keep Focusing"
        onConfirm={handleConfirmComplete}
        onClose={() => setIsCompleteModalOpen(false)}
      />

      {/* Confirmation Modal: Cancel Session */}
      <ConfirmModal
        isOpen={isCancelModalOpen}
        isDanger={true}
        title="Cancel Active Session?"
        message="Are you sure you want to cancel this session? Cancelled sessions are discarded and will NOT be counted toward your study hours or goal completion."
        confirmText="Yes, Cancel Session"
        cancelText="Never Mind"
        onConfirm={handleConfirmCancel}
        onClose={() => setIsCancelModalOpen(false)}
      />
    </div>
  );
};
