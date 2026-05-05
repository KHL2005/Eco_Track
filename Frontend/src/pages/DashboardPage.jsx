import { useQuery } from '@tanstack/react-query';
import { useRole } from '../hooks/useRole';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import {
  AlertTriangle, Activity, FolderKanban, ShieldCheck, Factory,
  CheckCircle, Clock, Database, FileText, ClipboardList, TrendingUp,
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

function KpiCard({ icon: Icon, label, value, sub, color = 'text-forest-600', bg = 'bg-green-50' }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-bark-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-bark-800">{value ?? '—'}</p>
          {sub && <p className="text-xs text-bark-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </Card>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-bark-800">{title}</h2>
      {subtitle && <p className="text-xs text-bark-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { role, user } = useRole();

  const isComplianceOfficer = role === 'COMPLIANCE_OFFICER';
  const canSeeIssuesProjects = !['INDUSTRY', 'COMPLIANCE_OFFICER'].includes(role);

  const { data: issues = [] } = useQuery({
    queryKey: ['issues'],
    queryFn: () => issuesApi.getIssues().then(r => r.data).catch(() => []),
    enabled: canSeeIssuesProjects,
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

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-bark-800">Welcome back, {user?.name}</h1>
        <p className="text-bark-400 text-sm mt-0.5">{ROLE_LABELS[role] || role} Dashboard</p>
      </div>

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
            <SectionHeading title="Key Metrics" subtitle="Live compliance and audit summary" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard icon={ShieldCheck} label="Compliance Records" value={complianceRecords.length} sub={`${compliantCount} compliant`} color="text-forest-600" bg="bg-green-50" />
              <KpiCard icon={CheckCircle} label="Compliant Entities" value={compliantCount} sub="Passed all checks" color="text-emerald-600" bg="bg-emerald-50" />
              <KpiCard icon={ClipboardList} label="Total Audits" value={auditsList.length} sub={`${completedAudits} completed · ${inProgressAudits} in progress`} color="text-sky-500" bg="bg-sky-50" />
              <KpiCard icon={Clock} label="Pending Emissions" value={pendingEmissions} sub="Awaiting your review" color="text-orange-500" bg="bg-orange-50" />
            </div>
          </div>

          {/* Charts */}
          <div>
            <SectionHeading title="Analytics" subtitle="Distribution of compliance outcomes and audit progress" />
            <div className="grid lg:grid-cols-2 gap-6">
              {complianceByResult.length > 0 ? (
                <Card>
                  <h3 className="font-semibold text-bark-800 mb-4">Compliance by Result</h3>
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
                  <h3 className="font-semibold text-bark-800 mb-4">Compliance by Result</h3>
                  <div className="flex flex-col items-center justify-center h-[260px] text-bark-400 text-sm gap-2">
                    <ShieldCheck size={32} className="opacity-30" />
                    No compliance records yet
                  </div>
                </Card>
              )}

              {auditsByStatus.length > 0 ? (
                <Card>
                  <h3 className="font-semibold text-bark-800 mb-4">Audits by Status</h3>
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
                  <h3 className="font-semibold text-bark-800 mb-4">Audits by Status</h3>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard icon={Activity} label="Active Sensors" value={activeSensors} sub={`${sensors.length} total`} color="text-sky-500" bg="bg-sky-50" />
            <KpiCard icon={Database} label="Sensor Data Records" value={sensorData.length} sub="Total readings" color="text-blue-500" bg="bg-blue-50" />
            <KpiCard icon={ShieldCheck} label="Maintenance Sensors" value={sensors.filter(s => s.status === 'MAINTENANCE').length} sub="Under maintenance" color="text-yellow-500" bg="bg-yellow-50" />
            <KpiCard icon={CheckCircle} label="Inactive Sensors" value={sensors.filter(s => s.status === 'INACTIVE').length} sub="Not operational" color="text-red-500" bg="bg-red-50" />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            {sensorsByType.length > 0 && (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">Sensors by Type</h3>
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
                <h3 className="font-semibold text-bark-800 mb-4">Sensors by Status</h3>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard icon={Factory} label="Emissions Logged" value={emissions.length} sub={`${approvedEmissions} approved`} color="text-purple-500" bg="bg-purple-50" />
            <KpiCard icon={CheckCircle} label="Approved Emissions" value={approvedEmissions} sub="Verified by compliance" color="text-forest-600" bg="bg-green-50" />
            <KpiCard icon={Clock} label="Pending Review" value={pendingEmissions} sub="Awaiting verification" color="text-orange-500" bg="bg-orange-50" />
            <KpiCard icon={FileText} label="Documents" value={documents.length} sub={`${approvedDocs} verified`} color="text-sky-500" bg="bg-sky-50" />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            {emissionsByType.length > 0 ? (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">Emissions by Type</h3>
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
                <h3 className="font-semibold text-bark-800 mb-4">Emissions by Type</h3>
                <div className="flex items-center justify-center h-[260px] text-bark-400 text-sm">No emissions logged yet</div>
              </Card>
            )}
            {emissionsByStatus.length > 0 ? (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">Emissions by Status</h3>
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
                <h3 className="font-semibold text-bark-800 mb-4">Emissions by Status</h3>
                <div className="flex items-center justify-center h-[260px] text-bark-400 text-sm">No data available</div>
              </Card>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard icon={AlertTriangle} label="Open Issues" value={openIssues} sub={`${resolvedIssues} resolved`} color="text-orange-500" bg="bg-orange-50" />
            <KpiCard icon={FolderKanban} label="Active Projects" value={activeProjects} sub={`${projects.length} total`} color="text-forest-600" bg="bg-green-50" />
            {['AGENCY_OFFICER', 'SCIENTIST', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(role) && (
              <KpiCard icon={Activity} label="Active Sensors" value={activeSensors} sub={`${sensors.length} total`} color="text-sky-500" bg="bg-sky-50" />
            )}
            <KpiCard icon={Factory} label="Emissions Logged" value={emissions.length} sub={`${emissions.filter(e => e.status === 'APPROVED').length} approved`} color="text-purple-500" bg="bg-purple-50" />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            {issueByType.length > 0 && (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">Issues by Type</h3>
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
                <h3 className="font-semibold text-bark-800 mb-4">Projects by Status</h3>
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
