import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Calendar, DollarSign, User, TreePine, Droplets, Wind } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import * as projectsApi from '../api/projectsApi';
import { formatDate, formatCurrency, formatNumber } from '../utils/formatters';
import { MILESTONE_STATUSES } from '../utils/constants';

const milestoneColor = { PENDING: 'border-gray-300 bg-gray-50', IN_PROGRESS: 'border-yellow-300 bg-yellow-50', COMPLETED: 'border-green-300 bg-green-50', DELAYED: 'border-red-300 bg-red-50' };

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getProjectById(id).then(r => r.data),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', id],
    queryFn: () => projectsApi.getMilestonesByProject(id).then(r => r.data).catch(() => []),
  });

  const { data: impact } = useQuery({
    queryKey: ['impact', id],
    queryFn: () => projectsApi.getImpactByProject(id).then(r => r.data).catch(() => null),
  });

  if (isLoading) return <DashboardLayout><div className="animate-pulse h-64 bg-earth-100 rounded-2xl" /></DashboardLayout>;
  if (!project) return <DashboardLayout><p className="text-bark-400">Project not found.</p></DashboardLayout>;

  const impactChartData = impact ? [
    { name: 'Trees Planted', value: impact.treesPlanted || 0 },
    { name: 'CO₂ Reduced (t)', value: impact.co2ReducedTons || 0 },
    { name: 'Water Saved (kL)', value: (impact.waterSavedLiters || 0) / 1000 },
    { name: 'Area (sqm)', value: impact.areaRestoredSqm || 0 },
    { name: 'Beneficiaries', value: impact.beneficiariesCount || 0 },
  ].filter(d => d.value > 0) : [];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6"><ArrowLeft size={16} /> Back</Button>

        <Card className="mb-4">
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <h1 className="text-xl font-bold text-bark-800">{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-sm text-bark-600 mb-4 leading-relaxed">{project.description}</p>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-bark-400">
            {project.managerName && <span className="flex items-center gap-1.5"><User size={14} />{project.managerName}</span>}
            {project.startDate && <span className="flex items-center gap-1.5"><Calendar size={14} />{formatDate(project.startDate)} → {project.endDate ? formatDate(project.endDate) : 'Ongoing'}</span>}
            {project.budget && <span className="flex items-center gap-1.5"><DollarSign size={14} />{formatCurrency(project.budget)}</span>}
          </div>
        </Card>

        {/* Milestones */}
        <Card className="mb-4">
          <h2 className="font-semibold text-bark-800 mb-4">Milestones ({milestones.length})</h2>
          {milestones.length === 0 ? (
            <p className="text-sm text-bark-400">No milestones yet.</p>
          ) : (
            <div className="space-y-3">
              {milestones.map((m, i) => (
                <div key={m.id} className={`flex items-center gap-4 p-3 rounded-xl border-l-4 ${milestoneColor[m.status] || 'border-bark-400/20 bg-earth-100'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-bark-800">{m.title}</span>
                      <StatusBadge status={m.status} />
                    </div>
                    {m.description && <p className="text-xs text-bark-400">{m.description}</p>}
                  </div>
                  <div className="text-xs text-bark-400 text-right flex-shrink-0">
                    <div>Due: {formatDate(m.dueDate)}</div>
                    {m.completedAt && <div className="text-green-600">Done: {formatDate(m.completedAt)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Impact */}
        {impact && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-bark-800">Environmental Impact</h2>
              <StatusBadge status={impact.status} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {[
                { icon: TreePine, label: 'Trees Planted', value: formatNumber(impact.treesPlanted) },
                { icon: Wind, label: 'CO₂ Reduced', value: `${formatNumber(impact.co2ReducedTons)} t` },
                { icon: Droplets, label: 'Water Saved', value: `${formatNumber(impact.waterSavedLiters)} L` },
              ].filter(item => item.value && item.value !== '— t' && item.value !== '— L').map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-earth-100 rounded-xl p-3 text-center">
                  <Icon size={20} className="text-forest-600 mx-auto mb-1" />
                  <div className="font-bold text-bark-800">{value}</div>
                  <div className="text-xs text-bark-400">{label}</div>
                </div>
              ))}
            </div>
            {impactChartData.length > 0 && (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={impactChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}


