import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRole } from '../hooks/useRole';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import {
  AlertTriangle, Activity, FolderKanban, ShieldCheck, Factory,
  CheckCircle, Clock, Database, FileText, ClipboardList, TrendingUp,
  Layers, CircleDot, Loader2, BadgeCheck, Plus, Lightbulb, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import * as issuesApi from '../api/issuesApi';
import * as projectsApi from '../api/projectsApi';
import * as sensorsApi from '../api/sensorsApi';
import * as emissionsApi from '../api/emissionsApi';
import * as complianceApi from '../api/complianceApi';
import { ROLE_LABELS } from '../utils/constants';

const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#dc2626', '#8b5cf6'];

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

function KpiCard({ icon: Icon, emoji, label, value, sub, color = 'text-forest-600', bg = 'bg-green-50', glow = 'hover:shadow-leaf-200/60' }) {
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
          {emoji ? <span className="text-xl" aria-hidden="true">{emoji}</span> : <Icon size={20} className={color} />}
        </div>
      </div>
    </motion.div>
  );
}

function SectionHeading({ emoji, title, subtitle, action }) {
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

function TipCard({ emoji = '💡', title, body, action }) {
  return (
    <div className="bg-gradient-to-br from-leaf-200/60 to-earth-50 rounded-2xl p-5 border border-leaf-200 flex items-start gap-4">
      <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm shrink-0" aria-hidden="true">{emoji}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-forest-900">{title}</p>
        {body && <p className="text-xs text-bark-600 mt-1 leading-relaxed">{body}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { role, user } = useRole();

  const isCitizen          = role === 'CITIZEN';
  const isComplianceOfficer = role === 'COMPLIANCE_OFFICER';
  const canSeeIssuesProjects = !['INDUSTRY', 'COMPLIANCE_OFFICER'].includes(role);

  // Citizen fetches only their own issues
  const { data: myIssues = [], isLoading: myIssuesLoading } = useQuery({
    queryKey: ['issues', 'citizen', user?.userId],
    queryFn: () => issuesApi.getIssuesByCitizen(user?.userId).then(r => r.data).catch(() => []),
    enabled: isCitizen && !!user?.userId,
  });

  const { data: issues = [] } = useQuery({
    queryKey: ['issues'],
    queryFn: () => issuesApi.getIssues().then(r => r.data).catch(() => []),
    enabled: canSeeIssuesProjects && !isCitizen,
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(r => r.data).catch(() => []),
    enabled: canSeeIssuesProjects,
  });
  const { data: sensors = [] } = useQuery({
    queryKey: ['sensors'],
    queryFn: () => sensorsApi.getSensors().then(r => r.data).catch(() => []),
    enabled: ['AGENCY_OFFICER', 'SCIENTIST', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(role),
  });
  const { data: sensorData = [] } = useQuery({
    queryKey: ['sensorData'],
    queryFn: () => sensorsApi.getSensorData().then(r => r.data).catch(() => []),
    enabled: role === 'SCIENTIST',
  });
  const { data: emissions = [] } = useQuery({
    queryKey: ['emissions'],
    queryFn: () => emissionsApi.getEmissions().then(r => r.data).catch(() => []),
  });
  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => emissionsApi.getDocuments().then(r => r.data).catch(() => []),
    enabled: role === 'INDUSTRY',
  });
  const { data: complianceRecords = [] } = useQuery({
    queryKey: ['compliance'],
    queryFn: () => complianceApi.getComplianceRecords().then(r => r.data).catch(() => []),
    enabled: isComplianceOfficer,
  });
  const { data: auditsList = [] } = useQuery({
    queryKey: ['audits'],
    queryFn: () => complianceApi.getAudits().then(r => r.data).catch(() => []),
    enabled: isComplianceOfficer,
  });

  const openIssues = issues.filter(i => i.status === 'OPEN').length;
  const resolvedIssues = issues.filter(i => i.status === 'RESOLVED').length;
  const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
  const activeSensors = sensors.filter(s => s.status === 'ACTIVE').length;

  const issueByType = Object.entries(
    issues.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  const projByStatus = Object.entries(
    projects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const sensorsByType = Object.entries(
    sensors.reduce((acc, s) => { acc[s.type] = (acc[s.type] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const sensorsByStatus = Object.entries(
    sensors.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const approvedEmissions = emissions.filter(e => e.status === 'APPROVED').length;
  const pendingEmissions = emissions.filter(e => e.status === 'SUBMITTED').length;
  const approvedDocs = documents.filter(d => d.verificationStatus === 'APPROVED').length;
  const emissionsByType = Object.entries(
    emissions.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));
  const emissionsByStatus = Object.entries(
    emissions.reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const compliantCount = complianceRecords.filter(r => r.result === 'COMPLIANT').length;
  const nonCompliantCount = complianceRecords.filter(r => r.result === 'NON_COMPLIANT').length;
  const completedAudits = auditsList.filter(a => a.status === 'COMPLETED').length;
  const inProgressAudits = auditsList.filter(a => a.status === 'IN_PROGRESS').length;
  const complianceRate = complianceRecords.length > 0
    ? Math.round((compliantCount / complianceRecords.length) * 100)
    : 0;

  const complianceByResult = Object.entries(
    complianceRecords.reduce((acc, r) => { acc[r.result] = (acc[r.result] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  const auditsByStatus = Object.entries(
    auditsList.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  // ── CITIZEN HOME ──────────────────────────────────────────────
  if (isCitizen) {
    const total      = myIssues.length;
    const open       = myIssues.filter(i => i.status === 'OPEN').length;
    const inProgress = myIssues.filter(i => i.status === 'IN_PROGRESS').length;
    const resolvedClosed = myIssues.filter(i => ['RESOLVED', 'CLOSED'].includes(i.status)).length;

    const stats = [
      { label: 'Total Issues',      value: total,          emoji: '📋', bg: 'bg-blue-50',   glow: 'hover:shadow-blue-200/60'   },
      { label: 'Open',              value: open,           emoji: '🟠', bg: 'bg-orange-50', glow: 'hover:shadow-orange-200/60' },
      { label: 'In Progress',       value: inProgress,     emoji: '⏳', bg: 'bg-yellow-50', glow: 'hover:shadow-yellow-200/60' },
      { label: 'Resolved / Closed', value: resolvedClosed, emoji: '✅', bg: 'bg-leaf-200/40', glow: 'hover:shadow-leaf-200/80'  },
    ];

    return (
      <DashboardLayout>
        <PageHeader
          emoji="🌿"
          title={`Welcome, ${user?.name || 'Citizen'} 👋`}
          description="Citizen Environmental Issue Tracker — track and report problems in your community"
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map(({ label, value, emoji, bg, glow }) => (
            <KpiCard key={label} emoji={emoji} label={label} value={myIssuesLoading ? null : value} bg={bg} glow={glow} />
          ))}
        </div>

        {/* Tip + Quick actions row */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <TipCard
              emoji="💡"
              title="Did you know?"
              body="A clear photo and accurate location can cut response time on environmental reports by up to 60%. Take a moment to add both when you submit."
            />
          </div>
          <div className="bg-white rounded-2xl p-5 border border-bark-300/20 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-forest-600 mb-3">⚡ Quick actions</p>
            <div className="flex flex-col gap-2">
              <Link to="/issues/new"
                className="inline-flex items-center justify-between gap-2 px-4 py-2.5 bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold rounded-xl transition-colors group">
                <span className="flex items-center gap-2">📸 Report new issue</span>
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link to="/issues/mine"
                className="inline-flex items-center justify-between gap-2 px-4 py-2.5 bg-leaf-200/60 hover:bg-leaf-200 text-forest-900 text-sm font-medium rounded-xl transition-colors group">
                <span className="flex items-center gap-2">📋 View my issues</span>
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  // ─────────────────────────────────────────────────────────────

  // Role-specific header emoji
  const roleEmoji =
    isComplianceOfficer ? '🛡️' :
    role === 'SCIENTIST' ? '🔬' :
    role === 'INDUSTRY' ? '🏭' :
    role === 'AGENCY_OFFICER' ? '🌍' :
    role === 'ADMINISTRATOR' || role === 'SUPER_ADMIN' ? '📊' : '📊';

  return (
    <DashboardLayout>
      <PageHeader
        emoji={roleEmoji}
        title={`Welcome back, ${user?.name || ''}`}
        description={`${ROLE_LABELS[role] || role} Dashboard`}
      />

      {/* ── COMPLIANCE OFFICER ── */}
      {isComplianceOfficer ? (
        <div className="space-y-6">
          {/* Compliance rate banner */}
          <Card className="bg-gradient-to-r from-forest-600 to-emerald-500 border-0 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Overall Compliance Rate</p>
                <p className="text-5xl font-bold">{complianceRate}<span className="text-2xl font-normal">%</span></p>
                <p className="text-white/70 text-xs mt-2">
                  {compliantCount} compliant · {nonCompliantCount} non-compliant · {complianceRecords.length - compliantCount - nonCompliantCount} pending/partial
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <TrendingUp size={40} className="text-white/40" />
                <div className="w-32 bg-white/20 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-white"
                    style={{ width: `${complianceRate}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* KPI row */}
          <div>
            <SectionHeading emoji="📊" title="Key Metrics" subtitle="Live compliance and audit summary" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard emoji="🛡️" label="Compliance Records" value={complianceRecords.length} sub={`${compliantCount} compliant`} bg="bg-green-50" />
              <KpiCard emoji="✅" label="Compliant Entities" value={compliantCount} sub="Passed all checks" bg="bg-emerald-50" glow="hover:shadow-emerald-200/60" />
              <KpiCard emoji="📋" label="Total Audits" value={auditsList.length} sub={`${completedAudits} completed · ${inProgressAudits} in progress`} bg="bg-sky-50" glow="hover:shadow-sky-200/60" />
              <KpiCard emoji="⏳" label="Pending Emissions" value={pendingEmissions} sub="Awaiting your review" bg="bg-orange-50" glow="hover:shadow-orange-200/60" />
            </div>
          </div>

          {/* Charts */}
          <div>
            <SectionHeading emoji="📈" title="Analytics" subtitle="Distribution of compliance outcomes and audit progress" />
            <div className="grid lg:grid-cols-2 gap-6">
              {complianceByResult.length > 0 ? (
                <Card>
                  <h3 className="font-semibold text-bark-800 mb-4">🛡️ Compliance by Result</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={complianceByResult} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} innerRadius={35}>
                        {complianceByResult.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              ) : (
                <Card>
                  <h3 className="font-semibold text-bark-800 mb-4">🛡️ Compliance by Result</h3>
                  <div className="flex flex-col items-center justify-center h-[260px] text-bark-400 text-sm gap-2">
                    <ShieldCheck size={32} className="opacity-30" />
                    No compliance records yet
                  </div>
                </Card>
              )}

              {auditsByStatus.length > 0 ? (
                <Card>
                  <h3 className="font-semibold text-bark-800 mb-4">📋 Audits by Status</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={auditsByStatus} barCategoryGap="30%">
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              ) : (
                <Card>
                  <h3 className="font-semibold text-bark-800 mb-4">📋 Audits by Status</h3>
                  <div className="flex flex-col items-center justify-center h-[260px] text-bark-400 text-sm gap-2">
                    <ClipboardList size={32} className="opacity-30" />
                    No audits yet
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Pending emissions spotlight */}
          {pendingEmissions > 0 && (
            <Card className="border-l-4 border-l-orange-400 bg-orange-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Clock size={18} className="text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-bark-800">
                    {pendingEmissions} emission{pendingEmissions > 1 ? 's' : ''} awaiting review
                  </p>
                  <p className="text-xs text-bark-400">Go to Emissions to approve or reject pending submissions.</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      ) : role === 'SCIENTIST' ? (
        <>
          <SectionHeading emoji="📊" title="Sensor network at a glance" subtitle="Live status across the deployed sensor fleet" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard emoji="📡" label="Active Sensors" value={activeSensors} sub={`${sensors.length} total`} bg="bg-sky-50" glow="hover:shadow-sky-200/60" />
            <KpiCard emoji="💧" label="Sensor Data Records" value={sensorData.length} sub="Total readings" bg="bg-blue-50" glow="hover:shadow-blue-200/60" />
            <KpiCard emoji="🛠️" label="Maintenance Sensors" value={sensors.filter(s => s.status === 'MAINTENANCE').length} sub="Under maintenance" bg="bg-yellow-50" glow="hover:shadow-yellow-200/60" />
            <KpiCard emoji="🚫" label="Inactive Sensors" value={sensors.filter(s => s.status === 'INACTIVE').length} sub="Not operational" bg="bg-red-50" glow="hover:shadow-red-200/60" />
          </div>
          <div className="mb-6">
            <TipCard
              emoji="🔬"
              title="Tip: cross-reference anomalies"
              body="When a sensor shows a sudden spike, jump to Analysis to compare against neighboring sensors and historical baselines before flagging."
            />
          </div>
          <SectionHeading emoji="📈" title="Analytics" subtitle="Sensor distribution and operational status" />
          <div className="grid lg:grid-cols-2 gap-6">
            {sensorsByType.length > 0 && (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">📡 Sensors by Type</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sensorsByType}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
            {sensorsByStatus.length > 0 && (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">🟢 Sensors by Status</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={sensorsByStatus} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} innerRadius={35}>
                      {sensorsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        </>
      ) : role === 'INDUSTRY' ? (
        <>
          <SectionHeading emoji="📊" title="Compliance overview" subtitle="Your emissions and document submission status" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard emoji="🏭" label="Emissions Logged" value={emissions.length} sub={`${approvedEmissions} approved`} bg="bg-purple-50" glow="hover:shadow-purple-200/60" />
            <KpiCard emoji="✅" label="Approved Emissions" value={approvedEmissions} sub="Verified by compliance" bg="bg-green-50" />
            <KpiCard emoji="⏳" label="Pending Review" value={pendingEmissions} sub="Awaiting verification" bg="bg-orange-50" glow="hover:shadow-orange-200/60" />
            <KpiCard emoji="📄" label="Documents" value={documents.length} sub={`${approvedDocs} verified`} bg="bg-sky-50" glow="hover:shadow-sky-200/60" />
          </div>
          <div className="mb-6">
            <TipCard
              emoji="📌"
              title="Stay ahead of audits"
              body="Submit emissions and supporting documents promptly. Pending items can hold up your quarterly compliance score."
            />
          </div>
          <SectionHeading emoji="📈" title="Analytics" subtitle="Distribution of your emissions" />
          <div className="grid lg:grid-cols-2 gap-6">
            {emissionsByType.length > 0 ? (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">🏭 Emissions by Type</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={emissionsByType}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            ) : (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">🏭 Emissions by Type</h3>
                <div className="flex items-center justify-center h-[260px] text-bark-400 text-sm">No emissions logged yet</div>
              </Card>
            )}
            {emissionsByStatus.length > 0 ? (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">🟢 Emissions by Status</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={emissionsByStatus} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} innerRadius={35}>
                      {emissionsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            ) : (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">🟢 Emissions by Status</h3>
                <div className="flex items-center justify-center h-[260px] text-bark-400 text-sm">No data available</div>
              </Card>
            )}
          </div>
        </>
      ) : (
        <>
          <SectionHeading emoji="📊" title="At a glance" subtitle="Live operational metrics across the platform" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard emoji="⚠️" label="Open Issues" value={openIssues} sub={`${resolvedIssues} resolved`} bg="bg-orange-50" glow="hover:shadow-orange-200/60" />
            <KpiCard emoji="🌳" label="Active Projects" value={activeProjects} sub={`${projects.length} total`} bg="bg-green-50" />
            {['AGENCY_OFFICER', 'SCIENTIST', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(role) && (
              <KpiCard emoji="📡" label="Active Sensors" value={activeSensors} sub={`${sensors.length} total`} bg="bg-sky-50" glow="hover:shadow-sky-200/60" />
            )}
            <KpiCard emoji="🏭" label="Emissions Logged" value={emissions.length} sub={`${emissions.filter(e => e.status === 'APPROVED').length} approved`} bg="bg-purple-50" glow="hover:shadow-purple-200/60" />
          </div>
          <div className="mb-6">
            <TipCard
              emoji="🌍"
              title="Today's focus"
              body={openIssues > 0
                ? `${openIssues} issue${openIssues > 1 ? 's' : ''} are still open. Triage the highest-impact reports first.`
                : 'All caught up! Use this time to review project milestones and audit upcoming compliance deadlines.'}
              action={
                <Link to={openIssues > 0 ? '/issues' : '/projects'}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-700 hover:text-forest-800">
                  {openIssues > 0 ? 'Go to Issues' : 'Go to Projects'} <ArrowRight size={14} />
                </Link>
              }
            />
          </div>
          <SectionHeading emoji="📈" title="Analytics" subtitle="Issue and project distributions" />
          <div className="grid lg:grid-cols-2 gap-6">
            {issueByType.length > 0 && (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">⚠️ Issues by Type</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={issueByType}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
            {projByStatus.length > 0 && (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">🌳 Projects by Status</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={projByStatus} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} innerRadius={35}>
                      {projByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
