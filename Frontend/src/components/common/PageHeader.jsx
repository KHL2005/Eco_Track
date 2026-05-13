import PropTypes from 'prop-types';

export default function PageHeader({ emoji, title, description, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3 min-w-0">
        <span className="hidden sm:block w-1 self-stretch rounded-full bg-leaf-400" aria-hidden="true" />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-bark-800 flex items-center gap-2">
            {emoji && <span className="text-2xl leading-none" aria-hidden="true">{emoji}</span>}
            <span>{title}</span>
          </h1>
          {description && <p className="text-sm text-bark-500 mt-1">{description}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

PageHeader.propTypes = {
  emoji: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
};
