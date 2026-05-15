import { useState, useEffect } from 'react';
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

  const [myIssues, setMyIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load my issues when user is available
  useEffect(() => {
    if (!user || !user.userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    issuesApi.getIssuesByCitizen(user.userId)
      .then(function (res) {
        setMyIssues(res.data);
      })
      .catch(function () {
        setMyIssues([]);
      })
      .finally(function () {
        setIsLoading(false);
      });
  }, [user]);

  // Count issues by status using a simple loop
  const total = myIssues.length;
  let open = 0;
  let inProgress = 0;
  let resolvedClosed = 0;

  for (let i = 0; i < myIssues.length; i++) {
    const status = myIssues[i].status;
    if (status === 'OPEN') {
      open = open + 1;
    } else if (status === 'IN_PROGRESS') {
      inProgress = inProgress + 1;
    } else if (status === 'RESOLVED' || status === 'CLOSED') {
      resolvedClosed = resolvedClosed + 1;
    }
  }

  let userName = 'Citizen';
  if (user && user.name) {
    userName = user.name;
  }

  return (
    <DashboardLayout>
      <PageHeader
        emoji="🌿"
        title={`Welcome, ${userName} 👋`}
        description="Citizen Environmental Issue Tracker — track and report problems in your community"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          emoji="📋"
          label="Total Issues"
          value={isLoading ? null : total}
          bg="bg-blue-50"
          glow="hover:shadow-blue-200/60"
        />
        <KpiCard
          emoji="🟠"
          label="Open"
          value={isLoading ? null : open}
          bg="bg-orange-50"
          glow="hover:shadow-orange-200/60"
        />
        <KpiCard
          emoji="⏳"
          label="In Progress"
          value={isLoading ? null : inProgress}
          bg="bg-yellow-50"
          glow="hover:shadow-yellow-200/60"
        />
        <KpiCard
          emoji="✅"
          label="Resolved / Closed"
          value={isLoading ? null : resolvedClosed}
          bg="bg-leaf-200/40"
          glow="hover:shadow-leaf-200/80"
        />
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
