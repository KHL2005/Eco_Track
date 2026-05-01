import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Activity, FolderKanban, Leaf, ArrowRight, Users, CheckCircle, LayoutDashboard } from 'lucide-react';
import PublicLayout from '../layouts/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/constants';

const features = [
  {
    icon: AlertTriangle,
    color: 'bg-orange-100 text-orange-600',
    title: 'Citizen Reporting',
    description: 'Empower citizens to report environmental issues — pollution, deforestation, waste dumping — directly with location and photos.',
  },
  {
    icon: Activity,
    color: 'bg-sky-100 text-sky-600',
    title: 'Real-time Monitoring',
    description: 'Live sensor data for air, water, noise, and soil quality. Time-series analysis by environmental scientists.',
  },
  {
    icon: FolderKanban,
    color: 'bg-green-100 text-green-700',
    title: 'Sustainability Tracking',
    description: 'Track green projects from planning to impact. Monitor CO₂ reduction, trees planted, water saved, and more.',
  },
];

const stats = [
  { label: 'Issues Resolved', value: '1,240+', icon: CheckCircle },
  { label: 'Sensors Active', value: '380+', icon: Activity },
  { label: 'Projects Running', value: '56+', icon: FolderKanban },
  { label: 'Citizens Engaged', value: '12,000+', icon: Users },
];

export default function HomePage() {
  const { isAuthenticated, user, role } = useAuth();

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative bg-forest-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm text-leaf-400 mb-6 font-medium">
              <Leaf size={14} /> Environmental Monitoring & Sustainability
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Monitor. Report.<br />
              <span className="text-leaf-400">Sustain.</span>
            </h1>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10">
              EcoTrack empowers citizens to report environmental issues, while agencies, scientists,
              and industries collaborate on monitoring, compliance, and sustainability — all in one platform.
            </p>

            {isAuthenticated ? (
              /* ── Logged-in state ── */
              <div className="flex flex-col items-center gap-3">
                <p className="text-white/60 text-sm">
                  Signed in as <span className="text-leaf-400 font-medium">{user?.name}</span>
                  {' '}·{' '}
                  <span className="text-white/50">{ROLE_LABELS[role] || role}</span>
                </p>
                <Link to="/dashboard"
                  className="inline-flex items-center gap-2 bg-leaf-400 text-forest-900 font-semibold px-8 py-3.5 rounded-xl hover:bg-leaf-400/90 transition-all">
                  <LayoutDashboard size={18} /> Go to Dashboard
                </Link>
              </div>
            ) : (
              /* ── Logged-out state ── */
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register"
                  className="inline-flex items-center gap-2 bg-leaf-400 text-forest-900 font-semibold px-8 py-3.5 rounded-xl hover:bg-leaf-400/90 transition-all">
                  Register as Citizen <ArrowRight size={18} />
                </Link>
                <Link to="/login"
                  className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-all border border-white/20">
                  Sign In
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-white border-b border-bark-400/10">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map(({ label, value, icon: Icon }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="text-center">
              <div className="text-2xl font-bold text-forest-600">{value}</div>
              <div className="text-sm text-bark-400 mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-bark-800 mb-3">Everything you need to protect the environment</h2>
          <p className="text-bark-400 max-w-xl mx-auto">A unified platform for every stakeholder — from grassroots citizen reporters to compliance officers and environmental scientists.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, color, title, description }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
              className="bg-earth-50 rounded-2xl p-8 border border-bark-400/10 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${color}`}>
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-bark-800 mb-2">{title}</h3>
              <p className="text-sm text-bark-400 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest-600 text-white py-16 text-center">
        {isAuthenticated ? (
          <>
            <h2 className="text-3xl font-bold mb-3">Welcome back, {user?.name}!</h2>
            <p className="text-white/70 mb-8">Head to your dashboard to continue your work.</p>
            <Link to="/dashboard"
              className="inline-flex items-center gap-2 bg-white text-forest-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-earth-50 transition-all">
              <LayoutDashboard size={18} /> Go to Dashboard
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-3">Ready to report an issue?</h2>
            <p className="text-white/70 mb-2">Join thousands of citizens making a difference in their communities.</p>
            <p className="text-white/50 text-sm mb-8">
              Agency officers, scientists and industry accounts are provisioned by an Administrator.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register"
                className="inline-flex items-center gap-2 bg-white text-forest-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-earth-50 transition-all">
                Create Citizen Account <ArrowRight size={18} />
              </Link>
              <Link to="/login"
                className="inline-flex items-center gap-2 bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-all border border-white/20">
                Sign In
              </Link>
            </div>
          </>
        )}
      </section>
    </PublicLayout>
  );
}

