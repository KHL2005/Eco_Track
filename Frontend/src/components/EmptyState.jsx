import PropTypes from 'prop-types';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No data found', description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Inbox size={28} className="text-bark-400" />
      </div>
      <h3 className="text-base font-semibold text-bark-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-bark-400 mb-4 max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  action: PropTypes.node,
};

