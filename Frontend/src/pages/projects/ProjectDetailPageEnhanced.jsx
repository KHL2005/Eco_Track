import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import MilestoneManagement from '../../components/projects/MilestoneManagement';
import ImpactManagement from '../../components/projects/ImpactManagement';
import { ArrowLeft, Calendar, DollarSign, User, TreePine, Droplets, Wind, Edit, Trash2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import * as projectsApi from '../../api/projectsApi';
import { formatDate, formatCurrency, formatNumber, labelify } from '../../utils/formatters';
import { PROJECT_STATUSES } from '../../utils/constants';
import { useRole } from '../../hooks/useRole';
import { toast } from 'sonner';

export default function ProjectDetailPageEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { canManageProjects } = useRole();

  const [editModal, setEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState({
     title: '',
     description: '',
     startDate: '',
     endDate: '',
     budget: '',
     status: 'PLANNED',
   });

  const editSet = (k) => (e) => setEditForm(f => ({ ...f, [k]: e.target.value }));

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getProjectById(id).then(r => r.data),
  });

  const { data: milestones = [], refetch: refetchMilestones } = useQuery({
    queryKey: ['milestones', id],
    queryFn: () => projectsApi.getMilestonesByProject(id).then(r => r.data).catch(() => []),
  });

  const { data: impact, refetch: refetchImpact } = useQuery({
    queryKey: ['impact', id],
    queryFn: () => projectsApi.getImpactByProject(id).then(r => r.data).catch(() => null),
  });

  // Calculate progress
  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(m => m.status === 'COMPLETED').length;
  const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  const updateMut = useMutation({
    mutationFn: (d) => projectsApi.updateProject(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Project updated');
      setEditModal(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update project'),
  });

  const deleteMut = useMutation({
    mutationFn: () => projectsApi.deleteProject(id),
    onSuccess: () => {
      toast.success('Project deleted');
      navigate('/projects');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete project'),
  });

   const onOpenEdit = () => {
     if (project) {
       setEditForm({
         title: project.title || '',
         description: project.description || '',
         startDate: project.startDate || '',
         endDate: project.endDate || '',
         budget: project.budget || '',
         status: project.status || 'PLANNED',
       });
       setEditModal(true);
     }
   };

  const handleUpdate = () => {
    if (!editForm.title) {
      toast.error('Title is required');
      return;
    }
    const data = {
      ...editForm,
      budget: editForm.budget ? parseFloat(editForm.budget) : null,
    };
    updateMut.mutate(data);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-earth-100 rounded-2xl" />
          <div className="h-32 bg-earth-100 rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <Card>
          <div className="text-center py-8">
            <p className="text-bark-400 mb-4">Project not found.</p>
            <Button onClick={() => navigate('/projects')} variant="outline">Back to Projects</Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  const impactChartData = impact ? [
    { name: 'Trees', value: impact.treesPlanted || 0 },
    { name: 'CO₂ (t)', value: impact.co2ReducedTons || 0 },
    { name: 'Water (kL)', value: (impact.waterSavedLiters || 0) / 1000 },
    { name: 'Area (sqm)', value: impact.areaRestoredSqm || 0 },
    { name: 'Beneficiaries', value: impact.beneficiariesCount || 0 },
  ].filter(d => d.value > 0) : [];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            <ArrowLeft size={16} /> Back to Projects
          </Button>
          {canManageProjects && (
            <div className="flex gap-2">
              <Button onClick={onOpenEdit} size="sm" variant="outline">
                <Edit size={16} /> Edit
              </Button>
              <Button
                onClick={() => setDeleteConfirm(true)}
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          )}
        </div>

        {/* Project Info Card */}
        <Card>
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-bark-800 flex items-center gap-2"><span aria-hidden="true">🌳</span> <span>{project.title}</span></h1>
              <p className="text-sm text-bark-600 mt-1 leading-relaxed">{project.description}</p>
            </div>
            <StatusBadge status={project.status} />
          </div>

           <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm text-bark-600">
             {project.startDate && (
               <div className="flex items-center gap-2">
                 <Calendar size={16} className="text-forest-600" />
                 <span>
                   {formatDate(project.startDate)} → {project.endDate ? formatDate(project.endDate) : 'Ongoing'}
                 </span>
               </div>
             )}
             {project.budget && (
               <div className="flex items-center gap-2">
                 <DollarSign size={16} className="text-forest-600" />
                 <span>{formatCurrency(project.budget)}</span>
               </div>
             )}
             <div className="flex items-center gap-2">
               <BarChart3 size={16} className="text-forest-600" />
               <span className="font-medium">{progressPercent}% Progress</span>
             </div>
           </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-bark-600">Project Progress</span>
              <span className="text-xs text-bark-400">{completedMilestones}/{totalMilestones} milestones</span>
            </div>
            <div className="w-full h-2.5 bg-earth-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-forest-500 to-forest-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Milestones Section */}
        <Card>
          <h2 className="text-lg font-semibold text-bark-800 mb-4 flex items-center gap-2">
            <span>📍</span> Milestones
            {milestones.length > 0 && (
              <span className="text-xs bg-earth-100 text-bark-600 px-2 py-1 rounded-full ml-auto">
                {completedMilestones}/{totalMilestones}
              </span>
            )}
          </h2>
          <MilestoneManagement
            projectId={id}
            milestones={milestones}
            onRefresh={() => refetchMilestones()}
            canEdit={canManageProjects}
          />
        </Card>

        {/* Impact Section */}
        <Card>
          <h2 className="text-lg font-semibold text-bark-800 mb-4 flex items-center gap-2">
            <span>🌿</span> Environmental Impact
          </h2>
          <ImpactManagement
            projectId={id}
            impact={impact}
            onRefresh={() => refetchImpact()}
            canEdit={canManageProjects}
          />

          {/* Impact Chart */}
          {impact && impactChartData.length > 0 && (
            <div className="mt-6 pt-6 border-t border-bark-400/20">
              <h3 className="text-sm font-semibold text-bark-800 mb-4">Impact Visualization</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={impactChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Statistics */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-forest-600 mb-1">{milestones.length}</div>
              <div className="text-sm text-bark-600">Total Milestones</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{completedMilestones}</div>
              <div className="text-sm text-bark-600">Completed</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {milestones.filter(m => m.status === 'IN_PROGRESS').length}
              </div>
              <div className="text-sm text-bark-600">In Progress</div>
            </div>
          </Card>
        </div>
      </div>

       {/* Edit Modal */}
       <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Project" size="lg">
         <div className="space-y-4">
           {[['title', 'Project Title'], ['description', 'Description']].map(([k, label]) => (
             <div key={k}>
               <label className="block text-sm font-medium text-bark-600 mb-1">{label}</label>
               {k === 'description' ? (
                 <textarea
                   rows={3}
                   className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                   value={editForm[k]}
                   onChange={editSet(k)}
                 />
               ) : (
                 <input
                   className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                   value={editForm[k]}
                   onChange={editSet(k)}
                 />
               )}
             </div>
           ))}
           <div className="grid sm:grid-cols-2 gap-4">
             {[['startDate', 'Start Date', 'date'], ['endDate', 'End Date', 'date'], ['budget', 'Budget (USD)', 'number']].map(([k, label, type]) => (
               <div key={k}>
                 <label className="block text-sm font-medium text-bark-600 mb-1">{label}</label>
                 <input
                   type={type}
                   className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                   value={editForm[k]}
                   onChange={editSet(k)}
                 />
               </div>
             ))}
             <div>
               <label className="block text-sm font-medium text-bark-600 mb-1">Status</label>
               <select
                 className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                 value={editForm.status}
                 onChange={editSet('status')}
               >
                 {PROJECT_STATUSES.map(s => <option key={s} value={s}>{labelify(s)}</option>)}
               </select>
             </div>
           </div>
           <div className="flex gap-3 justify-end">
             <Button variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
             <Button onClick={handleUpdate} loading={updateMut.isPending}>Update Project</Button>
           </div>
         </div>
       </Modal>

      {/* Delete Confirmation */}
      <Modal open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Delete Project" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-bark-600">
            Are you sure you want to delete this project? This will also delete all associated milestones and impact metrics. This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            <Button
              onClick={() => deleteMut.mutate()}
              loading={deleteMut.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

