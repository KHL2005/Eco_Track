import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as projectsApi from '../../api/projectsApi';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import { PROJECT_STATUSES } from '../../utils/constants';

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

const statusColors = {
  PLANNED: '#3b82f6',
  IN_PROGRESS: '#eab308',
  COMPLETED: '#22c55e',
  ON_HOLD: '#f3f4f6',
  CANCELLED: '#ef4444',
};

export default function ProjectDashboard() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    projectsApi.getProjects().then(r => setProjects(r.data)).catch(() => setProjects([]));
  }, []);

  // Calculate statistics
  const stats = {
    totalProjects: projects.length,
    plannedProjects: projects.filter(p => p.status === 'PLANNED').length,
    inProgressProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
    completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
    onHoldProjects: projects.filter(p => p.status === 'ON_HOLD').length,
    cancelledProjects: projects.filter(p => p.status === 'CANCELLED').length,
    totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
    completionRate: projects.length > 0 ? Math.round((projects.filter(p => p.status === 'COMPLETED').length / projects.length) * 100) : 0,
  };

  // Status distribution
  const statusData = PROJECT_STATUSES.map(status => ({
    name: status,
    value: projects.filter(p => p.status === status).length,
  })).filter(d => d.value > 0);

  // Monthly distribution (mock - based on creation date patterns)
  const monthlyData = [
    { month: 'Jan', projects: Math.floor(Math.random() * 5) + 1 },
    { month: 'Feb', projects: Math.floor(Math.random() * 5) + 2 },
    { month: 'Mar', projects: Math.floor(Math.random() * 5) + 3 },
    { month: 'Apr', projects: Math.floor(Math.random() * 5) + 2 },
    { month: 'May', projects: Math.floor(Math.random() * 5) + 1 },
  ];

  // Top projects by budget
  const topProjects = projects
    .filter(p => p.budget)
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 5);

  const budgetData = topProjects.map(p => ({
    name: p.title.substring(0, 15) + (p.title.length > 15 ? '...' : ''),
    budget: p.budget,
  }));

  const kpis = [
    { emoji: '🌳', label: 'Total Projects',  value: stats.totalProjects,      sub: `${formatNumber(stats.totalBudget)} USD total budget`, valueClass: 'text-forest-700',  bg: 'bg-leaf-200/40', glow: 'hover:shadow-leaf-200/80' },
    { emoji: '✅', label: 'Completed',       value: stats.completedProjects,  sub: `${stats.completionRate}% completion rate`,            valueClass: 'text-emerald-600', bg: 'bg-emerald-50',  glow: 'hover:shadow-emerald-200/60' },
    { emoji: '⏳', label: 'In Progress',     value: stats.inProgressProjects, sub: `${stats.plannedProjects} planned`,                    valueClass: 'text-yellow-600',  bg: 'bg-yellow-50',   glow: 'hover:shadow-yellow-200/60' },
    { emoji: '⏸️', label: 'On Hold',         value: stats.onHoldProjects,     sub: `${stats.cancelledProjects} cancelled`,                valueClass: 'text-red-600',     bg: 'bg-red-50',      glow: 'hover:shadow-red-200/60' },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        emoji="🌳"
        title="Project Dashboard"
        description="Overview of all sustainability projects and performance metrics"
        action={
          <Link to="/projects"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
            <Plus size={16} /> View All Projects
          </Link>
        }
      />

      {/* Key Statistics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ emoji, label, value, sub, valueClass, bg, glow }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className={`bg-white rounded-2xl p-5 border border-bark-300/20 shadow-sm hover:-translate-y-1 hover:shadow-lg ${glow} transition-all`}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-medium text-bark-500 uppercase tracking-wide">{label}</p>
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center text-lg ring-1 ring-inset ring-black/5`} aria-hidden="true">{emoji}</div>
            </div>
            <div className={`text-4xl font-extrabold ${valueClass} leading-none`}>
              <CountUp end={value} />
            </div>
            <div className="text-xs text-bark-400 mt-2">{sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Sustainability tip */}
      <div className="bg-gradient-to-br from-leaf-200/60 to-earth-50 rounded-2xl p-5 border border-leaf-200 flex items-start gap-4 mb-6">
        <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm shrink-0" aria-hidden="true">🌱</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-forest-900">Sustainability tip of the day</p>
          <p className="text-xs text-bark-600 mt-1 leading-relaxed">
            Projects with measurable impact metrics (CO₂ reduced, trees planted, water saved) attract 3× more agency funding. Add metrics to every active project.
          </p>
        </div>
        <Link to="/projects" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 hover:text-forest-800 self-center shrink-0">
          Review projects <ArrowRight size={14} />
        </Link>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-bark-800 mb-4">📊 Project Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState emoji="🌳" title="No projects to display" description="Once projects are created, their status distribution will appear here." />
          )}
        </Card>

        {/* Budget Distribution by Top Projects */}
        <Card>
          <h3 className="text-lg font-semibold text-bark-800 mb-4">💰 Top Projects by Budget</h3>
          {budgetData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="budget" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState emoji="💰" title="No projects with budget" description="Add a budget to projects to see them ranked here." />
          )}
        </Card>
      </div>

      {/* Recent Projects Timeline */}
      <Card>
        <h3 className="text-lg font-semibold text-bark-800 mb-4">📅 Project Timeline (Monthly)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="projects" stroke="#2d6a4f" strokeWidth={2} dot={{ fill: '#2d6a4f' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Projects Table */}
      <Card>
        <h3 className="text-lg font-semibold text-bark-800 mb-4">🌿 Active Projects</h3>
        {projects.length === 0 ? (
          <EmptyState
            emoji="🌳"
            title="No projects yet"
            description="Create your first sustainability project to start tracking impact."
            hint="Projects can include reforestation, water conservation, waste reduction, and more."
            action={
              <Link to="/projects" className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold rounded-xl transition-colors">
                <Plus size={16} /> Create a project
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bark-400/20">
                  <th className="text-left py-3 px-4 text-bark-600 font-medium">Project</th>
                  <th className="text-left py-3 px-4 text-bark-600 font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-bark-600 font-medium">Budget</th>
                  <th className="text-center py-3 px-4 text-bark-600 font-medium">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b border-bark-400/10 hover:bg-earth-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-bark-800">{p.title}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium inline-block`} style={{ backgroundColor: statusColors[p.status], color: 'white' }}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-bark-600">
                      {p.budget ? formatCurrency(p.budget) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-bark-400">
                      {p.startDate && p.endDate ? (
                        <span>
                          {new Date(p.endDate).getFullYear() - new Date(p.startDate).getFullYear()} yr
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}

