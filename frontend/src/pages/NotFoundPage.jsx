import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col items-center justify-center p-4 text-center">
      <div className="p-4 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 mb-4">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-2">404 - Page Not Found</h1>
      <p className="text-slate-400 max-w-sm text-sm mb-6">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/30"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};

