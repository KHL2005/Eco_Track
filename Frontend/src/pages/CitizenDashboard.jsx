import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Plus, FileText, Bell } from 'lucide-react';
import * as issuesApi from '../api/issuesApi';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/formatters';
import { ISSUE_STATUSES } from '../utils/constants';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ['issues', 'citizen', user?.userId],
    queryFn: () => issuesApi.getIssuesByCitizen(user?.userId).then(r => r.data).catch(() => []),
    enabled: !!user?.userId,
  });

  // Calculate status summary
  const statusCounts = ISSUE_STATUSES.reduce((acc, status) => {
    acc[status] = issues.filter(issue => issue.status === status).length;
    return acc;
  }, {});

  const recentIssues = issues.slice(0, 5);

  const stats = [
    {
      label: 'Total Issues',
      value: issues.length,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      label: 'Resolved',
      value: statusCounts.RESOLVED || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'In Progress',
      value: statusCounts.IN_PROGRESS || 0,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Open',
      value: statusCounts.OPEN || 0,
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  const tabs = [
    { id: 'overview', label: 'Report New Issue', icon: Plus },
    { id: 'myissues', label: 'View My Issues', icon: FileText },
    { id: 'alerts', label: 'View Alerts', icon: Bell },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Citizen Dashboard"
        description="Monitor your environmental issue reports and community impact"
      />

      {/* Horizontal Tabs */}
      <div className="mb-6 border-b border-bark-400/20">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-forest-600 text-forest-600 bg-forest-50/50'
                    : 'border-transparent text-bark-600 hover:text-bark-800 hover:bg-earth-50'
                }`}
              >
                <TabIcon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-bark-800">{stat.value}</p>
                    <p className="text-sm text-bark-500">{stat.label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <Card className="p-6 bg-gradient-to-r from-forest-50 to-leaf-50 border-forest-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-bark-800 mb-2">Help Your Community</h3>
              <p className="text-bark-600 mb-4">Report environmental issues in your area to help make a difference</p>
              <Link to="/citizen/report">
                <Button className="gap-2">
                  <Plus size={16} /> Report an Issue
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recent Issues Preview */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-bark-800">Recent Activity</h3>
              <button onClick={() => setActiveTab('myissues')} className="text-forest-600 hover:text-forest-700 text-sm font-medium">
                View All →
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-bark-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-bark-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle size={48} className="mx-auto text-bark-300 mb-4" />
                <h4 className="text-lg font-medium text-bark-600 mb-2">No issues reported yet</h4>
                <p className="text-bark-500">Start making a difference by reporting environmental issues in your community.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentIssues.map((issue) => (
                  <div key={issue.id} className="flex items-center justify-between p-3 bg-earth-50 rounded-lg hover:bg-earth-100 transition-colors">
                    <div className="flex-1">
                      <Link to={`/citizen/issues/${issue.id}`} className="font-medium text-forest-600 hover:text-forest-700 hover:underline">
                        {issue.title}
                      </Link>
                      <p className="text-sm text-bark-500 mt-1">{issue.description?.substring(0, 100)}...</p>
                      <p className="text-xs text-bark-400 mt-1">
                        Reported on {formatDateTime(issue.createdAt)}
                      </p>
                    </div>
                    <div className="ml-4">
                      <StatusBadge status={issue.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'myissues' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-bark-800 mb-4">All Your Issues</h3>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-bark-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-bark-100 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={48} className="mx-auto text-bark-300 mb-4" />
                <h4 className="text-lg font-medium text-bark-600 mb-2">No issues reported</h4>
                <p className="text-bark-500 mb-4">You haven't reported any issues yet.</p>
                <button onClick={() => setActiveTab('overview')} className="text-forest-600 hover:text-forest-700 font-medium">
                  Report your first issue →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {issues.map((issue) => (
                  <Link key={issue.id} to={`/citizen/issues/${issue.id}`}>
                    <div className="p-4 bg-earth-50 rounded-lg hover:bg-earth-100 transition-colors cursor-pointer border border-bark-400/10 hover:border-forest-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-forest-600 hover:text-forest-700">{issue.title}</h4>
                          <p className="text-sm text-bark-500 mt-1">{issue.type}</p>
                        </div>
                        <StatusBadge status={issue.status} />
                      </div>
                      <p className="text-xs text-bark-400 mt-2">{formatDateTime(issue.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'alerts' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-bark-800 mb-4">Alerts & Notifications</h3>
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-bark-300 mb-4" />
            <h4 className="text-lg font-medium text-bark-600 mb-2">No new alerts</h4>
            <p className="text-bark-500">You'll receive notifications about updates to your reported issues here.</p>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
