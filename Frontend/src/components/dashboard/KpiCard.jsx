import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function CountUp({ end = 0, duration = 1200 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(end) || end === 0) { setCount(end || 0); return; }
    let raf;
    let startTs = null;
    const step = (ts) => {
      if (startTs === null) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setCount(end);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);
  return <>{count.toLocaleString()}</>;
}

export default function KpiCard({ icon: Icon, emoji, label, value, sub, color = 'text-forest-600', bg = 'bg-green-50', glow = 'hover:shadow-leaf-200/60' }) {
  const numeric = typeof value === 'number';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`bg-white rounded-2xl p-5 border border-bark-300/20 shadow-sm hover:-translate-y-1 hover:shadow-lg ${glow} transition-all`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-bark-500 uppercase tracking-wide mb-1.5">{label}</p>
          <p className="text-3xl font-extrabold text-bark-800 leading-none">
            {value === null || value === undefined ? '—' : numeric ? <CountUp end={value} /> : value}
          </p>
          {sub && <p className="text-xs text-bark-400 mt-2">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg} ring-1 ring-inset ring-black/5`}>
          {emoji ? <span className="text-xl" aria-hidden="true">{emoji}</span> : Icon ? <Icon size={20} className={color} /> : null}
        </div>
      </div>
    </motion.div>
  );
}
