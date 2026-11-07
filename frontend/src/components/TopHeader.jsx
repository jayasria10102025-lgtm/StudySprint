import React from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, Timer, Play, Pause, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { formatDigitalTime } from '../utils/formatters';

export const TopHeader = ({ title, subtitle, setMobileOpen }) => {
  const { user } = useAuth();
  const { activeSession, elapsedSeconds, pauseSession, resumeSession } = useTimer();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-[#0B0F17]/90 backdrop-blur-md border-b border-[#1E293B]">
      {/* Left: Mobile Toggle & Page Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#161F33] lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      {/* Right: Quick Active Timer Pill & User Status */}
      <div className="flex items-center gap-3">
        {activeSession ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/50 border border-purple-500/30 text-xs shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeSession.status === 'active' ? 'bg-cyan-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${activeSession.status === 'active' ? 'bg-cyan-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="hidden sm:inline font-medium text-slate-300 truncate max-w-[120px]">
              {activeSession.subjectId?.name || 'Session'}
            </span>
            <span className="font-mono font-bold text-cyan-300">
              {formatDigitalTime(elapsedSeconds)}
            </span>
            <div className="flex items-center ml-1">
              {activeSession.status === 'active' ? (
                <button
                  onClick={pauseSession}
                  title="Pause timer"
                  className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-purple-800/60"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={resumeSession}
                  title="Resume timer"
                  className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-purple-800/60"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}
              <NavLink
                to="/timer"
                title="View Focus Timer"
                className="p-1 ml-1 rounded-full text-purple-300 hover:text-purple-100 hover:bg-purple-800/60"
              >
                <Timer className="w-3.5 h-3.5" />
              </NavLink>
            </div>
          </div>
        ) : (
          <NavLink
            to="/timer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-[#161F33] hover:bg-[#1E293B] border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <Timer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Start Session</span>
          </NavLink>
        )}

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-600 text-white font-semibold text-xs shadow-md shadow-purple-900/30">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

