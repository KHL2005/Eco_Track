import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { X, Edit, Trash2, Plus } from 'lucide-react';
import * as projectsApi from '../../api/projectsApi';
import { toast } from 'sonner';
import { formatDate, labelify } from '../../utils/formatters';
import { MILESTONE_STATUSES } from '../../utils/constants';

const statusColor = {
  PENDING: 'border-gray-300 bg-gray-50',
  IN_PROGRESS: 'border-yellow-300 bg-yellow-50',
  COMPLETED: 'border-green-300 bg-green-50',
  DELAYED: 'border-red-300 bg-red-50',
};

const statusBgColor = {
  PENDING: 'bg-gray-100',
  IN_PROGRESS: 'bg-yellow-100',
  COMPLETED: 'bg-green-100',
  DELAYED: 'bg-red-100',
};

export default function MilestoneManagement({ projectId, milestones, onRefresh, canEdit }) {
   const qc = useQueryClient();
   const [modal, setModal] = useState(false);
   const [editId, setEditId] = useState(null);
   const [statusModal, setStatusModal] = useState(null);
   const [form, setForm] = useState({ title: '', description: '', date: '', status: 'PENDING' });

   const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

   const resetForm = () => {
      setForm({ title: '', description: '', date: '', status: 'PENDING' });
      setEditId(null);
   };

   const onOpenCreate = () => {
      resetForm();
      setModal(true);
   };

   const onOpenEdit = (milestone) => {
      setForm({
        title: milestone.title || '',
        description: milestone.description || '',
        date: milestone.date || '',
        status: milestone.status || 'PENDING',
      });
      setEditId(milestone.milestoneId);
      setModal(true);
   };

  const createMut = useMutation({
    mutationFn: (d) => projectsApi.addMilestone(projectId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', projectId] });
      toast.success('Milestone created');
      setModal(false);
      resetForm();
      onRefresh?.();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create milestone'),
  });

  const updateMut = useMutation({
    mutationFn: (d) => projectsApi.updateMilestone(editId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', projectId] });
      toast.success('Milestone updated');
      setModal(false);
      resetForm();
      onRefresh?.();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update milestone'),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ milestoneId, status }) =>
      projectsApi.updateMilestone(milestoneId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', projectId] });
      toast.success('Status updated');
      setStatusModal(null);
      onRefresh?.();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => projectsApi.deleteMilestone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['milestones', projectId] });
      toast.success('Milestone deleted');
      onRefresh?.();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete milestone'),
  });

   const handleSubmit = () => {
     if (!form.title || !form.date) {
       toast.error('Title and date are required');
       return;
     }
     if (editId) {
       updateMut.mutate(form);
     } else {
       createMut.mutate(form);
     }
   };

   return (
     <>
       <div className="space-y-3">
         {milestones.length === 0 ? (
           <p className="text-sm text-bark-400">No milestones yet.</p>
         ) : (
           milestones.map((m) => (
             <div
               key={m.milestoneId}
               className={`flex items-center justify-between p-4 rounded-xl border-l-4 ${
                 statusColor[m.status] || 'border-bark-400/20 bg-earth-100'
               }`}
             >
               <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1">
                   <span className="font-medium text-bark-800">{m.title}</span>
                   <span
                     className={`text-xs px-2 py-1 rounded-full font-medium ${
                       statusBgColor[m.status] || 'bg-gray-100'
                     }`}
                   >
                     {labelify(m.status)}
                   </span>
                 </div>
                 {m.description && (
                   <div className="text-xs text-bark-600 mb-1">{m.description}</div>
                 )}
                 <div className="text-xs text-bark-400">
                   Due: <strong>{formatDate(m.date)}</strong>
                 </div>
               </div>
               {canEdit && (
                 <div className="flex items-center gap-2 ml-4">
                   <button
                     onClick={() => setStatusModal(m.milestoneId)}
                     className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors"
                     title="Change status"
                   >
                     <svg className="w-4 h-4 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
                     </svg>
                   </button>
                   <button
                     onClick={() => onOpenEdit(m)}
                     className="p-1.5 hover:bg-earth-100 rounded-lg transition-colors"
                     title="Edit milestone"
                   >
                     <Edit size={16} className="text-forest-600" />
                   </button>
                   <button
                     onClick={() => {
                       if (window.confirm('Delete this milestone?')) {
                         deleteMut.mutate(m.milestoneId);
                       }
                     }}
                     className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                     title="Delete milestone"
                   >
                     <Trash2 size={16} className="text-red-600" />
                   </button>
                 </div>
               )}
             </div>
           ))
         )}
       </div>

      {canEdit && (
        <Button onClick={onOpenCreate} variant="outline" size="sm" className="mt-4">
          <Plus size={16} /> Add Milestone
        </Button>
      )}

       {/* Create/Edit Modal */}
       <Modal open={modal} onClose={() => { setModal(false); resetForm(); }} title={editId ? 'Edit Milestone' : 'Add Milestone'} size="md">
         <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-bark-600 mb-1">Title *</label>
             <input
               className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
               value={form.title}
               onChange={set('title')}
               placeholder="Milestone title"
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-bark-600 mb-1">Description</label>
             <textarea
               className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
               value={form.description}
               onChange={set('description')}
               placeholder="Milestone description"
               rows={3}
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-bark-600 mb-1">Date *</label>
             <input
               type="date"
               className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
               value={form.date}
               onChange={set('date')}
             />
           </div>
           <div>
             <label className="block text-sm font-medium text-bark-600 mb-1">Status</label>
             <select
               className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
               value={form.status}
               onChange={set('status')}
             >
               {MILESTONE_STATUSES.map(s => <option key={s} value={s}>{labelify(s)}</option>)}
             </select>
           </div>
           <div className="flex gap-3 justify-end">
             <Button variant="secondary" onClick={() => { setModal(false); resetForm(); }}>Cancel</Button>
             <Button onClick={handleSubmit} loading={createMut.isPending || updateMut.isPending}>
               {editId ? 'Update' : 'Create'}
             </Button>
           </div>
         </div>
       </Modal>

      {/* Status Change Modal */}
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title="Change Milestone Status" size="sm">
        <div className="space-y-3">
          {MILESTONE_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => {
                updateStatusMut.mutate({ milestoneId: statusModal, status });
              }}
              className="w-full p-3 text-left border border-bark-400/20 rounded-xl hover:bg-earth-100 transition-colors"
            >
              {labelify(status)}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}

