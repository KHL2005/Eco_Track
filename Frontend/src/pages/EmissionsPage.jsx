import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus, Trash2, CheckCircle, X, Factory } from 'lucide-react';
import * as emissionsApi from '../api/emissionsApi';
import { useRole } from '../hooks/useRole';
import { formatDateTime } from '../utils/formatters';
import { EMISSION_TYPES, EMISSION_STATUSES } from '../utils/constants';
import { toast } from 'sonner';

export default function EmissionsPage() {
  const { isIndustry, isAdmin, isComplianceOfficer } = useRole();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ registrationNumber: '', industryName: '', emissionType: 'CO2', value: '', notes: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const closeModal = () => { setModal(false); setForm({ registrationNumber: '', industryName: '', emissionType: 'CO2', value: '', notes: '' }); };

  const { data: emissions = [], isLoading } = useQuery({
    queryKey: ['emissions'],
    queryFn: () => emissionsApi.getEmissions().then(r => r.data).catch(() => []),
  });

  const filtered = statusFilter ? emissions.filter(e => e.status === statusFilter) : emissions;

  const createMut = useMutation({
    mutationFn: (d) => emissionsApi.logEmission(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emissions'] }); toast.success('Emission logged'); closeModal(); },
    onError: () => toast.error('Failed to log emission'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => emissionsApi.updateEmissionStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emissions'] }); toast.success('Status updated'); },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => emissionsApi.deleteEmission(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emissions'] }); toast.success('Emission deleted'); },
    onError: () => toast.error('Failed to delete emission'),
  });

  const columns = [
    { key: 'logId', label: 'ID', render: r => <span className="text-sm text-bark-700">{r.logId}</span> },
    { key: 'industryName', label: 'Industry', sortable: true, render: r => <span className="text-sm text-bark-700">{r.industryName}</span> },
    { key: 'registrationNumber', label: 'Reg. Number', render: r => <code className="text-xs font-mono bg-bark-100 text-bark-700 px-1.5 py-0.5 rounded">{r.registrationNumber}</code> },
    { key: 'type', label: 'Type', render: r => <span className="text-sm text-bark-700">{r.type}</span> },
    { key: 'quantity', label: 'Value (mg/Nm³)', sortable: true, render: r => <span><span className="text-sm text-bark-700">{r.quantity}</span> <span className="text-xs text-bark-400">mg/Nm³</span></span> },
    { key: 'description', label: 'Description', render: r => <span title={r.description || ''} className="text-sm text-bark-600 truncate max-w-[120px] block">{r.description || '—'}</span> },
    { key: 'status', label: 'Status', render: r => (
      <div className="flex flex-col gap-0.5">
        <StatusBadge status={r.status} />
        {r.updatedAt && <span className="text-xs text-bark-400">{formatDateTime(r.updatedAt)}</span>}
      </div>
    )},
    { key: 'date', label: 'Date', render: r => <span className="text-sm text-bark-700">{formatDateTime(r.date)}</span> },
    {
      label: 'Actions', render: (r) => (
        <div className="flex gap-1">
          {(isAdmin || isComplianceOfficer) && r.status === 'SUBMITTED' && (
            <>
              <Button size="sm" variant="outline" className="text-xs flex items-center gap-1" onClick={() => updateStatus.mutate({ id: r.logId, status: 'APPROVED' })}><CheckCircle size={12} />Approve</Button>
              <Button size="sm" variant="danger" className="text-xs flex items-center gap-1" onClick={() => updateStatus.mutate({ id: r.logId, status: 'REJECTED' })}><X size={12} />Reject</Button>
            </>
          )}
          {isIndustry && r.status === 'SUBMITTED' && (
            <button
              onClick={() => deleteMut.mutate(r.logId)}
              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete emission"
              disabled={deleteMut.isPending}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader emoji="🏭" title="Emissions" description="Industry emission logs and approvals"
        action={
          <div className="flex gap-2 items-center">
            <select
              className="border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              {EMISSION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(isIndustry || isAdmin) && (
              <Button onClick={() => setModal(true)}><Plus size={16} /> Log Emission</Button>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        {!isLoading && filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-bark-400 gap-3">
            <Factory size={40} className="opacity-30" />
            <p className="text-sm">No emissions logged yet</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} loading={isLoading} searchPlaceholder="Search emissions…" />
        )}
      </div>

      <Modal open={modal} onClose={closeModal} title="Log Emission" size="lg">
        <div className="space-y-4">
          {[['registrationNumber', 'Registration Number (e.g. TNPCB-IND-1023)', 'text'], ['industryName', 'Industry Name', 'text'], ['value', 'Value (mg/Nm³)', 'number']].map(([k, label, type]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-bark-600 mb-1">{label}</label>
              <input type={type} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={form[k]} onChange={set(k)} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Emission Type</label>
            <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={form.emissionType} onChange={set('emissionType')}>
              {EMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Description</label>
            <textarea rows={2} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={form.notes} onChange={set('notes')} required />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={() => createMut.mutate({ registrationNumber: form.registrationNumber, industryName: form.industryName, type: form.emissionType, quantity: parseFloat(form.value), description: form.notes })} loading={createMut.isPending} disabled={!form.registrationNumber.trim() || !form.industryName.trim() || !form.value || !form.notes.trim()}>Submit</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
