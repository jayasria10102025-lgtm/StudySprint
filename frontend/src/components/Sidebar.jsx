import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Timer,
  Target,
  BookOpen,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { formatDigitalTime } from '../utils/formatters';

const navItems = [
  { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Focus Timer', path: '/timer', icon: Timer },
  { name: 'Study Goals', path: '/goals', icon: Target },
  { name: 'My Subjects', path: '/subjects', icon: BookOpen },
  { name: 'Study Notes', path: '/notes', icon: FileText },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const { activeSession, elapsedSeconds } = useTimer();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-[#0F1626] border-r border-[#1E293B] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#1E293B]">
          <NavLink to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1">
                Study<span className="text-cyan-400">Sprint</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Focus & Track</span>
            </div>
          </NavLink>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-[#161F33]'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
                {item.name === 'Focus Timer' && activeSession && (
                  <span className="ml-auto flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Active Timer Mini Banner */}
        {activeSession && (
          <div className="p-3 mx-3 mb-3 rounded-xl bg-purple-950/40 border border-purple-700/40 shadow-inner">
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="font-semibold text-purple-300 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {activeSession.status === 'active' ? 'Active Focus' : 'Paused'}
              </span>
              <span className="font-mono text-cyan-300 font-bold">
                {formatDigitalTime(elapsedSeconds)}
              </span>
            </div>
            <p className="text-xs text-slate-300 truncate font-medium">
              {activeSession.title}
            </p>
            <NavLink
              to="/timer"
              onClick={() => setMobileOpen(false)}
              className="mt-2 block w-full py-1 text-center text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
            >
              Open Timer
            </NavLink>
          </div>
        )}

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-[#1E293B]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#161F33]/80 border border-slate-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/30 text-purple-300 font-semibold text-xs border border-purple-500/20">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Student'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
