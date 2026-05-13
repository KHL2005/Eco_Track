import PropTypes from 'prop-types';
import { Inbox } from 'lucide-react';

export default function EmptyState({ emoji, icon: Icon, title = 'Nothing here yet', description, action, hint }) {
  const showLucide = !emoji && !Icon;
  const ResolvedIcon = Icon || Inbox;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gradient-to-b from-earth-50 to-white rounded-2xl border border-leaf-200/60">
      <div className="relative mb-5">
        <div className="absolute inset-0 bg-leaf-400/20 rounded-full blur-xl" aria-hidden="true" />
        <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-leaf-200">
          {emoji ? (
            <span className="text-4xl leading-none" aria-hidden="true">{emoji}</span>
          ) : showLucide ? (
            <ResolvedIcon size={32} className="text-forest-600" />
          ) : (
            <ResolvedIcon size={32} className="text-forest-600" />
          )}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-bark-800 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-bark-500 max-w-sm leading-relaxed">{description}</p>}
      {hint && (
        <p className="text-xs text-bark-400 mt-3 italic max-w-xs">💡 {hint}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

EmptyState.propTypes = {
  emoji: PropTypes.string,
  icon: PropTypes.elementType,
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.node,
  hint: PropTypes.string,
};
