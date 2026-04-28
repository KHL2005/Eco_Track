import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerApi } from '../api/authApi';
import InputField from '../components/InputField';
import PasswordInput from '../components/PasswordInput';
import LeafPattern from '../components/LeafPattern';
import { getDashboardPath } from '../utils/rolePaths';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name || form.name.length < 2) e.name = 'Name is required (min 2 chars)';
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
      const { data } = await registerApi(form);
      login(data);
      navigate(getDashboardPath(data.role), { replace: true });
    } catch (err) {
      console.error('Register error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Registration failed. Please try again.';
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
      <LeafPattern />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
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
            <p className="text-text-muted text-sm">Create your Citizen account</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <InputField
              label="Full Name"
              value={form.name}
              onChange={set('name')}
              placeholder="John Doe"
              error={errors.name}
            />
            <InputField
              label="Email Address"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              error={errors.email}
            />
            <InputField
              label="Phone Number"
              type="tel"
              value={form.phone}
              onChange={set('phone')}
              placeholder="1234567890"
              error={errors.phone}
              maxLength={10}
            />
            <PasswordInput
              label="Password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              error={errors.password}
            />

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
              {loading ? 'Creating account…' : 'Register'}
            </button>

            {apiError && (
              <div className="bg-error-light border border-error/20 rounded-xl px-4 py-3 text-error text-sm text-center">
                {apiError}
              </div>
            )}
          </div>

          <p className="text-center text-sm text-text-muted mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:text-accent transition-colors">
              Login →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

