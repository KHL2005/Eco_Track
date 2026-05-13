import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { registerApi } from '../../api/authApi';
import { Leaf, Eye, EyeOff, Sparkles, Shield, Globe2, Award, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};

    const name = (form.name || '').trim();
    if (!name) e.name = 'Please enter your full name';
    else if (name.length < 3) e.name = `Name is too short — needs at least 3 characters (you entered ${name.length})`;
    else if (name.length > 50) e.name = 'Name is too long — please keep it under 50 characters';
    else if (!/^[a-zA-Z\s'-]+$/.test(name)) e.name = 'Name can contain only letters, spaces, hyphens or apostrophes';

    const email = (form.email || '').trim();
    if (!email) e.email = 'Email is required';
    else if (!email.includes('@')) e.email = "Invalid email — must include '@' (e.g. you@example.com)";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format — must look like you@example.com';

    const phone = (form.phone || '').trim();
    if (!phone) e.phone = 'Phone number is required';
    else if (!/^\d+$/.test(phone)) e.phone = 'Phone number must contain only digits';
    else if (phone.length !== 10) e.phone = `Phone must be exactly 10 digits (you entered ${phone.length})`;
    else if (!/^[6-9]/.test(phone)) e.phone = 'Not an Indian mobile number — Indian numbers start with 6, 7, 8 or 9';

    const pw = form.password || '';
    if (!pw) e.password = 'Password is required';
    else {
      const missing = [];
      if (pw.length < 8) missing.push(`at least 8 characters (currently ${pw.length})`);
      if (!/[A-Z]/.test(pw)) missing.push('1 uppercase letter');
      if (!/[a-z]/.test(pw)) missing.push('1 lowercase letter');
      if (!/[0-9]/.test(pw)) missing.push('1 number');
      if (!/[@#$%^&+=!]/.test(pw)) missing.push('1 special character (@#$%^&+=!)');
      if (/\s/.test(pw)) missing.push('no spaces');
      if (missing.length) e.password = `Create a stronger password — needs: ${missing.join(', ')}`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      // No role sent — backend always assigns CITIZEN for public registration
      const { data } = await registerApi(form);
      login(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      // Backend returns field-level messages under `messages` for validation errors
      if (data?.messages && typeof data.messages === 'object' && Object.keys(data.messages).length > 0) {
        setErrors(data.messages);
        setApiError('Please fix the highlighted fields and try again.');
      } else {
        setApiError(data?.message || data?.error || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 bg-white text-bark-800 placeholder-bark-400
    ${errors[field] ? 'border-danger ring-2 ring-danger/20' : 'border-bark-400/30 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20'}`;

  return (
    <div className="min-h-screen bg-earth-100 grid lg:grid-cols-2 relative overflow-hidden"
      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}>

      {/* ─── Left panel — brand pitch (hidden on small screens) ─── */}
      <aside className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-forest-900 via-forest-800 to-forest-700 text-white">
        {/* Animated blurred blobs */}
        <motion.div
          aria-hidden="true"
          className="absolute -top-32 -left-32 w-96 h-96 bg-leaf-400/25 rounded-full blur-3xl"
          animate={{ x: [0, 25, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute bottom-0 -right-24 w-80 h-80 bg-sky-500/20 rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute top-1/2 left-1/3 w-72 h-72 bg-leaf-400/15 rounded-full blur-3xl"
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />

        {/* Floating leaf glyphs */}
        <motion.div
          aria-hidden="true"
          className="absolute top-20 right-16 text-leaf-400/40"
          animate={{ y: [0, -14, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Leaf size={56} />
        </motion.div>
        <motion.div
          aria-hidden="true"
          className="absolute bottom-32 left-12 text-leaf-400/30"
          animate={{ y: [0, 10, 0], rotate: [0, -12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <Leaf size={42} />
        </motion.div>
        <motion.div
          aria-hidden="true"
          className="absolute top-1/3 left-24 text-leaf-400/25"
          animate={{ y: [0, 8, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        >
          <Leaf size={32} />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full"
        >
          <Link to="/" className="inline-flex items-center gap-2.5 self-start">
            <div className="w-10 h-10 bg-leaf-400 rounded-xl flex items-center justify-center shadow-md">
              <Leaf size={22} className="text-forest-900" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">EcoTrack</span>
          </Link>

          <div className="my-12">
            <div className="inline-flex items-center gap-2 bg-leaf-400/15 border border-leaf-400/30 rounded-full px-4 py-1.5 text-sm text-leaf-200 mb-6 font-medium backdrop-blur-sm">
              <Sparkles size={14} className="text-leaf-400" />
              <span>🌿 Join the movement</span>
            </div>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight mb-5">
              Every report<br />
              <span className="bg-gradient-to-r from-leaf-400 via-leaf-200 to-leaf-400 bg-clip-text text-transparent">
                plants a seed
              </span>{' '}
              <span aria-hidden="true">🌱</span>
            </h1>
            <p className="text-base xl:text-lg text-white/75 leading-relaxed max-w-md">
              Your account connects you to agencies, scientists and local industries — a single
              platform where citizen reports turn into measurable change.
            </p>

            {/* Benefits list */}
            <ul className="mt-8 space-y-3 text-sm">
              {[
                { emoji: '📸', text: 'Report pollution, dumping and deforestation in seconds' },
                { emoji: '🔔', text: 'Track resolution status and get notified at every step' },
                { emoji: '🌍', text: 'See your community-wide impact on the public dashboard' },
              ].map(({ emoji, text }) => (
                <li key={text} className="flex items-start gap-3 text-white/85">
                  <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm shrink-0" aria-hidden="true">{emoji}</span>
                  <span className="leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats footer */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
            {[
              { value: '12K+', label: 'Citizens', icon: Award },
              { value: '1.2K+', label: 'Resolved', icon: CheckCircle2 },
              { value: '380+', label: 'Sensors', icon: Globe2 },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label}>
                <div className="flex items-center gap-1.5 text-leaf-400 mb-1">
                  <Icon size={14} />
                  <div className="text-xl font-extrabold">{value}</div>
                </div>
                <div className="text-xs text-white/60">{label}</div>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/50 mt-6 flex items-center gap-1.5">
            <Shield size={12} className="text-leaf-400" />
            Govt-grade security · Aligned with UN Sustainable Development Goals
          </p>
        </motion.div>
      </aside>

      {/* ─── Right panel — form (mobile: full width) ─── */}
      <div className="flex items-center justify-center p-4 relative overflow-hidden">
        {/* Mobile-only decorative blobs (left panel handles desktop) */}
        <div className="lg:hidden absolute -top-40 -left-40 w-96 h-96 bg-forest-600/8 rounded-full blur-3xl pointer-events-none" />
        <div className="lg:hidden absolute -bottom-40 -right-40 w-96 h-96 bg-leaf-400/8 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white rounded-3xl shadow-xl border border-bark-400/10 p-8 sm:p-10">

          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-3">
              <div className="w-10 h-10 bg-forest-600 rounded-xl flex items-center justify-center shadow-md">
                <Leaf size={22} className="text-white" />
              </div>
              <span className="text-2xl font-extrabold text-forest-900 tracking-tight">EcoTrack</span>
            </Link>
            <p className="text-bark-400 text-sm">Create your citizen account</p>
          </div>

          {/* Form — info banner removed, citizens don't need to know internal role details */}
          <div className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1.5">Full Name</label>
              <input type="text" className={inputClass('name')} placeholder="Jane Smith"
                value={form.name} onChange={set('name')} autoComplete="name" />
              {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1.5">Email Address</label>
              <input type="email" className={inputClass('email')} placeholder="you@example.com"
                value={form.email} onChange={set('email')} autoComplete="email" />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1.5">Phone Number</label>
              <input type="tel" className={inputClass('phone')} placeholder="10-digit number"
                value={form.phone} onChange={set('phone')} autoComplete="tel" />
              {errors.phone && <p className="mt-1 text-xs text-danger">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className={inputClass('password') + ' pr-12 [&::-ms-reveal]:hidden [&::-webkit-reveal]:hidden'}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                />
                {pwFocused && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setShowPw(v => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-bark-400 hover:text-bark-600 transition-colors"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
            </div>

            {apiError && (
              <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-danger text-sm text-center">
                {apiError}
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold text-sm shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer">
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Creating account…' : 'Create Citizen Account'}
            </button>
          </div>

          <p className="text-center text-sm text-bark-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-forest-600 font-semibold hover:text-forest-700 transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
