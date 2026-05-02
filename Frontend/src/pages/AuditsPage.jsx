import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';
import * as complianceApi from '../api/complianceApi';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, labelify } from '../utils/formatters';
import { AUDIT_STATUSES } from '../utils/constants';
import { toast } from 'sonner';

export default function AuditsPage() {
  const { canManageCompliance } = useRole();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(null);
  const [form, setForm] = useState({ entityId: '', entityName: '', scheduledDate: '', findings: '' });
  const [updateForm, setUpdateForm] = useState({ status: 'SCHEDULED', findings: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setU = (k) => (e) => setUpdateForm(f => ({ ...f, [k]: e.target.value }));

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: () => complianceApi.getAudits().then(r => r.data).catch(() => []),
  });

  const createMut = useMutation({
    mutationFn: (d) => complianceApi.createAudit(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['audits'] }); toast.success('Audit created'); setCreateModal(false); },
    onError: () => toast.error('Failed to create audit'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status, findings }) => complianceApi.updateAuditStatus(id, status, findings),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['audits'] }); toast.success('Audit updated'); setUpdateModal(null); },
    onError: () => toast.error('Failed to update audit'),
  });

  const columns = [
    { key: 'id', label: '#', render: r => <span className="text-xs text-bark-400">#{r.id}</span> },
    { key: 'entityName', label: 'Entity', sortable: true },
    { key: 'officerName', label: 'Officer' },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'scheduledDate', label: 'Scheduled', render: r => <span className="text-xs text-bark-400">{formatDateTime(r.scheduledDate)}</span> },
    { key: 'findings', label: 'Findings', render: r => <span className="text-xs text-bark-400 truncate max-w-[150px] block">{r.findings || '—'}</span> },
    {
      label: 'Actions', render: (r) => canManageCompliance ? (
        <Button size="sm" variant="outline" onClick={() => { setUpdateModal(r); setUpdateForm({ status: r.status, findings: r.findings || '' }); }}>Update</Button>
      ) : null
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Audits" description="Environmental compliance audits"
        action={canManageCompliance && <Button onClick={() => setCreateModal(true)}><Plus size={16} /> Create Audit</Button>}
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        <DataTable columns={columns} data={audits} loading={isLoading} />
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Audit">
        <div className="space-y-4">
          {[['entityId', 'Entity ID', 'number'], ['entityName', 'Entity Name', 'text'], ['scheduledDate', 'Scheduled Date', 'datetime-local']].map(([k, label, type]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-bark-600 mb-1">{label}</label>
              <input type={type} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form[k]} onChange={set(k)} />
            </div>
          ))}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate({ ...form, entityId: parseInt(form.entityId), officerId: user?.userId, officerName: user?.name })} loading={createMut.isPending}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!updateModal} onClose={() => setUpdateModal(null)} title="Update Audit" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Status</label>
            <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={updateForm.status} onChange={setU('status')}>
              {AUDIT_STATUSES.map(s => <option key={s} value={s}>{labelify(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Findings</label>
            <textarea rows={3} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={updateForm.findings} onChange={setU('findings')} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setUpdateModal(null)}>Cancel</Button>
            <Button onClick={() => updateMut.mutate({ id: updateModal?.id, ...updateForm })} loading={updateMut.isPending}>Update</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

