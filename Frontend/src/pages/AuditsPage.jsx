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
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ officerId: '', scope: '', findings: '' });
  const [updateForm, setUpdateForm] = useState({ status: 'PLANNED', findings: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setU = (k) => (e) => setUpdateForm(f => ({ ...f, [k]: e.target.value }));

  const { data: audits = [], isLoading } = useQuery({
    queryKey: ['audits'],
    queryFn: () => complianceApi.getAudits().then(r => r.data).catch(() => []),
  });

  const filtered = statusFilter ? audits.filter(a => a.status === statusFilter) : audits;

  const createMut = useMutation({
    mutationFn: (d) => complianceApi.createAudit(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Audit created');
      setCreateModal(false);
      setForm({ officerId: '', scope: '', findings: '' });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to create audit';
      toast.error(msg);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status, findings }) => complianceApi.updateAuditStatus(id, status, findings || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Audit updated');
      setUpdateModal(null);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Failed to update audit';
      toast.error(msg);
    },
  });

  const openUpdate = (r) => {
    setUpdateModal(r);
    setUpdateForm({ status: r.status, findings: r.findings || '' });
  };

  const openCreate = () => {
    setForm({ officerId: user?.userId?.toString() || '', scope: '', findings: '' });
    setCreateModal(true);
  };

  const columns = [
    { key: 'auditId', label: 'ID', render: r => <span className="text-xs text-bark-400">{r.auditId}</span> },
    { key: 'officerId', label: 'Officer ID', render: r => <span className="text-xs font-medium">{r.officerId}</span> },
    { key: 'scope', label: 'Scope', sortable: true, render: r => <span className="text-xs max-w-[200px] truncate block">{r.scope}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'date', label: 'Date', render: r => <span className="text-xs text-bark-400">{formatDateTime(r.date)}</span> },
    { key: 'findings', label: 'Findings', render: r => <span className="text-xs text-bark-400 truncate max-w-[150px] block">{r.findings || '—'}</span> },
    {
      label: 'Actions', render: (r) => canManageCompliance ? (
        <Button size="sm" variant="outline" onClick={() => openUpdate(r)}>Update</Button>
      ) : null
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Audits"
        description="Environmental compliance audits"
        action={
          <div className="flex gap-2 items-center">
            <select
              className="border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              {AUDIT_STATUSES.map(s => <option key={s} value={s}>{labelify(s)}</option>)}
            </select>
            {canManageCompliance && (
              <Button onClick={openCreate}><Plus size={16} /> Create Audit</Button>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        <DataTable columns={columns} data={filtered} loading={isLoading} searchPlaceholder="Search audits…" />
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Audit">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Officer ID</label>
            <input
              type="number"
              min="1"
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={form.officerId}
              onChange={set('officerId')}
              placeholder="Your user ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Scope</label>
            <input
              type="text"
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={form.scope}
              onChange={set('scope')}
              placeholder="Describe the audit scope…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">
              Initial Findings <span className="text-bark-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={form.findings}
              onChange={set('findings')}
              placeholder="Initial findings or notes…"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button
              onClick={() => createMut.mutate({
                officerId: parseInt(form.officerId),
                scope: form.scope.trim(),
                findings: form.findings.trim() || null,
              })}
              loading={createMut.isPending}
              disabled={!form.officerId || isNaN(parseInt(form.officerId)) || !form.scope.trim()}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!updateModal} onClose={() => setUpdateModal(null)} title="Update Audit" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Status</label>
            <select
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={updateForm.status}
              onChange={setU('status')}
            >
              {AUDIT_STATUSES.map(s => <option key={s} value={s}>{labelify(s)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Findings</label>
            <textarea
              rows={4}
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={updateForm.findings}
              onChange={setU('findings')}
              placeholder="Audit findings…"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setUpdateModal(null)}>Cancel</Button>
            <Button
              onClick={() => updateMut.mutate({ id: updateModal?.auditId, ...updateForm })}
              loading={updateMut.isPending}
            >
              Update
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
