import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import Card from '../components/Card';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Plus, Calendar, DollarSign, User } from 'lucide-react';
import * as projectsApi from '../api/projectsApi';
import { useRole } from '../hooks/useRole';
import { formatDate, labelify, formatCurrency } from '../utils/formatters';
import { PROJECT_STATUSES } from '../utils/constants';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const statusColor = { PLANNED: 'border-blue-200 bg-blue-50', IN_PROGRESS: 'border-yellow-200 bg-yellow-50', COMPLETED: 'border-green-200 bg-green-50', ON_HOLD: 'border-gray-200 bg-gray-50', CANCELLED: 'border-red-200 bg-red-50' };

export default function ProjectsPage() {
  const { canManageProjects } = useRole();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', managerName: '', startDate: '', endDate: '', budget: '', status: 'PLANNED' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(r => r.data).catch(() => []),
  });

  const createMut = useMutation({
    mutationFn: (d) => projectsApi.createProject(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); toast.success('Project created'); setModal(false); },
    onError: () => toast.error('Failed to create project'),
  });

  return (
    <DashboardLayout>
      <PageHeader title="Sustainability Projects" description="Track green initiatives and their impact"
        action={canManageProjects && <Button onClick={() => setModal(true)}><Plus size={16} /> New Project</Button>}
      />

      {isLoading ? (
        <LoadingSkeleton rows={3} cols={3} />
      ) : projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Create the first sustainability project." />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`border-2 ${statusColor[p.status] || 'border-bark-400/10'} hover:shadow-md transition-shadow`}>
                <div className="flex items-start justify-between mb-3">
                  <Link to={`/projects/${p.id}`} className="font-semibold text-bark-800 hover:text-forest-600 text-sm leading-snug">{p.title}</Link>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-xs text-bark-400 line-clamp-2 mb-4">{p.description}</p>
                <div className="space-y-1.5 text-xs text-bark-400">
                  {p.managerName && <div className="flex items-center gap-1.5"><User size={12} />{p.managerName}</div>}
                  {p.startDate && <div className="flex items-center gap-1.5"><Calendar size={12} />{formatDate(p.startDate)} → {p.endDate ? formatDate(p.endDate) : 'Ongoing'}</div>}
                  {p.budget && <div className="flex items-center gap-1.5"><DollarSign size={12} />Budget: {formatCurrency(p.budget)}</div>}
                </div>
                <div className="mt-4">
                  <Link to={`/projects/${p.id}`}>
                    <Button size="sm" variant="outline" className="w-full">View Details</Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Create Project" size="lg">
        <div className="space-y-4">
          {[['title', 'Project Title'], ['description', 'Description'], ['managerName', 'Manager Name']].map(([k, label]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-bark-600 mb-1">{label}</label>
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
                <label className="block text-sm font-medium text-bark-600 mb-1">{label}</label>
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
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate({ ...form, budget: form.budget ? parseFloat(form.budget) : null })} loading={createMut.isPending}>Create</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}


