import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import DataTable from '../components/DataTable';
import * as sensorsApi from '../api/sensorsApi';
import { useRole } from '../hooks/useRole';
import { formatSensorId } from '../utils/idFormatters';
import { SENSOR_TYPES } from '../utils/constants';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function SensorsPage() {
  const { canManageSensors, isAdmin, isOfficer, isScientist } = useRole();
  const qc = useQueryClient();
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState(null);
  const [sensorToDelete, setSensorToDelete] = useState(null);
  const [form, setForm] = useState({ type: '', location: '' });
  const [editForm, setEditForm] = useState({ location: '', type: '', status: '' });
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchId, setSearchId] = useState('');
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setEdit = (k) => (e) => setEditForm(f => ({ ...f, [k]: e.target.value }));

  const { data: sensors = [], isLoading } = useQuery({
    queryKey: ['sensors'],
    queryFn: () => sensorsApi.getSensors().then(r => r.data).catch(() => []),
  });

  const createMut = useMutation({
    mutationFn: (d) => sensorsApi.createSensor(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sensors'] }); toast.success('Sensor registered'); setCreateModal(false); setForm({ type: 'AIR', location: '' }); },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to register sensor';
      const details = error?.response?.data?.details || '';
      const fullError = details ? `${errorMsg}: ${details}` : errorMsg;
      toast.error('Failed to register sensor', {
        description: fullError,
        duration: 5000
      });
      console.error('Sensor creation error:', error);
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => sensorsApi.updateSensorStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sensors'] }); toast.success('Status updated'); },
  });

  const updateLocation = useMutation({
    mutationFn: ({ id, location }) => sensorsApi.updateSensorLocation(id, location),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sensors'] }); toast.success('Location updated'); },
  });

  const updateType = useMutation({
    mutationFn: ({ id, type }) => sensorsApi.updateSensorType(id, type),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sensors'] }); toast.success('Type updated'); },
  });

  const editMut = useMutation({
    mutationFn: async ({ id, location, type, status }) => {
      const promises = [];
      if (location !== undefined && location !== '' && editingSensor.location !== location) {
        promises.push(sensorsApi.updateSensorLocation(id, location));
      }
      if (type !== undefined && type !== '' && editingSensor.type !== type) {
        promises.push(sensorsApi.updateSensorType(id, type));
      }
      if (status !== undefined && status !== '' && editingSensor.status !== status) {
        promises.push(sensorsApi.updateSensorStatus(id, status));
      }
      if (promises.length === 0) {
        toast.info('No changes made');
        return Promise.resolve();
      }
      return Promise.all(promises);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensors'] });
      toast.success('Sensor updated successfully');
      setEditModal(false);
      setEditingSensor(null);
      setEditForm({ location: '', type: '', status: '' });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update sensor');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => sensorsApi.deleteSensor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensors'] });
      toast.success(`Sensor with ID ${sensorToDelete?.id} deleted successfully`, {
        description: `All associated data and analyses have been removed.`,
        duration: 4000,
      });
      setDeleteConfirmOpen(false);
      setSensorToDelete(null);
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete sensor');
    },
  });

  const columns = [
    { key: 'id', label: 'ID', render: r => <span className="text-bark-800 text-xs font-semibold">{formatSensorId(r.id)}</span> },
    { key: 'type', label: 'Type', render: r => <span className="text-xs">{r.type}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'location', label: 'Location' },
    {
      key: 'actions',
      label: 'Actions',
      render: r => (
        <div className="flex gap-2">
          {canManageSensors && (
            <>
              <button
                onClick={() => {
                  setEditingSensor(r);
                  setEditForm({ location: r.location, type: r.type, status: r.status });
                  setEditModal(true);
                }}
                className="p-1 text-forest-600 hover:bg-earth-100 rounded-lg transition-colors"
                title="Edit sensor"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => {
                  setSensorToDelete(r);
                  setDeleteConfirmOpen(true);
                }}
                className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                title="Delete sensor"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      )
    },
  ];

  // Map sensorId to id for DataTable compatibility
  const sensorsWithId = sensors.map(s => ({ ...s, id: s.sensorId }));

  // Only allow these statuses for filtering
  const SENSOR_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];
  // Only allow sensor types (exclude SOIL)
  const SENSOR_TYPE_OPTIONS = SENSOR_TYPES.filter(t => t !== 'SOIL');

  // Filter sensors by type and status
  const filteredSensors = sensorsWithId.filter(s => {
    const typeMatch = !typeFilter || s.type === typeFilter;
    const statusMatch = !statusFilter || s.status === statusFilter;
    const idMatch = !searchId || s.id.toString().includes(searchId);
    return typeMatch && statusMatch && idMatch;
  });

  return (
    <DashboardLayout>
      <PageHeader emoji="📡" title="Sensors" description="Live environmental sensor network"
        action={
          <div className="flex gap-2 items-center">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!searchId.trim()) return;
              // Check if sensor exists in the list
              const sensorExists = sensorsWithId.some(s => s.id.toString().includes(searchId.trim()));
              if (sensorExists) {
                setSearchId(searchId.trim());
              } else {
                toast.error('Sensor not found');
                setSearchId('');
              }
            }} className="flex gap-2">
              <input
                type="text"
                placeholder="Search by ID"
                className="border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
                style={{ minWidth: 120 }}
              />
              <Button type="submit" size="sm">Search</Button>
            </form>
            <select
              className="border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {SENSOR_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              className="border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              {SENSOR_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {canManageSensors && <Button size="sm" onClick={() => setCreateModal(true)}><Plus size={14} /> Add Sensor</Button>}
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        <DataTable columns={columns} data={filteredSensors} loading={isLoading} searchable={false} />
      </div>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Register New Sensor">
        <div className="space-y-4">
          {createMut.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm font-medium text-red-900">Registration Failed</p>
              <p className="text-xs text-red-700 mt-1">
                {createMut.error?.response?.data?.message || 'Please check your input and try again'}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Location <span className="text-red-500">*</span></label>
            <input type="text" className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              placeholder="e.g., New Delhi" value={form.location} onChange={set('location')} />
            {form.location && form.location.length < 2 && <p className="text-xs text-orange-600 mt-1">Location should be at least 2 characters</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Sensor Type <span className="text-red-500">*</span></label>
            <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={form.type} onChange={set('type')}>
              <option value="">Select a type</option>
              {SENSOR_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {!form.type && <p className="text-xs text-orange-600 mt-1">Sensor type is required</p>}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!form.location.trim()) {
                toast.error('Location is required');
                return;
              }
              if (!form.type) {
                toast.error('Sensor type is required');
                return;
              }
              createMut.mutate({
                location: form.location,
                type: form.type
              });
            }} loading={createMut.isPending}>Register</Button>
          </div>
        </div>
      </Modal>

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Sensor">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Location</label>
            <input
              type="text"
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              placeholder="Sensor location"
              value={editForm.location}
              onChange={setEdit('location')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Sensor Type</label>
            <select
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={editForm.type}
              onChange={setEdit('type')}
            >
              <option value="">Select type</option>
              {SENSOR_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Status</label>
            <select
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={editForm.status}
              onChange={setEdit('status')}
            >
              <option value="">Select status</option>
              {SENSOR_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button onClick={() => editMut.mutate({ id: editingSensor.id, ...editForm })} loading={editMut.isPending}>Update</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSensorToDelete(null);
        }}
        onConfirm={() => {
          if (sensorToDelete) {
            deleteMut.mutate(sensorToDelete.id);
          }
        }}
        title="Delete Sensor"
        message={`Are you sure you want to delete sensor with ID ${sensorToDelete?.id}? This will also delete all associated sensor data and analyses.`}
        loading={deleteMut.isPending}
        confirmLabel="Delete Sensor"
        variant="danger"
      />
    </DashboardLayout>
  );
}
