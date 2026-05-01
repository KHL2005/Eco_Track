import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginApi } from '../api/authApi';
import { Leaf, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email format';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Minimum 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
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
    <div className="min-h-screen bg-earth-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
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
            <p className="text-bark-400 text-sm">Sign in to your account</p>
          </div>

          <form
            autoComplete="off"
            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bark-600 mb-1.5">Email Address</label>
                <input
                  type="email"
                  className={inputClass('email')}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                />
                {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-bark-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={inputClass('password') + ' pr-12 [&::-ms-reveal]:hidden [&::-webkit-reveal]:hidden'}
                    placeholder="••••••••"
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
                {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
              </div>

              {apiError && (
                <div className="bg-danger-light border border-danger/20 rounded-xl px-4 py-3 text-danger text-sm text-center">
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold text-sm shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-bark-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-forest-600 font-semibold hover:text-forest-700 transition-colors">
              Create account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
