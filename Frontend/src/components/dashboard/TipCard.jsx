export default function TipCard({ emoji = '💡', title, body, action }) {
  return (
    <div className="bg-gradient-to-br from-leaf-200/60 to-earth-50 rounded-2xl p-5 border border-leaf-200 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm shrink-0" aria-hidden="true">{emoji}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-forest-900">{title}</p>
        {body && <p className="text-xs text-bark-600 mt-1 leading-relaxed">{body}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
