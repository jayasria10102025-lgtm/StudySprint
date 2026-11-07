import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';
import { useAuth } from '../context/AuthContext';

const getPageMetadata = (pathname) => {
  switch (pathname) {
    case '/dashboard':
      return { title: 'Dashboard Overview', subtitle: 'Your study progress, metrics, and recent activity' };
    case '/timer':
      return { title: 'Focus Timer', subtitle: 'Deep work tracker with timestamp accuracy' };
    case '/goals':
      return { title: 'Study Goals', subtitle: 'Define targets and track real completion progress' };
    case '/subjects':
      return { title: 'My Subjects', subtitle: 'Manage academic disciplines and track aggregated time' };
    case '/notes':
      return { title: 'Study Notes', subtitle: 'Quick review notes organized by subject' };
    case '/analytics':
      return { title: 'Analytics & Insights', subtitle: 'Detailed breakdowns of your productivity habits' };
    case '/settings':
      return { title: 'Account Settings', subtitle: 'Manage your profile and security credentials' };
    default:
      return { title: 'StudySprint', subtitle: 'Focused study session tracker' };
  }
};

export const DashboardLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0B0F17]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-cyan-400 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading StudySprint...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const { title, subtitle } = getPageMetadata(location.pathname);

  return (
    <div className="min-h-screen bg-[#0B0F17] flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <TopHeader title={title} subtitle={subtitle} setMobileOpen={setMobileOpen} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

