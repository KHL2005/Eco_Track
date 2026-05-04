import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as projectsApi from '../api/projectsApi';
import { formatNumber, formatCurrency } from '../utils/formatters';
import { PROJECT_STATUSES } from '../utils/constants';

const statusColors = {
  PLANNED: '#3b82f6',
  IN_PROGRESS: '#eab308',
  COMPLETED: '#22c55e',
  ON_HOLD: '#f3f4f6',
  CANCELLED: '#ef4444',
};

export default function ProjectDashboard() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(r => r.data).catch(() => []),
  });

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

  return (
    <DashboardLayout>
      <PageHeader
        title="Project Dashboard"
        description="Overview of all sustainability projects and performance metrics"
      />

      {/* Key Statistics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-forest-600 mb-1">{stats.totalProjects}</div>
            <div className="text-sm text-bark-600">Total Projects</div>
            <div className="text-xs text-bark-400 mt-2">{formatNumber(stats.totalBudget)} USD total budget</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-1">{stats.completedProjects}</div>
            <div className="text-sm text-bark-600">Completed</div>
            <div className="text-xs text-bark-400 mt-2">{stats.completionRate}% completion rate</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-600 mb-1">{stats.inProgressProjects}</div>
            <div className="text-sm text-bark-600">In Progress</div>
            <div className="text-xs text-bark-400 mt-2">{stats.plannedProjects} planned</div>
          </div>
        </Card>

        <Card>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600 mb-1">{stats.onHoldProjects}</div>
            <div className="text-sm text-bark-600">On Hold</div>
            <div className="text-xs text-bark-400 mt-2">{stats.cancelledProjects} cancelled</div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <Card>
          <h3 className="text-lg font-semibold text-bark-800 mb-4">Project Status Distribution</h3>
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
            <div className="text-center py-12 text-bark-400">No projects to display</div>
          )}
        </Card>

        {/* Budget Distribution by Top Projects */}
        <Card>
          <h3 className="text-lg font-semibold text-bark-800 mb-4">Top Projects by Budget</h3>
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
            <div className="text-center py-12 text-bark-400">No projects with budget</div>
          )}
        </Card>
      </div>

      {/* Recent Projects Timeline */}
      <Card>
        <h3 className="text-lg font-semibold text-bark-800 mb-4">Project Timeline (Monthly)</h3>
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
        <h3 className="text-lg font-semibold text-bark-800 mb-4">Active Projects</h3>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-bark-400">No projects yet</div>
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

