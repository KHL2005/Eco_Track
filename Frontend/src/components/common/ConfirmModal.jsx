export default function ConfirmModal({ open, title, message, confirmLabel, confirmColor, onConfirm, onCancel, loading }) {
  if (!open) return null;
  const colorClass = confirmColor === 'red'
    ? 'bg-error hover:bg-red-700'
    : 'bg-gradient-to-r from-primary to-accent hover:opacity-90';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in">
        <h3 className="text-lg font-bold text-text mb-2">{title || 'Confirm Action'}</h3>
        <p className="text-sm text-text-muted mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-text-muted hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60 ${colorClass}`}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            )}
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

