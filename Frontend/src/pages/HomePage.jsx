import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, FolderKanban, Leaf, ArrowRight, Users, CheckCircle,
  LayoutDashboard, Eye, EyeOff, Sparkles, Shield,
  Globe2, Award, Quote, ChevronDown, HelpCircle, Lightbulb, Target, Compass
} from 'lucide-react';
import PublicLayout from '../layouts/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { loginApi } from '../api/authApi';
import { ROLE_LABELS } from '../utils/constants';

const stats = [
  { label: 'Issues Resolved', value: 15, suffix: '+', icon: CheckCircle, emoji: '✅' },
  { label: 'Sensors Active', value: 12, suffix: '+', icon: Activity, emoji: '📡' },
  { label: 'Projects Running', value: 18, suffix: '+', icon: FolderKanban, emoji: '🌳' },
  { label: 'Citizens Engaged', value: 20, suffix: '+', icon: Users, emoji: '👥' },
];

const steps = [
  { emoji: '👀', title: 'Spot it', description: 'Notice an environmental issue in your community — pollution, dumping, deforestation.' },
  { emoji: '📸', title: 'Report it', description: 'Snap a photo, drop a pin on the map, and submit in under a minute.' },
  { emoji: '🌍', title: 'Track impact', description: 'Watch agencies act, follow project progress, and see measurable change.' },
];

const testimonials = [
  { quote: 'EcoTrack helped our agency cut response time on water contamination reports by 60%.', author: 'P. Iyer', role: 'Agency Officer, Bengaluru' },
  { quote: 'I reported a waste-dumping site near my school. It was cleaned up in two weeks.', author: 'A. Sharma', role: 'Citizen Reporter' },
  { quote: 'The compliance dashboard turned our quarterly audit from 3 days into 3 hours.', author: 'M. Chen', role: 'Compliance Officer' },
];

// ── About EcoTrack pillars ────────────────────────────────
const aboutPillars = [
  {
    emoji: '🎯',
    icon: Target,
    title: 'Our Mission',
    text: 'Democratize environmental governance by connecting citizens, agencies, scientists, industries, and regulators on a single transparent platform.',
  },
  {
    emoji: '🌍',
    icon: Globe2,
    title: 'Our Vision',
    text: 'A world where every environmental issue is reported, measured, and resolved — with data, accountability, and citizen participation at the core.',
  },
  {
    emoji: '🧭',
    icon: Compass,
    title: 'Our Approach',
    text: 'Real-time monitoring, role-based workflows, transparent audit trails, and meaningful analytics — designed for scale and built for everyday participation.',
  },
];

// ── Why EcoTrack — value props ────────────────────────────
const whyReasons = [
  {
    emoji: '⚠️',
    title: 'Citizen Reporting',
    description: 'Anyone can flag pollution, waste dumping, or deforestation in under a minute — with photos, location, and a clear trail until it\'s resolved.',
  },
  {
    emoji: '🔬',
    title: 'Scientist Analysis',
    description: 'Environmental scientists review sensor readings, annotate findings, flag anomalies, and publish recommendations that drive ground-level action.',
  },
  {
    emoji: '🏭',
    title: 'Industry Emission Logs',
    description: 'Industries log CO₂, NOx, SOx, methane, and particulate emissions with quantities and dates — under the watch of compliance officers.',
  },
  {
    emoji: '🛡️',
    title: 'Audit-Ready Compliance',
    description: 'Every action is logged with timestamps and user IDs. Generate regulator-ready reports in seconds, not weeks.',
  },
  {
    emoji: '👥',
    title: 'Multi-Role Collaboration',
    description: 'Citizens, officers, scientists, industries, and admins — each gets a purpose-built console with the right permissions.',
  },
  {
    emoji: '🌱',
    title: 'SDG-Aligned',
    description: 'Tracking and reporting directly mapped to UN Sustainable Development Goals 6, 11, 12, 13, and 15.',
  },
];

