export function SkeletonRows({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-gray-200 rounded-lg flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg className="w-16 h-16 text-accent/30 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34L3 23l2-1c1.56-.89 3.26-1.53 5-2 2.08-.56 4.37-.87 6.6-.33 2.56.62 4.78 2.13 5.88 4.33" strokeLinecap="round"/>
        <path d="M7 16c1-2 2.5-3.5 4-4.5" strokeLinecap="round"/>
      </svg>
      <p className="text-text-muted text-sm">{message}</p>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }) {
  return (
    <div className="bg-error-light border border-error/20 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
      <span className="text-error text-sm">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-error text-sm font-semibold hover:underline cursor-pointer">Retry</button>
      )}
    </div>
  );
}

export function SuccessBanner({ message, onDismiss }) {
  return (
    <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
      <span className="text-primary text-sm font-medium">✅ {message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="text-primary text-sm font-semibold hover:underline cursor-pointer">×</button>
      )}
    </div>
  );
}

