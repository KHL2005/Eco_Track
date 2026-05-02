import { useQuery } from '@tanstack/react-query';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import { AlertTriangle, Activity, FolderKanban, ShieldCheck, Factory, Users, CheckCircle, Clock, Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import * as issuesApi from '../api/issuesApi';
import * as projectsApi from '../api/projectsApi';
import * as sensorsApi from '../api/sensorsApi';
import * as emissionsApi from '../api/emissionsApi';
import { ROLE_LABELS } from '../utils/constants';

const COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#dc2626'];

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

export default function DashboardPage() {
  const { role, user } = useRole();
  const { data: issues = [] } = useQuery({ queryKey: ['issues'], queryFn: () => issuesApi.getIssues().then(r => r.data).catch(() => []) });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => projectsApi.getProjects().then(r => r.data).catch(() => []) });
  const { data: sensors = [] } = useQuery({ queryKey: ['sensors'], queryFn: () => sensorsApi.getSensors().then(r => r.data).catch(() => []), enabled: ['OFFICER', 'SCIENTIST', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(role) });
  const { data: sensorData = [] } = useQuery({ queryKey: ['sensorData'], queryFn: () => sensorsApi.getSensorData().then(r => r.data).catch(() => []), enabled: role === 'SCIENTIST' });
  const { data: emissions = [] } = useQuery({ queryKey: ['emissions'], queryFn: () => emissionsApi.getEmissions().then(r => r.data).catch(() => []) });

  const openIssues = issues.filter(i => i.status === 'OPEN').length;
  const resolvedIssues = issues.filter(i => i.status === 'RESOLVED').length;
  const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
  const activeSensors = sensors.filter(s => s.status === 'ACTIVE').length;

  // Chart data
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

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-bark-800">Welcome back, {user?.name} 👋</h1>
        <p className="text-bark-400 text-sm mt-0.5">{ROLE_LABELS[role] || role} Dashboard</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {role === 'SCIENTIST' ? (
          <>
            <KpiCard icon={Activity} label="Active Sensors" value={activeSensors} sub={`${sensors.length} total`} color="text-sky-500" bg="bg-sky-50" />
            <KpiCard icon={Database} label="Sensor Data Records" value={sensorData.length} sub="Total readings" color="text-blue-500" bg="bg-blue-50" />
            <KpiCard icon={ShieldCheck} label="Maintenance Sensors" value={sensors.filter(s => s.status === 'MAINTENANCE').length} sub="Under maintenance" color="text-yellow-500" bg="bg-yellow-50" />
            <KpiCard icon={CheckCircle} label="Inactive Sensors" value={sensors.filter(s => s.status === 'INACTIVE').length} sub="Not operational" color="text-red-500" bg="bg-red-50" />
          </>
        ) : (
          <>
            <KpiCard icon={AlertTriangle} label="Open Issues" value={openIssues} sub={`${resolvedIssues} resolved`} color="text-orange-500" bg="bg-orange-50" />
            <KpiCard icon={FolderKanban} label="Active Projects" value={activeProjects} sub={`${projects.length} total`} color="text-forest-600" bg="bg-green-50" />
            {['OFFICER', 'SCIENTIST', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(role) && (
              <KpiCard icon={Activity} label="Active Sensors" value={activeSensors} sub={`${sensors.length} total`} color="text-sky-500" bg="bg-sky-50" />
            )}
            <KpiCard icon={Factory} label="Emissions Logged" value={emissions.length} sub={`${emissions.filter(e => e.status === 'APPROVED').length} approved`} color="text-purple-500" bg="bg-purple-50" />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {role === 'SCIENTIST' ? (
          <>
            {sensorsByType.length > 0 && (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">Sensors by Type</h3>
                <ResponsiveContainer width="100%" height={220}>
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
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={sensorsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {sensorsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </>
        ) : (
          <>
            {issueByType.length > 0 && (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">Issues by Type</h3>
                <ResponsiveContainer width="100%" height={220}>
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
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={projByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {projByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