// ── Environmental & sustainability facts ──────────────────
const insights = [
  {
    emoji: '🌫️',
    stat: '9M',
    label: 'deaths / year',
    text: 'Air pollution causes ~9 million premature deaths globally each year — more than HIV, malaria, and tuberculosis combined.',
    source: 'The Lancet, 2023',
  },
  {
    emoji: '🏭',
    stat: '24%',
    label: 'of global CO₂',
    text: 'The industrial sector contributes nearly a quarter of all greenhouse gas emissions worldwide — and is the fastest growing source.',
    source: 'IPCC AR6',
  },
  {
    emoji: '♻️',
    stat: '9%',
    label: 'plastic recycled',
    text: 'Of all plastic ever produced, only 9% has been recycled. The rest ends up in landfills, incinerators, or the natural environment.',
    source: 'OECD Global Plastics Outlook',
  },
  {
    emoji: '🌳',
    stat: '10M ha',
    label: 'forest lost / year',
    text: 'The world loses about 10 million hectares of forest annually — roughly the size of a football field every second.',
    source: 'FAO Forest Resources Assessment',
  },
  {
    emoji: '💧',
    stat: '2B',
    label: 'lack safe water',
    text: 'Two billion people still don\'t have access to safely managed drinking water at home, with stress projected to worsen by 2030.',
    source: 'WHO / UNICEF JMP',
  },
  {
    emoji: '⚡',
    stat: '30%',
    label: 'energy renewable',
    text: 'Renewables now generate 30% of global electricity, with solar and wind capacity doubling roughly every 3-4 years.',
    source: 'IEA World Energy Outlook',
  },
];

// ── FAQs ──────────────────────────────────────────────────
const faqs = [
  {
    q: 'Who can use EcoTrack?',
    a: 'EcoTrack serves six user types: Citizens (report issues), Agency Officers (validate and resolve), Industry Representatives (log emissions & documents), Environmental Scientists (analyze sensor data), Compliance Officers (audit & enforce), and Administrators (configure & oversee). Citizens can self-register; other roles are provisioned by an admin.',
  },
  {
    q: 'How does compliance tracking work?',
    a: 'Industries submit emission logs and regulatory documents through their console. Compliance officers review, approve, or reject submissions with notes. Every record is timestamped and tied to an audit trail. Reports can be generated as CSV exports for regulators on demand.',
  },
  {
    q: 'Can citizens report issues anonymously?',
    a: 'Issues require a registered citizen account to prevent spam and enable two-way communication on resolution status. However, your personal information is never shared with industries — only with the validating agency officer and platform administrators.',
  },
  {
    q: 'How does EcoTrack handle environmental regulations across regions?',
    a: 'Compliance rules and thresholds are configurable per deployment. Administrators can map local regulations (e.g., CPCB norms in India, EPA standards in the US) to compliance record types. Reports are generated against the configured baseline, making EcoTrack adaptable to any jurisdiction.',
  },
  {
    q: 'Is EcoTrack free to use?',
    a: 'Citizen reporting and dashboard access are free for all individuals. Agency, industry, and compliance officer licensing is offered under tiered municipal and enterprise plans. Contact the administrator for pricing tailored to your city or organization.',
  },
];

