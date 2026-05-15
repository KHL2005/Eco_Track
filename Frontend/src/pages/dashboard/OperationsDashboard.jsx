import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import KpiCard from '../../components/dashboard/KpiCard';
import SectionHeading from '../../components/dashboard/SectionHeading';
import TipCard from '../../components/dashboard/TipCard';
import { CHART_COLORS } from '../../components/dashboard/constants';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';
import * as issuesApi from '../../api/issuesApi';
import * as projectsApi from '../../api/projectsApi';
import * as sensorsApi from '../../api/sensorsApi';
import * as reportsApi from '../../api/reportsApi';

export default function OperationsDashboard() {
  const { user } = useAuth();
  const { role } = useRole();

  const showSensors = ['AGENCY_OFFICER', 'SCIENTIST', 'ADMINISTRATOR', 'SUPER_ADMIN'].includes(role);

  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    issuesApi.getIssues().then(r => setIssues(r.data)).catch(() => setIssues([]));
    projectsApi.getProjects().then(r => setProjects(r.data)).catch(() => setProjects([]));
    if (showSensors) {
      sensorsApi.getSensors().then(r => setSensors(r.data)).catch(() => setSensors([]));
    }
    reportsApi.getReports().then(r => setReports(Array.isArray(r.data) ? r.data : [])).catch(() => setReports([]));
  }, [showSensors]);

  const openIssues     = issues.filter(i => i.status === 'OPEN').length;
  const resolvedIssues = issues.filter(i => i.status === 'RESOLVED').length;
  const activeProjects = projects.filter(p => p.status === 'IN_PROGRESS').length;
  const activeSensors  = sensors.filter(s => s.status === 'ACTIVE').length;

  const issueByType = Object.entries(
    issues.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  const projByStatus = Object.entries(
    projects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const roleEmoji =
    role === 'AGENCY_OFFICER' ? '🌍' :
    role === 'ADMINISTRATOR' || role === 'SUPER_ADMIN' ? '📊' : '📊';

  return (
    <DashboardLayout>
      <PageHeader
        emoji={roleEmoji}
        title={`Welcome back, ${user?.name || ''}`}
        description={`${ROLE_LABELS[role] || role} Dashboard`}
      />

      <SectionHeading emoji="📊" title="At a glance" subtitle="Live operational metrics across the platform" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard emoji="⚠️" label="Open Issues" value={openIssues} sub={`${resolvedIssues} resolved`} bg="bg-orange-50" glow="hover:shadow-orange-200/60" />
        <KpiCard emoji="🌳" label="Active Projects" value={activeProjects} sub={`${projects.length} total`} bg="bg-green-50" />
        {showSensors && (
          <KpiCard emoji="📡" label="Active Sensors" value={activeSensors} sub={`${sensors.length} total`} bg="bg-sky-50" glow="hover:shadow-sky-200/60" />
        )}
        <KpiCard emoji="📝" label="Reports" value={reports.length} sub="Total generated" bg="bg-blue-50" glow="hover:shadow-blue-200/60" />
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
                  {projByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
