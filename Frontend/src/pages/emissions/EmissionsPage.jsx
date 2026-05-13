import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { Plus, Trash2, CheckCircle, X, Factory } from 'lucide-react';
import * as emissionsApi from '../../api/emissionsApi';
import { useRole } from '../../hooks/useRole';
import { formatDateTime } from '../../utils/formatters';
import { EMISSION_TYPES, EMISSION_STATUSES } from '../../utils/constants';
import { toast } from 'sonner';

export default function EmissionsPage() {
  const { isIndustry, isAdmin, isComplianceOfficer } = useRole();

  // Emissions list
  const [emissions, setEmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status filter dropdown
  const [statusFilter, setStatusFilter] = useState('');

  // Modal open/close
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields — one state variable per field
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [industryName, setIndustryName] = useState('');
  const [emissionType, setEmissionType] = useState('CO2');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch emissions when the page first loads
  useEffect(() => {
    fetchEmissions();
  }, []);

  async function fetchEmissions() {
    setIsLoading(true);
    try {
      const response = await emissionsApi.getEmissions();
      setEmissions(response.data);
    } catch (error) {
      setEmissions([]);
    } finally {
      setIsLoading(false);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setRegistrationNumber('');
    setIndustryName('');
    setEmissionType('CO2');
    setValue('');
    setNotes('');
  }

  // Filter the list by selected status
  const filtered = statusFilter ? emissions.filter(e => e.status === statusFilter) : emissions;

  async function handleCreate() {
    setIsSubmitting(true);
    try {
      await emissionsApi.logEmission({
        registrationNumber: registrationNumber,
        industryName: industryName,
        type: emissionType,
        quantity: parseFloat(value),
        description: notes,
      });
      toast.success('Emission logged');
      closeModal();
      fetchEmissions();
    } catch (error) {
      toast.error('Failed to log emission');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdateStatus(id, status) {
    try {
      await emissionsApi.updateEmissionStatus(id, status);
      toast.success('Status updated');
      fetchEmissions();
    } catch (error) {
      toast.error('Failed to update status');
    }
  }

  async function handleDelete(id) {
    try {
      await emissionsApi.deleteEmission(id);
      toast.success('Emission deleted');
      fetchEmissions();
    } catch (error) {
      toast.error('Failed to delete emission');
    }
  }

  const isSubmitDisabled = !registrationNumber.trim() || !industryName.trim() || !value || !notes.trim();

  const columns = [
    { key: 'logId', label: 'ID', render: (row) => <span className="text-sm text-bark-700">{row.logId}</span> },
    { key: 'industryName', label: 'Industry', sortable: true, render: (row) => <span className="text-sm text-bark-700">{row.industryName}</span> },
    { key: 'registrationNumber', label: 'Reg. Number', render: (row) => <code className="text-xs font-mono bg-bark-100 text-bark-700 px-1.5 py-0.5 rounded">{row.registrationNumber}</code> },
    { key: 'type', label: 'Type', render: (row) => <span className="text-sm text-bark-700">{row.type}</span> },
    { key: 'quantity', label: 'Value (mg/Nm³)', sortable: true, render: (row) => <span><span className="text-sm text-bark-700">{row.quantity}</span> <span className="text-xs text-bark-400">mg/Nm³</span></span> },
    { key: 'description', label: 'Description', render: (row) => <span title={row.description || ''} className="text-sm text-bark-600 truncate max-w-[120px] block">{row.description || '—'}</span> },
    {
      key: 'status', label: 'Status', render: (row) => (
        <div className="flex flex-col gap-0.5">
          <StatusBadge status={row.status} />
          {row.updatedAt && <span className="text-xs text-bark-400">{formatDateTime(row.updatedAt)}</span>}
        </div>
      )
    },
    { key: 'date', label: 'Date', render: (row) => <span className="text-sm text-bark-700">{formatDateTime(row.date)}</span> },
    {
      label: 'Actions', render: (row) => (
        <div className="flex gap-1">
          {(isAdmin || isComplianceOfficer) && row.status === 'SUBMITTED' && (
            <>
              <Button size="sm" variant="outline" className="text-xs flex items-center gap-1" onClick={() => handleUpdateStatus(row.logId, 'APPROVED')}><CheckCircle size={12} />Approve</Button>
              <Button size="sm" variant="danger" className="text-xs flex items-center gap-1" onClick={() => handleUpdateStatus(row.logId, 'REJECTED')}><X size={12} />Reject</Button>
            </>
          )}
          {isIndustry && row.status === 'SUBMITTED' && (
            <button
              onClick={() => handleDelete(row.logId)}
              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete emission"
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
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              {EMISSION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(isIndustry || isAdmin) && (
              <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Log Emission</Button>
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

      <Modal open={modalOpen} onClose={closeModal} title="Log Emission" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Registration Number (e.g. TNPCB-IND-1023)</label>
            <input
              type="text"
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Industry Name</label>
            <input
              type="text"
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={industryName}
              onChange={(e) => setIndustryName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Value (mg/Nm³)</label>
            <input
              type="number"
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Emission Type</label>
            <select
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={emissionType}
              onChange={(e) => setEmissionType(e.target.value)}
            >
              {EMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Description</label>
            <textarea
              rows={2}
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleCreate} loading={isSubmitting} disabled={isSubmitDisabled}>Submit</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