// Collapsible FAQ row
function FaqItem({ q, a, index, open, onToggle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden
        ${open ? 'border-forest-600/40 shadow-lg shadow-leaf-400/20' : 'border-bark-400/15 hover:border-leaf-200'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
      >
        <span className="text-base md:text-lg font-semibold text-bark-800 flex items-center gap-3">
          <span
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-colors
              ${open ? 'bg-forest-700 text-white' : 'bg-leaf-200 text-forest-700'}`}
          >
            {(index + 1).toString().padStart(2, '0')}
          </span>
          {q}
        </span>
        <ChevronDown
          size={20}
          className={`text-forest-600 transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-6 pt-1 text-sm md:text-[15px] text-bark-500 leading-relaxed pl-[68px]">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CountUp({ end, duration = 1800, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
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
  return <>{count.toLocaleString()}{suffix}</>;
}

export default function HomePage() {
  const { isAuthenticated, user, role, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Minimum 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await loginApi(email, password);
      login(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Login failed. Please try again.';
      setApiError(msg);
      setEmail('');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 bg-white text-bark-800 placeholder-bark-400
    ${errors[field] ? 'border-danger ring-2 ring-danger/20' : 'border-bark-400/30 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20'}`;

  return (
    <PublicLayout>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-forest-900 via-forest-800 to-forest-700 text-white overflow-hidden">
        {/* Animated decorative blobs */}
        <motion.div
          aria-hidden="true"
          className="absolute -top-32 -left-32 w-96 h-96 bg-leaf-400/20 rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute top-1/2 -right-40 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl"
          animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute bottom-0 left-1/3 w-72 h-72 bg-leaf-400/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />

        {/* Floating leaf glyphs */}
        <motion.div
          aria-hidden="true"
          className="absolute top-16 right-[15%] text-leaf-400/30 hidden lg:block"
          animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Leaf size={48} />
        </motion.div>
        <motion.div
          aria-hidden="true"
          className="absolute bottom-24 left-[8%] text-leaf-400/20 hidden lg:block"
          animate={{ y: [0, 10, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <Leaf size={36} />
        </motion.div>

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — marketing pitch */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-leaf-400/15 border border-leaf-400/30 rounded-full px-4 py-1.5 text-sm text-leaf-200 mb-6 font-medium backdrop-blur-sm">
                <Sparkles size={14} className="text-leaf-400" />
                <span>🌿 Environmental Monitoring & Sustainability</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.05] tracking-tight">
                Monitor. Report.<br />
                <span className="bg-gradient-to-r from-leaf-400 via-leaf-200 to-leaf-400 bg-clip-text text-transparent">
                  Sustain.
                </span>
                {' '}
                <span aria-hidden="true">🌍</span>
              </h1>
              <p className="text-lg text-white/75 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                EcoTrack empowers citizens to report environmental issues, while agencies, scientists,
                and industries collaborate on monitoring, compliance, and sustainability — all in one platform.
              </p>

              {/* Trust mini-strip */}
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Shield size={16} className="text-leaf-400" /> Govt-grade security
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Globe2 size={16} className="text-leaf-400" /> Aligned with UN SDGs
                </div>
                <div className="flex items-center gap-2 text-white/60">
                  <Award size={16} className="text-leaf-400" /> 20+ active citizens
                </div>
              </div>

              {isAuthenticated && (
                <div className="mt-8 flex flex-col items-center lg:items-start gap-3">
                  <p className="text-white/60 text-sm">
                    Signed in as <span className="text-leaf-400 font-medium">{user?.name}</span>
                    {' '}·{' '}
                    <span className="text-white/50">{ROLE_LABELS[role] || role}</span>
                  </p>
                  <Link to="/dashboard"
                    className="inline-flex items-center gap-2 bg-leaf-400 text-forest-900 font-semibold px-8 py-3.5 rounded-xl hover:bg-leaf-400/90 transition-all shadow-lg shadow-leaf-400/30">
                    <LayoutDashboard size={18} /> Go to Dashboard
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Right — login card with glow */}
            {!isAuthenticated && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
                className="w-full max-w-md mx-auto lg:ml-auto lg:mr-0 relative">
                {/* Outer glow */}
                <div aria-hidden="true" className="absolute -inset-4 bg-leaf-400/30 rounded-3xl blur-2xl" />
                <div className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 ring-1 ring-leaf-200/50">
                  <div className="text-center mb-5">
                    <h2 className="text-xl font-bold text-bark-800">Welcome back</h2>
                    <p className="text-sm text-bark-500 mt-1">Sign in to continue your impact</p>
                  </div>

                  <form
                    autoComplete="off"
                    onSubmit={(e) => { e.preventDefault(); handleLogin(); }}
                  >
                    <div className="space-y-4">
                      <input
                        type="email"
                        className={inputClass('email')}
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="off"
                      />
                      {errors.email && <p className="-mt-2 text-xs text-danger">{errors.email}</p>}

                      <div className="relative">
                        <input
                          type={showPw ? 'text' : 'password'}
                          className={inputClass('password') + ' pr-12 [&::-ms-reveal]:hidden [&::-webkit-reveal]:hidden'}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-bark-400 hover:text-bark-600 transition-colors"
                        >
                          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.password && <p className="-mt-2 text-xs text-danger">{errors.password}</p>}

                      {apiError && (
                        <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-danger text-sm text-center">
                          {apiError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-forest-700 to-forest-600 hover:from-forest-800 hover:to-forest-700 text-white font-semibold text-sm shadow-lg shadow-forest-600/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading && (
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        )}
                        {loading ? 'Signing in…' : '🌿 Log In'}
                      </button>

                      <div className="relative pt-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-bark-300/40" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-wider">
                          <span className="px-3 bg-white text-bark-400">New here?</span>
                        </div>
                      </div>

                      <Link to="/register"
                        className="w-full inline-flex items-center justify-center gap-2 bg-leaf-400 text-forest-900 font-semibold px-6 py-3 rounded-xl hover:bg-leaf-400/90 transition-all shadow-md shadow-leaf-400/30">
                        🌱 Register as Citizen <ArrowRight size={18} />
                      </Link>
                    </div>
                  </form>
                </div>
                <p className="text-center text-xs text-white/50 mt-4">
                  Agency, scientist & industry accounts are provisioned by an Administrator.
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Wave divider */}
        <div className="relative">
          <svg className="block w-full h-12 sm:h-16" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────── */}
      <section className="bg-white border-b border-bark-400/10">
        <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ label, value, suffix, icon: Icon, emoji }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center group"
            >
              <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-leaf-200 to-earth-50 items-center justify-center mb-3 ring-1 ring-leaf-200 shadow-sm group-hover:scale-110 transition-transform">
                <span className="text-2xl" aria-hidden="true">{emoji}</span>
              </div>
              <div className="text-3xl font-extrabold text-forest-700 tracking-tight">
                <CountUp end={value} suffix={suffix} />
              </div>
              <div className="text-sm text-bark-500 mt-1 font-medium">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── About EcoTrack ───────────────────────────────── */}
      <section className="relative bg-white py-20 overflow-hidden">
        <div aria-hidden="true" className="absolute -top-24 -left-24 w-72 h-72 bg-leaf-200/40 rounded-full blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-24 -right-24 w-80 h-80 bg-forest-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-12 items-start">
            {/* Left: narrative */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <span className="inline-block text-xs font-bold tracking-[0.2em] text-forest-600 uppercase mb-3">
                🌿 About the project
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-bark-800 mb-5 leading-tight">
                Built for the people, agencies & industries shaping tomorrow's environment.
              </h2>
              <p className="text-bark-500 leading-relaxed mb-4">
                EcoTrack is a web-based environmental monitoring & sustainability management
                platform purpose-built for municipalities, agencies, NGOs, and industries.
                It unifies citizen reporting, real-time monitoring, emission logging,
                compliance auditing, and project tracking — all under one transparent roof.
              </p>
              <p className="text-bark-500 leading-relaxed mb-6">
                Built to scale from a single-city pilot to a multi-state rollout —
                without losing the simplicity that makes everyday citizen participation possible.
              </p>
              <div className="flex flex-wrap gap-2">
                {['🌍 Transparent', '🛡️ Secure', '🌱 Sustainable', '🤝 Inclusive'].map((t) => (
                  <span key={t} className="text-xs font-semibold bg-leaf-200/60 text-forest-800 px-3 py-1.5 rounded-full border border-leaf-200">
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right: pillars */}
            <div className="lg:col-span-3 grid sm:grid-cols-1 gap-4">
              {aboutPillars.map(({ emoji, icon: Icon, title, text }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="group bg-white rounded-2xl p-6 border border-bark-400/10 hover:border-leaf-200 hover:shadow-xl hover:shadow-leaf-400/10 hover:-translate-y-0.5 transition-all flex gap-5"
                >
                  <div className="w-14 h-14 rounded-2xl shrink-0 bg-gradient-to-br from-leaf-200 to-earth-50 flex items-center justify-center ring-1 ring-leaf-200 group-hover:scale-105 transition-transform">
                    <span className="text-2xl" aria-hidden="true">{emoji}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-bark-800 mb-1 flex items-center gap-2">
                      {title}
                      <Icon size={15} className="text-forest-600 opacity-70" />
                    </h3>
                    <p className="text-sm text-bark-500 leading-relaxed">{text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why EcoTrack ─────────────────────────────────── */}
      <section className="bg-gradient-to-b from-earth-50 to-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-forest-600 uppercase mb-3">
              💡 Why EcoTrack
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-bark-800 mb-3">
              Why cities & enterprises choose EcoTrack 🌱
            </h2>
            <p className="text-bark-500 max-w-2xl mx-auto">
              Beyond a dashboard — a complete environmental governance stack that scales with your ambition.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {whyReasons.map(({ emoji, title, description }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative bg-white rounded-2xl p-6 border border-bark-400/10 hover:border-forest-600/30 hover:shadow-xl hover:shadow-leaf-400/15 hover:-translate-y-1 transition-all group overflow-hidden"
              >
                <div aria-hidden="true" className="absolute -top-6 -right-6 w-24 h-24 bg-leaf-200/40 rounded-full blur-2xl group-hover:bg-leaf-400/30 transition-colors" />
                <div className="relative">
                  <div className="text-3xl mb-3" aria-hidden="true">{emoji}</div>
                  <h3 className="text-base font-bold text-bark-800 mb-2">{title}</h3>
                  <p className="text-sm text-bark-500 leading-relaxed">{description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="bg-earth-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-forest-600 uppercase mb-3">⚡ How it works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-bark-800">From spotted to solved in three steps</h2>
            <p className="text-bark-500 mt-3 max-w-xl mx-auto">A simple, transparent flow that connects citizens to action.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-10 relative">
            {/* connecting dashed line on lg */}
            <div aria-hidden="true" className="hidden lg:block absolute top-12 left-[16%] right-[16%] border-t-2 border-dashed border-leaf-400/40" />
            {steps.map(({ emoji, title, description }, i) => (
              <motion.div key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative bg-white rounded-2xl p-7 text-center shadow-sm border border-leaf-200/50 hover:shadow-lg hover:shadow-leaf-400/20 hover:-translate-y-1 transition-all"
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-forest-700 text-white text-sm font-bold flex items-center justify-center shadow-md ring-4 ring-earth-50">
                  {i + 1}
                </div>
                <div className="text-5xl mb-4 mt-2" aria-hidden="true">{emoji}</div>
                <h3 className="text-lg font-bold text-bark-800 mb-2">{title}</h3>
                <p className="text-sm text-bark-500 leading-relaxed">{description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Environmental Insights / Facts ───────────────── */}
      <section className="relative bg-gradient-to-br from-earth-50 via-white to-leaf-200/40 py-20 overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="absolute top-10 left-10 text-leaf-400/20 hidden md:block"
          animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Leaf size={56} />
        </motion.div>
        <motion.div
          aria-hidden="true"
          className="absolute bottom-10 right-10 text-forest-600/15 hidden md:block"
          animate={{ y: [0, 12, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <Leaf size={72} />
        </motion.div>

        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-forest-600 uppercase mb-3">
              <Lightbulb size={14} /> Did you know?
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-bark-800 mb-3">
              The state of our planet, in numbers 🌍
            </h2>
            <p className="text-bark-500 max-w-2xl mx-auto">
              Six facts that explain why environmental monitoring & sustainability management
              is no longer optional — for cities, industries, or citizens.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {insights.map(({ emoji, stat, label, text, source }, i) => (
              <motion.div
                key={stat + label}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative bg-white rounded-2xl p-6 border border-bark-400/10 hover:shadow-xl hover:shadow-forest-600/10 hover:-translate-y-1 transition-all group overflow-hidden"
              >
                <div aria-hidden="true" className="absolute top-0 right-0 w-28 h-28 bg-leaf-200/30 rounded-full blur-2xl -translate-y-1/3 translate-x-1/3 group-hover:bg-leaf-400/30 transition-colors" />
                <div className="relative">
                  <div className="flex items-baseline gap-3 mb-3">
                    <span className="text-3xl" aria-hidden="true">{emoji}</span>
                    <div>
                      <div className="text-3xl font-extrabold text-forest-700 leading-none tracking-tight">{stat}</div>
                      <div className="text-[11px] uppercase tracking-wider text-bark-400 font-semibold mt-1">{label}</div>
                    </div>
                  </div>
                  <p className="text-sm text-bark-600 leading-relaxed mb-3">{text}</p>
                  <p className="text-[11px] text-bark-400 italic">— {source}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="inline-flex items-center gap-2 text-sm text-bark-600 bg-white border border-leaf-200 rounded-full px-5 py-2.5 shadow-sm">
              <Sparkles size={14} className="text-forest-600" />
              EcoTrack turns these numbers into measurable, local action.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials / impact strip ──────────────────── */}
      <section className="bg-gradient-to-br from-forest-900 via-forest-800 to-forest-900 text-white py-20 relative overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="absolute -top-20 right-0 w-96 h-96 bg-leaf-400/15 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-leaf-400 uppercase mb-3">💬 Voices of impact</span>
            <h2 className="text-3xl md:text-4xl font-bold">Trusted by citizens, agencies & industries</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ quote, author, role: trole }, i) => (
              <motion.div key={author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/10 hover:border-leaf-400/30 transition-all"
              >
                <Quote size={28} className="text-leaf-400 mb-3 opacity-70" />
                <p className="text-white/90 leading-relaxed mb-5 italic">"{quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full bg-leaf-400 text-forest-900 flex items-center justify-center font-bold text-sm">
                    {author.split(' ').slice(-1)[0][0]}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">{author}</div>
                    <div className="text-xs text-leaf-400">{trole}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ─────────────────────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-forest-600 uppercase mb-3">
              <HelpCircle size={14} /> Frequently asked
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-bark-800 mb-3">
              Answers, before you ask 💬
            </h2>
            <p className="text-bark-500 max-w-xl mx-auto">
              Common questions about how EcoTrack works, who it's for, and what makes it different.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((f, i) => (
              <FaqItem
                key={f.q}
                q={f.q}
                a={f.a}
                index={i}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
              />
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-bark-500">
              Still have questions? Email <a href="mailto:hello@ecotrack.org" className="text-forest-700 font-semibold hover:underline">hello@ecotrack.org</a> — we usually reply within a day. 🌿
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA (only when authenticated, since logged-out has hero login) ── */}
      {isAuthenticated && (
        <section className="bg-leaf-200/50 py-16 text-center">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-3 text-forest-900">🎉 Welcome back, {user?.name}!</h2>
            <p className="text-bark-600 mb-8">Head to your dashboard to continue your impact.</p>
            <Link to="/dashboard"
              className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-forest-700/30">
              <LayoutDashboard size={18} /> Go to Dashboard
            </Link>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
