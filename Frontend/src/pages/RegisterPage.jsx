import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerApi } from '../api/authApi';
import { Leaf, Eye, EyeOff } from 'lucide-react';

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
    if (!form.name || form.name.trim().length < 2) e.name = 'Name is required (min 2 chars)';
    if (!form.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
    if (!form.phone) e.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(form.phone)) e.phone = 'Must be 10 digits';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
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
      const msg = err.response?.data?.message || err.response?.data?.error || 'Registration failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all duration-200 bg-white text-bark-800 placeholder-bark-400
    ${errors[field] ? 'border-danger ring-2 ring-danger/20' : 'border-bark-400/30 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20'}`;

  return (
    <div className="min-h-screen bg-earth-100 flex items-center justify-center p-4 relative overflow-hidden"
      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-forest-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-leaf-400/8 rounded-full blur-3xl pointer-events-none" />

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
  );
}
