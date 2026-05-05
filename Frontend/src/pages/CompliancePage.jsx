import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Trash2, Pencil } from 'lucide-react';
import * as complianceApi from '../api/complianceApi';
import { useRole } from '../hooks/useRole';
import { formatDateTime, labelify } from '../utils/formatters';
import { COMPLIANCE_TYPES, COMPLIANCE_RESULTS } from '../utils/constants';
import { toast } from 'sonner';

export default function CompliancePage() {
  const { canManageCompliance, isAdmin } = useRole();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [form, setForm] = useState({ entityId: '', type: 'EMISSION', result: 'PENDING', notes: '' });
  const [updateForm, setUpdateForm] = useState({ result: 'PENDING', notes: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setU = (k) => (e) => setUpdateForm(f => ({ ...f, [k]: e.target.value }));

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['compliance'],
    queryFn: () => complianceApi.getComplianceRecords().then(r => r.data).catch(() => []),
  });

  const filtered = records.filter(r => {
    if (typeFilter && r.type !== typeFilter) return false;
    if (resultFilter && r.result !== resultFilter) return false;
    return true;
  });

  const createMut = useMutation({
    mutationFn: (d) => complianceApi.createCompliance(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance'] });
      toast.success('Compliance record created');
      setModal(false);
      setForm({ entityId: '', type: 'EMISSION', result: 'PENDING', notes: '' });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to create record';
      toast.error(msg);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, result, notes }) => complianceApi.updateCompliance(id, result, notes || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance'] });
      toast.success('Record updated');
      setUpdateModal(null);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Failed to update record';
      toast.error(msg);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => complianceApi.deleteCompliance(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance'] }); toast.success('Record deleted'); },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'Failed to delete record';
      toast.error(msg);
    },
  });

  const openUpdate = (r) => {
    setUpdateModal(r);
    setUpdateForm({ result: r.result, notes: r.notes || '' });
  };

  const columns = [
    { key: 'complianceId', label: 'ID', render: r => <span className="text-xs text-bark-400">{r.complianceId}</span> },
    { key: 'entityId', label: 'Entity ID', render: r => <span className="text-xs font-medium">{r.entityId}</span> },
    { key: 'type', label: 'Type', render: r => <span className="text-xs font-medium">{labelify(r.type)}</span> },
    { key: 'result', label: 'Result', render: r => <StatusBadge status={r.result} /> },
    { key: 'notes', label: 'Notes', render: r => <span className="text-xs text-bark-400 truncate max-w-[180px] block">{r.notes || '—'}</span> },
    { key: 'date', label: 'Date', render: r => <span className="text-xs text-bark-400">{formatDateTime(r.date)}</span> },
    {
      label: 'Actions', render: (r) => (
        <div className="flex gap-1">
          {canManageCompliance && (
            <button
              onClick={() => openUpdate(r)}
              className="p-1 text-forest-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Update result"
            >
              <Pencil size={13} />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => deleteMut.mutate(r.complianceId)}
              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete record"
              disabled={deleteMut.isPending}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Compliance Records"
        description="Regulatory compliance tracking"
        action={
          <div className="flex gap-2 items-center">
            <select
              className="border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {COMPLIANCE_TYPES.map(t => <option key={t} value={t}>{labelify(t)}</option>)}
            </select>
            <select
              className="border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={resultFilter}
              onChange={e => setResultFilter(e.target.value)}
            >
              <option value="">All Results</option>
              {COMPLIANCE_RESULTS.map(r => <option key={r} value={r}>{labelify(r)}</option>)}
            </select>
            {canManageCompliance && (
              <Button onClick={() => setModal(true)}><Plus size={16} /> Add Record</Button>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        <DataTable columns={columns} data={filtered} loading={isLoading} searchPlaceholder="Search records…" />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Create Compliance Record">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Entity ID</label>
            <input
              type="number"
              min="1"
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={form.entityId}
              onChange={set('entityId')}
              placeholder="Industry or entity ID"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Compliance Type</label>
              <select
                className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={form.type}
                onChange={set('type')}
              >
                {COMPLIANCE_TYPES.map(t => <option key={t} value={t}>{labelify(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Result</label>
              <select
                className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={form.result}
                onChange={set('result')}
              >
                {COMPLIANCE_RESULTS.map(r => <option key={r} value={r}>{labelify(r)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Notes</label>
            <textarea
              rows={3}
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={form.notes}
              onChange={set('notes')}
              placeholder="Optional notes…"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button
              onClick={() => createMut.mutate({
                entityId: parseInt(form.entityId),
                type: form.type,
                result: form.result,
                notes: form.notes.trim() || null,
              })}
              loading={createMut.isPending}
              disabled={!form.entityId || isNaN(parseInt(form.entityId))}
            >
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!updateModal} onClose={() => setUpdateModal(null)} title="Update Compliance Record" size="sm">
        <div className="space-y-4">
          <div className="text-xs text-bark-400 bg-bark-50 rounded-xl px-3 py-2">
            Entity <span className="font-medium text-bark-700">{updateModal?.entityId}</span>
            {' · '}Type <span className="font-medium text-bark-700">{updateModal?.type && labelify(updateModal.type)}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Result</label>
            <select
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={updateForm.result}
              onChange={setU('result')}
            >
              {COMPLIANCE_RESULTS.map(r => <option key={r} value={r}>{labelify(r)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Notes</label>
            <textarea
              rows={4}
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={updateForm.notes}
              onChange={setU('notes')}
              placeholder="Compliance notes…"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setUpdateModal(null)}>Cancel</Button>
            <Button
              onClick={() => updateMut.mutate({ id: updateModal?.complianceId, ...updateForm })}
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
