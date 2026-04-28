export default function StatusBadge({ status }) {
  const map = {
    SUBMITTED: { bg: 'bg-amber-light text-amber', label: '⏳ Submitted' },
    APPROVED:  { bg: 'bg-accent/15 text-primary', label: '✅ Approved' },
    REJECTED:  { bg: 'bg-error-light text-error', label: '❌ Rejected' },
  };
  const s = map[status] || map.SUBMITTED;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg}`}>
      {s.label}
    </span>
  );
}

