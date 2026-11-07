import React from 'react';

export const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl bg-[#131A29]/60 border border-slate-800/80 border-dashed">
      {Icon && (
        <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-5">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-colors shadow-md shadow-purple-600/20"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

