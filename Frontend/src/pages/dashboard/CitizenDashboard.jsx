import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import KpiCard from '../../components/dashboard/KpiCard';
import TipCard from '../../components/dashboard/TipCard';
import { useAuth } from '../../context/AuthContext';
import * as issuesApi from '../../api/issuesApi';

export default function CitizenDashboard() {
  const { user } = useAuth();

  const { data: myIssues = [], isLoading } = useQuery({
    queryKey: ['issues', 'citizen', user?.userId],
    queryFn: () => issuesApi.getIssuesByCitizen(user?.userId).then(r => r.data).catch(() => []),
    enabled: !!user?.userId,
  });

  const total          = myIssues.length;
  const open           = myIssues.filter(i => i.status === 'OPEN').length;
  const inProgress     = myIssues.filter(i => i.status === 'IN_PROGRESS').length;
  const resolvedClosed = myIssues.filter(i => ['RESOLVED', 'CLOSED'].includes(i.status)).length;

  const stats = [
    { label: 'Total Issues',      value: total,          emoji: '📋', bg: 'bg-blue-50',     glow: 'hover:shadow-blue-200/60'   },
    { label: 'Open',              value: open,           emoji: '🟠', bg: 'bg-orange-50',   glow: 'hover:shadow-orange-200/60' },
    { label: 'In Progress',       value: inProgress,     emoji: '⏳', bg: 'bg-yellow-50',   glow: 'hover:shadow-yellow-200/60' },
    { label: 'Resolved / Closed', value: resolvedClosed, emoji: '✅', bg: 'bg-leaf-200/40', glow: 'hover:shadow-leaf-200/80'   },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        emoji="🌿"
        title={`Welcome, ${user?.name || 'Citizen'} 👋`}
        description="Citizen Environmental Issue Tracker — track and report problems in your community"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, emoji, bg, glow }) => (
          <KpiCard key={label} emoji={emoji} label={label} value={isLoading ? null : value} bg={bg} glow={glow} />
        ))}
      </div>

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
