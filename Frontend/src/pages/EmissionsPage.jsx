import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { Plus } from 'lucide-react';
import * as emissionsApi from '../api/emissionsApi';
import { useRole } from '../hooks/useRole';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, labelify } from '../utils/formatters';
import { EMISSION_TYPES, EMISSION_STATUSES } from '../utils/constants';
import { toast } from 'sonner';

export default function EmissionsPage() {
  const { isIndustry, isAdmin, isOfficer } = useRole();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ industryId: '', industryName: '', emissionType: 'CO2', value: '', unit: 'tonnes', notes: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: emissions = [], isLoading } = useQuery({
    queryKey: ['emissions'],
    queryFn: () => emissionsApi.getEmissions().then(r => r.data).catch(() => []),
  });

  const createMut = useMutation({
    mutationFn: (d) => emissionsApi.logEmission(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emissions'] }); toast.success('Emission logged'); setModal(false); },
    onError: () => toast.error('Failed to log emission'),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => emissionsApi.updateEmissionStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emissions'] }); toast.success('Status updated'); },
    onError: () => toast.error('Failed to update status'),
  });

  const columns = [
    { key: 'id', label: '#', render: r => <span className="text-xs text-bark-400">#{r.id}</span> },
    { key: 'industryName', label: 'Industry', sortable: true },
    { key: 'emissionType', label: 'Type', render: r => <span className="text-xs font-medium">{r.emissionType}</span> },
    { key: 'value', label: 'Value', sortable: true, render: r => <span>{r.value} {r.unit}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'recordedAt', label: 'Date', render: r => <span className="text-xs text-bark-400">{formatDateTime(r.recordedAt)}</span> },
    {
      label: 'Actions', render: (r) => (
        (isAdmin || isOfficer) && r.status === 'SUBMITTED' ? (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus.mutate({ id: r.id, status: 'APPROVED' })}>Approve</Button>
            <Button size="sm" variant="danger" className="text-xs" onClick={() => updateStatus.mutate({ id: r.id, status: 'REJECTED' })}>Reject</Button>
          </div>
        ) : null
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Emissions" description="Industry emission logs and approvals"
        action={(isIndustry || isAdmin) && <Button onClick={() => setModal(true)}><Plus size={16} /> Log Emission</Button>}
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        <DataTable columns={columns} data={emissions} loading={isLoading} searchPlaceholder="Search emissions…" />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Log Emission">
        <div className="space-y-4">
          {[['industryId', 'Industry ID', 'number'], ['industryName', 'Industry Name', 'text'], ['value', 'Value', 'number'], ['unit', 'Unit (e.g. tonnes)', 'text']].map(([k, label, type]) => (
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
            <label className="block text-sm font-medium text-bark-600 mb-1">Notes</label>
            <textarea rows={2} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={form.notes} onChange={set('notes')} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate({ ...form, industryId: parseInt(form.industryId), value: parseFloat(form.value) })} loading={createMut.isPending}>Submit</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

