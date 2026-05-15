import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { Plus, Trash2, Factory, AlertTriangle, Info } from 'lucide-react';
import * as emissionsApi from '../../api/emissionsApi';
import { useRole } from '../../hooks/useRole';
import { formatDate, formatTime } from '../../utils/formatters';
import { EMISSION_TYPES, EMISSION_STATUSES, EMISSION_STANDARDS } from '../../utils/constants';
import { toast } from 'sonner';

export default function EmissionsPage() {
  const { isIndustry, isAdmin, isComplianceOfficer } = useRole();

  // Emissions list
  const [emissions, setEmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Status filter dropdown
  const [statusFilter, setStatusFilter] = useState('');

  // Description that the user clicked on, shown in a small modal
  const [viewDescription, setViewDescription] = useState(null);

  // Reject-reason modal state. Holds the row being rejected and the typed reason.
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Read-only modal that shows the stored rejection reason when a REJECTED badge is clicked.
  const [viewRejectionReason, setViewRejectionReason] = useState(null);

  // Modal open/close
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields — one state variable per field
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [industryName, setIndustryName] = useState('');
  const [emissionType, setEmissionType] = useState('CO2');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  // Form validation errors
  const [regNumError, setRegNumError] = useState('');
  const [industryNameError, setIndustryNameError] = useState('');
  const [valueError, setValueError] = useState('');
  const [emissionTypeError, setEmissionTypeError] = useState('');
  const [notesError, setNotesError] = useState('');

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
    setRegNumError('');
    setIndustryNameError('');
    setValueError('');
    setEmissionTypeError('');
    setNotesError('');
  }

  // Filter the list by selected status
  const filtered = statusFilter ? emissions.filter(e => e.status === statusFilter) : emissions;

  function validate() {
    let valid = true;

    // Registration Number: required, min 3, max 15
    if (!registrationNumber.trim()) {
      setRegNumError('Registration number is required');
      valid = false;
    } else if (registrationNumber.trim().length < 3 || registrationNumber.trim().length > 15) {
      setRegNumError('Must be 3–15 characters');
      valid = false;
    } else {
      setRegNumError('');
    }

    // Industry Name: required, min 3, max 100, letters/spaces/hyphens only
    if (!industryName.trim()) {
      setIndustryNameError('Industry name is required');
      valid = false;
    } else if (industryName.trim().length < 3 || industryName.trim().length > 100) {
      setIndustryNameError('Must be 3–100 characters, letters and spaces only');
      valid = false;
    } else if (!/^[A-Za-z\s-]+$/.test(industryName.trim())) {
      setIndustryNameError('Must be 3–100 characters, letters and spaces only');
      valid = false;
    } else {
      setIndustryNameError('');
    }

    // Value: required, finite number, > 0, max 4 decimal places, max 9,999,999
    const num = parseFloat(value);
    if (!value) {
      setValueError('Must be a positive number with up to 4 decimal places');
      valid = false;
    } else if (isNaN(num) || !isFinite(num)) {
      setValueError('Must be a positive number with up to 4 decimal places');
      valid = false;
    } else if (num <= 0) {
      setValueError('Must be a positive number with up to 4 decimal places');
      valid = false;
    } else if (num > 9999999) {
      setValueError('Value cannot exceed 9,999,999');
      valid = false;
    } else if (!/^\d+(\.\d{1,4})?$/.test(value)) {
      setValueError('Must be a positive number with up to 4 decimal places');
      valid = false;
    } else {
      setValueError('');
    }

    // Emission Type: must be one of the allowed values
    if (!emissionType || !EMISSION_TYPES.includes(emissionType)) {
      setEmissionTypeError('Select an emission type');
      valid = false;
    } else {
      setEmissionTypeError('');
    }

    // Description: required, min 10, max 500
    if (!notes.trim()) {
      setNotesError('Minimum 10 characters required');
      valid = false;
    } else if (notes.trim().length < 10) {
      setNotesError('Minimum 10 characters required');
      valid = false;
    } else if (notes.trim().length > 500) {
      setNotesError('Must be under 500 characters');
      valid = false;
    } else {
      setNotesError('');
    }

    return valid;
  }

  async function handleCreate() {
    if (!validate()) return;
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

  function openRejectModal(row) {
    setRejectTarget(row);
    setRejectReason('');
  }

  function closeRejectModal() {
    setRejectTarget(null);
    setRejectReason('');
  }

  async function handleConfirmReject() {
    const trimmed = rejectReason.trim();
    if (trimmed.length < 10) return;
    setIsRejecting(true);
    try {
      await emissionsApi.updateEmissionStatus(rejectTarget.logId, 'REJECTED', trimmed);
      toast.success('Emission rejected');
      closeRejectModal();
      fetchEmissions();
    } catch (error) {
      let msg = 'Failed to reject emission';
      if (error.response && error.response.data && error.response.data.message) {
        msg = error.response.data.message;
      }
      toast.error(msg);
    } finally {
      setIsRejecting(false);
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
    {
      key: 'industryName', label: 'Industry', sortable: true,
      render: (row) => (
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-sm text-bark-800">{row.industryName}</span>
          <code className="text-[10px] font-mono text-black mt-0.5">{row.registrationNumber}</code>
        </div>
      )
    },
    { key: 'type', label: 'Type', render: (row) => <span className="text-sm text-bark-700 whitespace-nowrap">{row.type}</span> },
    {
      key: 'quantity', label: 'Value (mg/Nm³)', sortable: true, render: (row) => {
        const limit = EMISSION_STANDARDS[row.type];
        const exceeds = limit !== undefined && Number(row.quantity) > limit;
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-sm text-bark-700">{row.quantity}</span>
            <span className="text-xs text-bark-400">mg/Nm³</span>
            {exceeds && (
              <span title={`Exceeds ${row.type} reference (${limit})`} className="inline-flex">
                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              </span>
            )}
          </span>
        );
      }
    },
    {
      key: 'description', label: 'Description',
      render: (row) => (
        row.description ? (
          <button
            type="button"
            onClick={() => setViewDescription(row.description)}
            title="Click to view full description"
            className="text-sm text-bark-600 truncate max-w-[140px] block text-left hover:text-forest-700 hover:underline cursor-pointer"
          >
            {row.description}
          </button>
        ) : (
          <span className="text-sm text-bark-400">—</span>
        )
      )
    },
    {
      key: 'status', label: 'Status',
      render: (row) => {
        const isRejected = row.status === 'REJECTED';
        const reason = row.rejectionReason ? row.rejectionReason : 'No reason provided';
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <StatusBadge status={row.status} />
              {isRejected && (
                <button
                  type="button"
                  onClick={() => setViewRejectionReason(reason)}
                  title="View rejection reason"
                  className="p-1 rounded-full text-red-500 hover:bg-red-50 cursor-pointer"
                >
                  <Info size={14} />
                </button>
              )}
            </div>
            {row.updatedAt && (
              <div className="flex flex-col whitespace-nowrap leading-tight">
                <span className="text-[10px] text-bark-400">{formatDate(row.updatedAt)}</span>
                <span className="text-[10px] text-bark-400">{formatTime(row.updatedAt)}</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'date', label: 'Date',
      render: (row) => (
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-sm text-bark-700">{formatDate(row.date)}</span>
          {formatTime(row.date) && <span className="text-xs text-bark-400">{formatTime(row.date)}</span>}
        </div>
      )
    },
    {
      label: 'Actions', render: (row) => (
        <div className="flex gap-1">
          {(isAdmin || isComplianceOfficer) && row.status === 'SUBMITTED' && (
            <>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => handleUpdateStatus(row.logId, 'APPROVED')}>Approve</Button>
              <Button size="sm" variant="danger" className="text-xs" onClick={() => openRejectModal(row)}>Reject</Button>
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

      <Modal open={viewDescription !== null} onClose={() => setViewDescription(null)} title="Description" size="sm">
        <div className="text-sm text-bark-700 whitespace-pre-wrap break-words">
          {viewDescription}
        </div>
      </Modal>

      <Modal open={viewRejectionReason !== null} onClose={() => setViewRejectionReason(null)} title="Rejection Reason" size="sm">
        <div className="text-sm text-bark-700 whitespace-pre-wrap break-words bg-red-50 border border-red-200 rounded-xl p-3">
          {viewRejectionReason}
        </div>
      </Modal>

      <Modal open={rejectTarget !== null} onClose={closeRejectModal} title="Reject Emission" size="sm">
        {rejectTarget !== null && (() => {
          const trimmed = rejectReason.trim();
          const valid = trimmed.length >= 10;
          const showError = trimmed.length > 0 && !valid;
          return (
            <div className="space-y-4">
              <div className="text-xs text-bark-500 bg-bark-50 rounded-xl px-3 py-2">
                Rejecting emission <span className="font-medium text-bark-700">#{rejectTarget.logId}</span>
                {' · '}<span className="font-medium text-bark-700">{rejectTarget.industryName}</span>
                {' · '}<span className="font-medium text-bark-700">{rejectTarget.type}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-bark-600 mb-1">Reason for rejection</label>
                <textarea
                  rows={4}
                  autoFocus
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${showError ? 'border-red-400 focus:ring-red-400/30' : 'border-bark-400/20 focus:ring-forest-600/30'}`}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this emission is being rejected (min 10 characters)…"
                />
                <p className={`text-xs mt-1 ${showError ? 'text-red-500' : 'text-bark-400'}`}>
                  {showError
                    ? `Reason must be at least 10 characters (${trimmed.length}/10).`
                    : `${trimmed.length} character${trimmed.length === 1 ? '' : 's'} — minimum 10.`}
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={closeRejectModal}>Cancel</Button>
                <Button variant="danger" onClick={handleConfirmReject} loading={isRejecting} disabled={!valid}>Reject</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal open={modalOpen} onClose={closeModal} title="Log Emission" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Registration Number (e.g. TNPCB-IND-1023)</label>
            <input
              type="text"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${regNumError ? 'border-red-400 focus:ring-red-400/30' : 'border-bark-400/20 focus:ring-forest-600/30'}`}
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
            />
            {regNumError && <p className="mt-1 text-xs text-red-500">{regNumError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Industry Name</label>
            <input
              type="text"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${industryNameError ? 'border-red-400 focus:ring-red-400/30' : 'border-bark-400/20 focus:ring-forest-600/30'}`}
              value={industryName}
              onChange={(e) => setIndustryName(e.target.value)}
            />
            {industryNameError && <p className="mt-1 text-xs text-red-500">{industryNameError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Value (mg/Nm³)</label>
            <input
              type="number"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${valueError ? 'border-red-400 focus:ring-red-400/30' : 'border-bark-400/20 focus:ring-forest-600/30'}`}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            {valueError && <p className="mt-1 text-xs text-red-500">{valueError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Emission Type</label>
            <select
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${emissionTypeError ? 'border-red-400 focus:ring-red-400/30' : 'border-bark-400/20 focus:ring-forest-600/30'}`}
              value={emissionType}
              onChange={(e) => setEmissionType(e.target.value)}
            >
              {EMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {emissionTypeError && <p className="mt-1 text-xs text-red-500">{emissionTypeError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Description</label>
            <textarea
              rows={2}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${notesError ? 'border-red-400 focus:ring-red-400/30' : 'border-bark-400/20 focus:ring-forest-600/30'}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
            />
            {notesError && <p className="mt-1 text-xs text-red-500">{notesError}</p>}
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
