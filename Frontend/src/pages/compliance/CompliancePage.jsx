import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { Plus, Trash2, Pencil } from 'lucide-react';
import * as complianceApi from '../../api/complianceApi';
import { useRole } from '../../hooks/useRole';
import { formatDateTime, labelify } from '../../utils/formatters';
import { COMPLIANCE_TYPES, COMPLIANCE_RESULTS } from '../../utils/constants';
import { toast } from 'sonner';

export default function CompliancePage() {
  const { canManageCompliance, isAdmin } = useRole();

  // List of compliance records
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Loading flags for write operations (used to disable buttons while saving)
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  // Create modal state — one useState per form field
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [entityId, setEntityId] = useState('');
  const [type, setType] = useState('EMISSION');
  const [result, setResult] = useState('PENDING');
  const [notes, setNotes] = useState('');

  // Update modal state — the record being edited and its form fields
  const [updateRecord, setUpdateRecord] = useState(null);
  const [updateResult, setUpdateResult] = useState('PENDING');
  const [updateNotes, setUpdateNotes] = useState('');

  // Fetch records when the page first loads
  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    setIsLoading(true);
    try {
      const response = await complianceApi.getComplianceRecords();
      setRecords(response.data);
    } catch (error) {
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setCreateModalOpen(true);
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
    setEntityId('');
    setType('EMISSION');
    setResult('PENDING');
    setNotes('');
  }

  function openUpdateModal(record) {
    setUpdateRecord(record);
    setUpdateResult(record.result);
    setUpdateNotes(record.notes || '');
  }

  function closeUpdateModal() {
    setUpdateRecord(null);
  }

  // Apply both filters and return the records to show in the table
  const filtered = [];
  for (const r of records) {
    if (typeFilter && r.type !== typeFilter) continue;
    if (resultFilter && r.result !== resultFilter) continue;
    filtered.push(r);
  }

  async function handleCreate() {
    setIsCreating(true);
    try {
      const trimmedNotes = notes.trim();
      const payload = {
        entityId: parseInt(entityId),
        type: type,
        result: result,
        notes: trimmedNotes ? trimmedNotes : null,
      };
      await complianceApi.createCompliance(payload);
      toast.success('Compliance record created');
      closeCreateModal();
      fetchRecords();
    } catch (error) {
      let msg = 'Failed to create record';
      if (error.response && error.response.data) {
        if (error.response.data.message) msg = error.response.data.message;
        else if (error.response.data.error) msg = error.response.data.error;
      }
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdate() {
    setIsUpdating(true);
    try {
      const notesArg = updateNotes ? updateNotes : undefined;
      await complianceApi.updateCompliance(updateRecord.complianceId, updateResult, notesArg);
      toast.success('Record updated');
      closeUpdateModal();
      fetchRecords();
    } catch (error) {
      let msg = 'Failed to update record';
      if (error.response && error.response.data && error.response.data.message) {
        msg = error.response.data.message;
      }
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete(complianceId) {
    try {
      await complianceApi.deleteCompliance(complianceId);
      toast.success('Record deleted');
      fetchRecords();
    } catch (error) {
      let msg = 'Failed to delete record';
      if (error.response && error.response.data && error.response.data.message) {
        msg = error.response.data.message;
      }
      toast.error(msg);
    }
  }

  const isCreateDisabled = !entityId || isNaN(parseInt(entityId));

  const columns = [
    { key: 'complianceId', label: 'ID', render: (r) => <span className="text-xs text-bark-400">{r.complianceId}</span> },
    { key: 'entityId', label: 'Entity ID', render: (r) => <span className="text-xs font-medium">{r.entityId}</span> },
    { key: 'type', label: 'Type', render: (r) => <span className="text-xs font-medium">{labelify(r.type)}</span> },
    { key: 'result', label: 'Result', render: (r) => <StatusBadge status={r.result} /> },
    { key: 'notes', label: 'Notes', render: (r) => <span className="text-xs text-bark-400 truncate max-w-[180px] block">{r.notes || '—'}</span> },
    { key: 'date', label: 'Date', render: (r) => <span className="text-xs text-bark-400">{formatDateTime(r.date)}</span> },
    {
      label: 'Actions', render: (r) => (
        <div className="flex gap-1">
          {canManageCompliance && (
            <button
              onClick={() => openUpdateModal(r)}
              className="p-1 text-forest-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Update result"
            >
              <Pencil size={13} />
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => handleDelete(r.complianceId)}
              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete record"
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
        emoji="🛡️"
        title="Compliance Records"
        description="Regulatory compliance tracking"
        action={
          <div className="flex gap-2 items-center">
            <select
              className="border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {COMPLIANCE_TYPES.map(t => <option key={t} value={t}>{labelify(t)}</option>)}
            </select>
            <select
              className="border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
            >
              <option value="">All Results</option>
              {COMPLIANCE_RESULTS.map(r => <option key={r} value={r}>{labelify(r)}</option>)}
            </select>
            {canManageCompliance && (
              <Button onClick={openCreateModal}><Plus size={16} /> Add Record</Button>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        <DataTable columns={columns} data={filtered} loading={isLoading} searchPlaceholder="Search records…" />
      </div>

      <Modal open={createModalOpen} onClose={closeCreateModal} title="Create Compliance Record">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Entity ID</label>
            <input
              type="number"
              min="1"
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="Industry or entity ID"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Compliance Type</label>
              <select
                className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {COMPLIANCE_TYPES.map(t => <option key={t} value={t}>{labelify(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Result</label>
              <select
                className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={result}
                onChange={(e) => setResult(e.target.value)}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeCreateModal}>Cancel</Button>
            <Button onClick={handleCreate} loading={isCreating} disabled={isCreateDisabled}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal open={updateRecord !== null} onClose={closeUpdateModal} title="Update Compliance Record" size="sm">
        {updateRecord !== null && (
          <div className="space-y-4">
            <div className="text-xs text-bark-400 bg-bark-50 rounded-xl px-3 py-2">
              Entity <span className="font-medium text-bark-700">{updateRecord.entityId}</span>
              {' · '}Type <span className="font-medium text-bark-700">{labelify(updateRecord.type)}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Result</label>
              <select
                className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={updateResult}
                onChange={(e) => setUpdateResult(e.target.value)}
              >
                {COMPLIANCE_RESULTS.map(r => <option key={r} value={r}>{labelify(r)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Notes</label>
              <textarea
                rows={4}
                className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="Compliance notes…"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={closeUpdateModal}>Cancel</Button>
              <Button onClick={handleUpdate} loading={isUpdating}>Update</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
