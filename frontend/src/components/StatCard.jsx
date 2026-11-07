import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, badge, color = 'purple' }) => {
  const colorStyles = {
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/40',
      iconBg: 'bg-purple-600/15 text-purple-400 border border-purple-500/20',
      badge: 'bg-purple-950/60 text-purple-300 border-purple-800'
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-600/15 text-cyan-400 border border-cyan-500/20',
      badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-800'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20',
      badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-600/15 text-amber-400 border border-amber-500/20',
      badge: 'bg-amber-950/60 text-amber-300 border-amber-800'
    }
  };

  const currentTheme = colorStyles[color] || colorStyles.purple;

  return (
    <div
      className={`relative p-5 rounded-2xl bg-[#131A29] border ${currentTheme.border} transition-all duration-200 hover:-translate-y-0.5 shadow-lg shadow-black/20 group`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <p className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${currentTheme.iconBg} transition-transform group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
          {badge && (
            <span className={`px-2 py-0.5 rounded-md font-medium border ${currentTheme.badge}`}>
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

