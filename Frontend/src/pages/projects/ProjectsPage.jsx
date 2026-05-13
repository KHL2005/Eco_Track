import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import { Plus, Calendar, DollarSign, Edit, Trash2, BarChart3 } from 'lucide-react';
import * as projectsApi from '../../api/projectsApi';
import { useRole } from '../../hooks/useRole';
import { formatDate, labelify, formatCurrency } from '../../utils/formatters';
import { PROJECT_STATUSES } from '../../utils/constants';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const statusColor = { PLANNED: 'border-blue-200 bg-blue-50', IN_PROGRESS: 'border-yellow-200 bg-yellow-50', COMPLETED: 'border-green-200 bg-green-50', ON_HOLD: 'border-gray-200 bg-gray-50', CANCELLED: 'border-red-200 bg-red-50' };

export default function ProjectsPage() {
  const { canManageProjects } = useRole();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
   const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', budget: '', status: 'PLANNED' });
   const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(r => r.data).catch(() => []),
  });

  const createMut = useMutation({
    mutationFn: (d) => projectsApi.createProject(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project created'); setModal(false); resetForm(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create project'),
  });

  const updateMut = useMutation({
    mutationFn: (d) => projectsApi.updateProject(editId, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project updated'); setModal(false); resetForm(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update project'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => projectsApi.deleteProject(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project deleted'); setDeleteId(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete project'),
  });

   const resetForm = () => {
     setForm({ title: '', description: '', startDate: '', endDate: '', budget: '', status: 'PLANNED' });
     setEditId(null);
   };

  const onOpenCreate = () => {
    resetForm();
    setModal(true);
  };

   const onOpenEdit = (project) => {
     setEditId(project.projectId);
     setForm({
       title: project.title || '',
       description: project.description || '',
       startDate: project.startDate || '',
       endDate: project.endDate || '',
       budget: project.budget || '',
       status: project.status || 'PLANNED',
     });
     setModal(true);
   };

  const handleSubmit = () => {
    if (!form.title) {
      toast.error('Title is required');
      return;
    }
    if (!form.startDate) {
      toast.error('Start date is required');
      return;
    }
    const data = { ...form, budget: form.budget ? parseFloat(form.budget) : null };
    if (editId) {
      updateMut.mutate(data);
    } else {
      createMut.mutate(data);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        emoji="🌳"
        title="Sustainability Projects"
        description="Track green initiatives and their impact"
        action={
          <div className="flex gap-2">
            {canManageProjects && (
              <Button onClick={() => onOpenCreate()}>
                <Plus size={16} /> New Project
              </Button>
            )}
            <Link to="/projects/dashboard">
              <Button variant="outline">
                <BarChart3 size={16} /> Dashboard
              </Button>
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <LoadingSkeleton rows={3} cols={3} />
      ) : projects.length === 0 ? (
        <EmptyState emoji="🌳" title="No projects yet" description="Create the first sustainability project — reforestation, water conservation, waste reduction, and more." hint="Projects with measurable impact metrics attract 3× more agency funding." />
       ) : (
         <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
           {projects.map((p, i) => (
             <motion.div key={p.projectId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
               <Card className={`border-2 ${statusColor[p.status] || 'border-bark-400/10'} hover:shadow-md transition-shadow`}>
                 <div className="flex items-start justify-between mb-3">
                   <Link to={`/projects/${p.projectId}`} className="font-semibold text-bark-800 hover:text-forest-600 text-sm leading-snug">{p.title}</Link>
                   <StatusBadge status={p.status} />
                 </div>
                 <p className="text-xs text-bark-400 line-clamp-2 mb-4">{p.description}</p>
                 <div className="space-y-1.5 text-xs text-bark-400">
                   {p.startDate && <div className="flex items-center gap-1.5"><Calendar size={12} />{formatDate(p.startDate)} → {p.endDate ? formatDate(p.endDate) : 'Ongoing'}</div>}
                   {p.budget && <div className="flex items-center gap-1.5"><DollarSign size={12} />Budget: {formatCurrency(p.budget)}</div>}
                 </div>
                 <div className="mt-4 flex gap-2">
                   <Link to={`/projects/${p.projectId}`} className="flex-1">
                     <Button size="sm" variant="outline" className="w-full">View Details</Button>
                   </Link>
                   {canManageProjects && (
                     <>
                       <button
                         onClick={() => onOpenEdit(p)}
                         className="p-2 hover:bg-earth-100 rounded-lg transition-colors"
                         title="Edit project"
                       >
                         <Edit size={16} className="text-forest-600" />
                       </button>
                       <button
                         onClick={() => setDeleteId(p.projectId)}
                         className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                         title="Delete project"
                       >
                         <Trash2 size={16} className="text-red-600" />
                       </button>
                     </>
                   )}
                 </div>
               </Card>
             </motion.div>
           ))}
         </div>
       )}

       {/* Create/Edit Modal */}
       <Modal open={modal} onClose={() => { setModal(false); resetForm(); }} title={editId ? 'Edit Project' : 'Create Project'} size="lg">
         <div className="space-y-4">
           {[['title', 'Project Title'], ['description', 'Description']].map(([k, label]) => (
             <div key={k}>
               <label className="block text-sm font-medium text-bark-600 mb-1">{label}{k === 'title' && <span className="text-red-500 ml-1">*</span>}</label>
               {k === 'description' ? (
                 <textarea rows={3} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form[k]} onChange={set(k)} />
               ) : (
                 <input className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form[k]} onChange={set(k)} />
               )}
             </div>
           ))}
           <div className="grid sm:grid-cols-2 gap-4">
             {[['startDate', 'Start Date', 'date'], ['endDate', 'End Date', 'date'], ['budget', 'Budget (USD)', 'number']].map(([k, label, type]) => (
               <div key={k}>
                 <label className="block text-sm font-medium text-bark-600 mb-1">{label}{k === 'startDate' && <span className="text-red-500 ml-1">*</span>}</label>
                 <input type={type} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form[k]} onChange={set(k)} />
               </div>
             ))}
             <div>
               <label className="block text-sm font-medium text-bark-600 mb-1">Status</label>
               <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                 value={form.status} onChange={set('status')}>
                 {PROJECT_STATUSES.map(s => <option key={s} value={s}>{labelify(s)}</option>)}
               </select>
             </div>
           </div>
           <div className="flex gap-3 justify-end">
             <Button variant="secondary" onClick={() => { setModal(false); resetForm(); }}>Cancel</Button>
             <Button onClick={handleSubmit} loading={createMut.isPending || updateMut.isPending}>{editId ? 'Update' : 'Create'}</Button>
           </div>
         </div>
       </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Project" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-bark-600">
            Are you sure you want to delete this project? All associated milestones and impact metrics will also be deleted. This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button onClick={() => deleteMut.mutate(deleteId)} loading={deleteMut.isPending} className="bg-red-600 hover:bg-red-700">
              Delete Project
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}


