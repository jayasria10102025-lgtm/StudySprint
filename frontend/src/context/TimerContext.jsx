import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const TimerContext = createContext(null);

export const TimerProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [activeSession, setActiveSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  // Compute live elapsed seconds
  const calculateElapsed = (session) => {
    if (!session) return 0;
    if (session.status === 'paused') {
      return session.accumulatedDuration || 0;
    }
    if (session.status === 'active') {
      const resumedAt = session.lastResumedAt
        ? new Date(session.lastResumedAt).getTime()
        : new Date(session.startTime).getTime();
      const extra = Math.max(0, Math.floor((Date.now() - resumedAt) / 1000));
      return (session.accumulatedDuration || 0) + extra;
    }
    return session.duration || 0;
  };

  // Fetch active session from MongoDB on load / auth change
  const refreshActiveSession = async () => {
    if (!isAuthenticated) {
      setActiveSession(null);
      setElapsedSeconds(0);
      return;
    }
    try {
      const res = await api.get('/sessions/active');
      if (res.data.success && res.data.session) {
        setActiveSession(res.data.session);
        setElapsedSeconds(calculateElapsed(res.data.session));
      } else {
        setActiveSession(null);
        setElapsedSeconds(0);
      }
    } catch (err) {
      console.error('Error fetching active session:', err);
    }
  };

  useEffect(() => {
    refreshActiveSession();
  }, [isAuthenticated]);

  // Tick timer every second when session is active
  useEffect(() => {
    if (activeSession && activeSession.status === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(calculateElapsed(activeSession));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (activeSession && activeSession.status === 'paused') {
        setElapsedSeconds(activeSession.accumulatedDuration || 0);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession]);

  const startSession = async ({ subjectId, goalId, title, description }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/sessions/start', {
        subjectId,
        goalId: goalId || null,
        title,
        description
      });
      if (res.data.success) {
        setActiveSession(res.data.session);
        setElapsedSeconds(0);
        return { success: true, session: res.data.session };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to start session';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSession = async () => {
    if (!activeSession) return { success: false, message: 'No active session' };
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.patch(`/sessions/${activeSession._id}/pause`);
      if (res.data.success) {
        setActiveSession(res.data.session);
        setElapsedSeconds(res.data.session.accumulatedDuration || 0);
        return { success: true, session: res.data.session };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to pause session';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const resumeSession = async () => {
    if (!activeSession) return { success: false, message: 'No active session' };
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.patch(`/sessions/${activeSession._id}/resume`);
      if (res.data.success) {
        setActiveSession(res.data.session);
        setElapsedSeconds(res.data.session.accumulatedDuration || 0);
        return { success: true, session: res.data.session };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resume session';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const completeSession = async () => {
    if (!activeSession) return { success: false, message: 'No active session' };
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.patch(`/sessions/${activeSession._id}/complete`);
      if (res.data.success) {
        const completed = res.data.session;
        setActiveSession(null);
        setElapsedSeconds(0);
        return { success: true, session: completed };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to complete session';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSession = async () => {
    if (!activeSession) return { success: false, message: 'No active session' };
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.patch(`/sessions/${activeSession._id}/cancel`);
      if (res.data.success) {
        setActiveSession(null);
        setElapsedSeconds(0);
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel session';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TimerContext.Provider
      value={{
        activeSession,
        elapsedSeconds,
        isLoading,
        error,
        startSession,
        pauseSession,
        resumeSession,
        completeSession,
        cancelSession,
        refreshActiveSession
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
