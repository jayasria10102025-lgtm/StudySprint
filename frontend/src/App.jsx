import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TimerProvider } from './context/TimerContext';
import { DashboardLayout } from './layouts/DashboardLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { FocusTimerPage } from './pages/FocusTimerPage';
import { GoalsPage } from './pages/GoalsPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { NotesPage } from './pages/NotesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TimerProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Dashboard Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/timer" element={<FocusTimerPage />} />
              <Route path="/focus-timer" element={<FocusTimerPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/study-goals" element={<GoalsPage />} />
              <Route path="/subjects" element={<SubjectsPage />} />
              <Route path="/academic-subjects" element={<SubjectsPage />} />
              <Route path="/my-subjects" element={<SubjectsPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/study-notes" element={<NotesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Catch All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </TimerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
