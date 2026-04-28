import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginApi } from '../api/authApi';
import InputField from '../components/InputField';
import PasswordInput from '../components/PasswordInput';
import LeafPattern from '../components/LeafPattern';
import { getDashboardPath } from '../utils/rolePaths';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      navigate(getDashboardPath(data.role), { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Login failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden" onKeyDown={handleKeyDown}>
      {/* Background decorations */}
      <LeafPattern />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-primary/5 border border-white/50 p-8 sm:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M17 8C8 10 5.9 16.17 3.82 21.34L3 23l2-1c1.56-.89 3.26-1.53 5-2 2.08-.56 4.37-.87 6.6-.33 2.56.62 4.78 2.13 5.88 4.33"/>
                  <path d="M7 16c1-2 2.5-3.5 4-4.5"/>
                </svg>
              </div>
              <h1 className="text-3xl font-extrabold text-primary tracking-tight">EcoTrack</h1>
            </div>
            <p className="text-text-muted text-sm">Environmental Monitoring &amp; Sustainability</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <InputField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              error={errors.email}
            />
            <PasswordInput
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              error={errors.password}
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            {/* API Error */}
            {apiError && (
              <div className="bg-error-light border border-error/20 rounded-xl px-4 py-3 text-error text-sm text-center">
                {apiError}
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-text-muted mt-8">
            New here?{' '}
            <Link to="/register" className="text-primary font-semibold hover:text-accent transition-colors">
              Register as a Citizen →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

