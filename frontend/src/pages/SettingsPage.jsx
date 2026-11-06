import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  LogOut,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Database,
  Calendar
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatters';

export const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) {
      return setProfileError('Name cannot be empty');
    }

    try {
      setProfileLoading(true);
      const res = await api.put('/users/profile', { name: name.trim(), email: email.trim() });
      if (res.data.success) {
        updateUser(res.data.user);
        setProfileSuccess('Profile updated successfully!');
        setTimeout(() => setProfileSuccess(''), 5000);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      return setPasswordError('Current password is required');
    }
    if (newPassword.length < 6) {
      return setPasswordError('New password must be at least 6 characters long');
    }
    if (newPassword !== confirmNewPassword) {
      return setPasswordError('New passwords do not match');
    }

    try {
      setPasswordLoading(true);
      const res = await api.put('/users/change-password', {
        currentPassword,
        newPassword
      });
      if (res.data.success) {
        setPasswordSuccess('Password successfully changed!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => setPasswordSuccess(''), 5000);
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Account Settings</h2>
        <p className="text-xs text-slate-400">
          Manage your personal profile, credentials, and data security
        </p>
      </div>

      {/* Profile Information Section */}
      <div className="p-6 rounded-2xl bg-[#131A29] border border-slate-800 shadow-xl shadow-black/20">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-purple-600/15 text-purple-400 border border-purple-500/20">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Profile Information</h3>
            <p className="text-xs text-slate-400">Update your account name and email address</p>
          </div>
        </div>

        {profileSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl text-xs">
          <div>
            <label className="block uppercase font-semibold text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block uppercase font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-md shadow-purple-600/30 disabled:opacity-50"
            >
              {profileLoading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="p-6 rounded-2xl bg-[#131A29] border border-slate-800 shadow-xl shadow-black/20">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-cyan-600/15 text-cyan-400 border border-cyan-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Security & Password</h3>
            <p className="text-xs text-slate-400">Change your password to keep your StudySprint account safe</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl text-xs">
          <div>
            <label className="block uppercase font-semibold text-slate-300 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block uppercase font-semibold text-slate-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block uppercase font-semibold text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Repeat new password"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A2234] border border-slate-700 text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-cyan-600 hover:bg-cyan-500 transition-colors shadow-md shadow-cyan-600/30 disabled:opacity-50"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Info & Session Signout */}
      <div className="p-6 rounded-2xl bg-[#131A29] border border-slate-800 shadow-xl shadow-black/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Active Session & Sign Out</h3>
          <p className="text-xs text-slate-400">
            Account created on {formatDate(user?.createdAt)}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/20 transition-all shadow-md"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of StudySprint</span>
        </button>
      </div>
    </div>
  );
};
