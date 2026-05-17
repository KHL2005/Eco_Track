export default function SectionHeading({ emoji, title, subtitle, action }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-bark-800 flex items-center gap-2">
          {emoji && <span aria-hidden="true">{emoji}</span>}
          <span>{title}</span>
        </h2>
        {subtitle && <p className="text-xs text-bark-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
