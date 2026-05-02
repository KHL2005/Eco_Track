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
import { formatDateTime, labelify } from '../utils/formatters';
import { COMPLIANCE_TYPES, COMPLIANCE_RESULTS } from '../utils/constants';
import { toast } from 'sonner';

export default function CompliancePage() {
  const { canManageCompliance } = useRole();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ entityId: '', entityName: '', type: 'INDUSTRY', result: 'PENDING', notes: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['compliance'],
    queryFn: () => complianceApi.getComplianceRecords().then(r => r.data).catch(() => []),
  });

  const createMut = useMutation({
    mutationFn: (d) => complianceApi.createCompliance(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance'] }); toast.success('Record created'); setModal(false); },
    onError: () => toast.error('Failed to create record'),
  });

  const columns = [
    { key: 'id', label: '#', render: r => <span className="text-xs text-bark-400">#{r.id}</span> },
    { key: 'entityName', label: 'Entity', sortable: true },
    { key: 'type', label: 'Type', render: r => <span className="text-xs">{r.type}</span> },
    { key: 'result', label: 'Result', render: r => <StatusBadge status={r.result} /> },
    { key: 'notes', label: 'Notes', render: r => <span className="text-xs text-bark-400 truncate max-w-[200px] block">{r.notes || '—'}</span> },
    { key: 'recordedAt', label: 'Date', render: r => <span className="text-xs text-bark-400">{formatDateTime(r.recordedAt)}</span> },
  ];

  return (
    <DashboardLayout>
      <PageHeader title="Compliance Records" description="Regulatory compliance tracking"
        action={canManageCompliance && <Button onClick={() => setModal(true)}><Plus size={16} /> Add Record</Button>}
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        <DataTable columns={columns} data={records} loading={isLoading} />
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Create Compliance Record">
        <div className="space-y-4">
          {[['entityId', 'Entity ID', 'number'], ['entityName', 'Entity Name', 'text']].map(([k, label, type]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-bark-600 mb-1">{label}</label>
              <input type={type} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form[k]} onChange={set(k)} />
            </div>
          ))}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Type</label>
              <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form.type} onChange={set('type')}>
                {COMPLIANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Result</label>
              <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form.result} onChange={set('result')}>
                {COMPLIANCE_RESULTS.map(r => <option key={r} value={r}>{labelify(r)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Notes</label>
            <textarea rows={3} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form.notes} onChange={set('notes')} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
            <Button onClick={() => createMut.mutate({ ...form, entityId: parseInt(form.entityId) })} loading={createMut.isPending}>Create</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

