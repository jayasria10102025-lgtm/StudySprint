import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Timer,
  Target,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Shield,
  Zap,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Timer,
      title: 'Precision Focus Timer',
      desc: 'Eliminate interval drift. Our timestamp-verified study timer guarantees that page refreshes or device pauses never corrupt your logged hours.',
      color: 'purple'
    },
    {
      icon: Target,
      title: 'Targeted Study Goals',
      desc: 'Establish daily, weekly, or milestone goals for each subject. Watch actual completed focus time fill up your goal meters in real-time.',
      color: 'cyan'
    },
    {
      icon: BarChart3,
      title: 'Actionable Productivity Analytics',
      desc: 'Visualize daily routines, weekly consistency, and subject distribution with interactive, real MongoDB-powered charts.',
      color: 'emerald'
    },
    {
      icon: BookOpen,
      title: 'Subject Intelligence & Notes',
      desc: 'Organize notes and track subject-level aggregate hours. Keep key formulas and study takeaways right where you focus.',
      color: 'amber'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col selection:bg-purple-600/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0B0F17]/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 shadow-lg shadow-purple-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Study<span className="text-cyan-400">Sprint</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-md shadow-purple-600/30"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-md shadow-purple-600/30 hover:scale-[1.02]"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[250px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-xs font-semibold text-purple-300 mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>The Modern Study Tracker for Serious Students</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-6">
            Make Every Study <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-purple-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">
              Session Count.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 mb-10 leading-relaxed font-normal">
            Track focused hours across subjects, bridge the gap between planned and actual study time, and build high-performance study habits with verifiable MongoDB data.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-xl shadow-purple-600/30 hover:scale-[1.02]"
            >
              Start Tracking Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold text-slate-200 bg-[#161F33] hover:bg-[#1E293B] border border-slate-700/80 rounded-xl transition-all"
            >
              Sign In to Account
            </Link>
          </div>

          {/* Social Proof / Key Highlights */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-[#131A29]/70 border border-slate-800/80">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-slate-400">Database Persisted</p>
            </div>
            <div className="p-4 rounded-xl bg-[#131A29]/70 border border-slate-800/80">
              <p className="text-2xl font-bold text-cyan-400">Zero</p>
              <p className="text-xs text-slate-400">Timer Drift</p>
            </div>
            <div className="p-4 rounded-xl bg-[#131A29]/70 border border-slate-800/80">
              <p className="text-2xl font-bold text-purple-400">Real-Time</p>
              <p className="text-xs text-slate-400">Goal Progress</p>
            </div>
            <div className="p-4 rounded-xl bg-[#131A29]/70 border border-slate-800/80">
              <p className="text-2xl font-bold text-emerald-400">Dark</p>
              <p className="text-xs text-slate-400">Eye-Friendly SaaS</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 bg-[#0E1422] border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs uppercase tracking-widest font-bold text-cyan-400 mb-2">Engineered for Academic Excellence</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Everything you need to master your study routine
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-7 rounded-2xl bg-[#131A29] border border-slate-800 hover:border-purple-500/40 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-purple-600/15 text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-[#090D14] border-t border-slate-800 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} StudySprint. Full-Stack Focused Study Session Tracker.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-slate-300">Sign In</Link>
            <Link to="/register" className="hover:text-slate-300">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

