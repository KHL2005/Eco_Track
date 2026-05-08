import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Check, Ban, Play, Lock } from 'lucide-react';
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

  // Forward-only audit lifecycle. Mirrors the backend's transition rules so the UI never
  // offers a button that would 400 on submit.
  const FORWARD_FLOW = ['PLANNED', 'IN_PROGRESS', 'COMPLETED'];
  const isTerminal = (s) => s === 'COMPLETED' || s === 'CANCELLED';
  const nextForwardStatus = (s) => {
    const i = FORWARD_FLOW.indexOf(s);
    return i >= 0 && i < FORWARD_FLOW.length - 1 ? FORWARD_FLOW[i + 1] : null;
  };
  const STATUS_LABEL = { PLANNED: 'Planned', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' };
  const NEXT_LABEL   = { IN_PROGRESS: 'Start Progress', COMPLETED: 'Mark Completed' };
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
      label: 'Actions', render: (r) => {
        if (!canManageCompliance) return null;
        const locked = isTerminal(r.status);
        return (
          <Button
            size="sm"
            variant={locked ? 'ghost' : 'outline'}
            onClick={() => openUpdate(r)}
            title={locked ? 'Audit is locked — view only' : 'Update audit'}
          >
            {locked ? <><Lock size={12} /> View</> : 'Update'}
          </Button>
        );
      }
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        emoji="✅"
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
        {updateModal && (() => {
          // Server state — drives lockability and which transitions are valid for save.
          const serverStatus = updateModal.status;
          const locked = isTerminal(serverStatus);
          const nextStatus = nextForwardStatus(serverStatus);

          // Local preview state — drives the live progress bar visualization.
          const preview = updateForm.status;
          const cancelled = preview === 'CANCELLED';
          const completed = preview === 'COMPLETED';
          const stepIndex = FORWARD_FLOW.indexOf(preview);
          const progressPct = cancelled
            ? 100
            : stepIndex < 0 ? 0 : (stepIndex / (FORWARD_FLOW.length - 1)) * 100;

          return (
            <div className="space-y-5">
              {/* === Progress Bar === */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-bark-700">Lifecycle</span>
                  {cancelled ? (
                    <span className="text-xs font-semibold text-red-600 inline-flex items-center gap-1">
                      <Ban size={12} /> Cancelled
                    </span>
                  ) : completed ? (
                    <span className="text-xs font-semibold text-forest-700 inline-flex items-center gap-1">
                      <Check size={12} /> Completed
                    </span>
                  ) : (
                    <span className="text-xs text-bark-500">{STATUS_LABEL[preview]}</span>
                  )}
                </div>

                {/* The track */}
                <div className="relative h-2 bg-bark-400/15 rounded-full overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out
                      ${cancelled ? 'bg-red-500' : completed ? 'bg-forest-600' : 'bg-forest-500'}
                      ${!cancelled && !completed ? 'animate-pulse' : ''}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Step labels with circular markers */}
                <div className="grid grid-cols-3 mt-3 text-center">
                  {FORWARD_FLOW.map((s, i) => {
                    const reached = !cancelled && stepIndex >= i;
                    const isCurrent = !cancelled && stepIndex === i;
                    return (
                      <div key={s} className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500
                          ${cancelled ? 'border-red-300 bg-red-50 text-red-400'
                            : reached ? 'border-forest-600 bg-forest-600 text-white scale-105'
                            : 'border-bark-400/30 bg-white text-bark-400'}
                          ${isCurrent ? 'ring-4 ring-forest-600/20' : ''}`}>
                          {reached ? <Check size={14} /> : i + 1}
                        </div>
                        <span className={`text-[11px] font-medium
                          ${cancelled ? 'text-red-400'
                            : reached ? 'text-forest-700' : 'text-bark-500'}`}>
                          {STATUS_LABEL[s]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* === Lifecycle Action Buttons === */}
              {locked ? (
                <div className={`rounded-xl p-3 flex items-center gap-2 text-xs
                  ${cancelled ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-forest-600/5 text-forest-700 border border-forest-600/20'}`}>
                  <Lock size={14} />
                  {cancelled
                    ? 'This audit was cancelled and cannot be modified further.'
                    : 'This audit is completed and the lifecycle is locked.'}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {nextStatus && (
                    <Button
                      onClick={() => setUpdateForm(f => ({ ...f, status: nextStatus }))}
                      disabled={updateForm.status === nextStatus}
                    >
                      {nextStatus === 'IN_PROGRESS' ? <Play size={14} /> : <Check size={14} />}
                      {NEXT_LABEL[nextStatus]}
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    onClick={() => setUpdateForm(f => ({ ...f, status: 'CANCELLED' }))}
                    disabled={updateForm.status === 'CANCELLED'}
                  >
                    <Ban size={14} /> Cancel Audit
                  </Button>
                  {updateForm.status !== updateModal.status && (
                    <button
                      type="button"
                      onClick={() => setUpdateForm(f => ({ ...f, status: updateModal.status }))}
                      className="text-xs text-bark-500 hover:text-bark-700 underline self-center"
                    >
                      Reset selection
                    </button>
                  )}
                </div>
              )}

              {/* === Findings === */}
              <div>
                <label className="block text-sm font-medium text-bark-600 mb-1">
                  Findings {locked && <span className="text-xs text-bark-400 font-normal">(read-only)</span>}
                </label>
                <textarea
                  rows={4}
                  readOnly={locked}
                  className={`w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30
                    ${locked ? 'bg-bark-50 cursor-not-allowed text-bark-600' : ''}`}
                  value={updateForm.findings}
                  onChange={setU('findings')}
                  placeholder="Audit findings…"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setUpdateModal(null)}>
                  {locked ? 'Close' : 'Cancel'}
                </Button>
                {!locked && (
                  <Button
                    onClick={() => updateMut.mutate({ id: updateModal?.auditId, ...updateForm })}
                    loading={updateMut.isPending}
                    disabled={
                      updateForm.status === updateModal.status &&
                      (updateForm.findings || '') === (updateModal.findings || '')
                    }
                  >
                    Save Changes
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>
    </DashboardLayout>
  );
}
