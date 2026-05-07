import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Trash2, Eye } from 'lucide-react';
import * as sensorsApi from '../api/sensorsApi';
import { useRole } from '../hooks/useRole';
import { formatDateTime } from '../utils/formatters';
import { toast } from 'sonner';

export default function SensorDataPage() {
  const { canManageSensors } = useRole();
  const qc = useQueryClient();

  // State
  const [createModal, setCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchDataId, setSearchDataId] = useState('');
  const [searchSensorId, setSearchSensorId] = useState('');
  const [detailsModal, setDetailsModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [form, setForm] = useState({
    sensorId: '',
    parametersJson: ''
  });
  const RECORDS_PER_PAGE = 6;

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Queries
  const { data: allSensorData = [], isLoading } = useQuery({
    queryKey: ['sensorData'],
    queryFn: () => sensorsApi.getSensorData().then(r => r.data).catch(() => []),
  });

  // Filter data based on search
  const filteredData = allSensorData.filter(d => {
    const dataId = (d.id || d.dataId)?.toString() || '';
    const sensorId = (d.sensorId)?.toString() || '';

    const matchesDataId = !searchDataId || dataId.includes(searchDataId);
    const matchesSensorId = !searchSensorId || sensorId.includes(searchSensorId);

    return matchesDataId && matchesSensorId;
  });

  // Create mutation
  const createMut = useMutation({
    mutationFn: (d) => sensorsApi.addSensorData(d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensorData'] });
      toast.success('Sensor data recorded successfully');
      setCreateModal(false);
      setCurrentPage(1);
      setSearchDataId('');
      setSearchSensorId('');
      setForm({ sensorId: '', value: '', unit: '', parametersJson: '', notes: '' });
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to record sensor data';
      toast.error(errorMsg);
    },
  });

  // Delete mutation
  const deleteMut = useMutation({
    mutationFn: (dataId) => sensorsApi.deleteSensorData(dataId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sensorData'] });
      toast.success('Sensor data record deleted successfully');
      setDeleteConfirm(null);
      setCurrentPage(1);
    },
    onError: (error) => {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to delete sensor data';
      toast.error(errorMsg);
    },
  });

  // Parse and format JSON parameters for display
  const parseParameters = (parametersJson) => {
    if (!parametersJson) return {};
    try {
      return JSON.parse(parametersJson);
    } catch {
      return { raw: parametersJson };
    }
  };

  // Table columns
  const columns = [
    {
      key: 'id',
      label: 'Data ID',
      sortable: true,
      render: r => <span className="text-xs font-semibold text-bark-700">{r.id || r.dataId || '—'}</span>
    },
    {
      key: 'sensorId',
      label: 'Sensor ID',
      sortable: true,
      render: r => <span className="text-xs font-semibold text-black">{r.sensorId || '—'}</span>
    },
    {
      key: 'parametersJson',
      label: 'Parameters',
      render: r => {
        const params = parseParameters(r.parametersJson);
        const isEmpty = !r.parametersJson || (typeof params === 'object' && Object.keys(params).length === 0);

        return (
          <div className="flex items-center gap-2">
            {isEmpty ? (
              <span className="text-xs text-bark-400">—</span>
            ) : (
              <button
                onClick={() => setDetailsModal(r)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
                title="View details"
              >
                <Eye size={14} />
                View
              </button>
            )}
          </div>
        );
      }
    },
    {
      label: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          {canManageSensors && (
            <button
              onClick={() => setDeleteConfirm(r.id || r.dataId)}
              className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200"
              title="Delete sensor data record"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        emoji="💧"
        title="Sensor Data Readings"
        description="Record and manage environmental sensor readings"
        action={
          canManageSensors && (
            <Button size="sm" onClick={() => setCreateModal(true)}>
              <Plus size={14} /> Record Data
            </Button>
          )
        }
      />

      {/* Search Section */}
      <div className="bg-white rounded-2xl border border-bark-400/10 p-4 mb-4">
        <div className="grid grid-cols-3 gap-3">
          {/* Search by Data ID */}
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Search by Data ID</label>
            <input
              type="text"
              placeholder="Enter data ID..."
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 transition-all"
              value={searchDataId}
              onChange={(e) => { setSearchDataId(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Search by Sensor ID */}
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Search by Sensor ID</label>
            <input
              type="text"
              placeholder="Enter sensor ID..."
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 transition-all"
              value={searchSensorId}
              onChange={(e) => { setSearchSensorId(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            {(searchDataId || searchSensorId) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchDataId('');
                  setSearchSensorId('');
                  setCurrentPage(1);
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        <DataTable
          columns={columns}
          data={filteredData}
          loading={isLoading}
          searchable={false}
          currentPage={currentPage}
          recordsPerPage={RECORDS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Parameter Details Modal */}
      <Modal
        open={!!detailsModal}
        onClose={() => setDetailsModal(null)}
        title="Parameter Details"
        size="lg"
      >
        <div className="space-y-4">
          {detailsModal && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-bark-700">Parameters</label>
                <div className="p-3 bg-bark-50 rounded-xl border border-bark-300/30 max-h-64 overflow-y-auto">
                  {Object.keys(parseParameters(detailsModal.parametersJson)).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(parseParameters(detailsModal.parametersJson)).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-start py-1 border-b border-bark-200/50 last:border-0">
                          <span className="text-sm font-medium text-bark-700">{key}:</span>
                          <span className="text-sm text-bark-600 font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-bark-400 italic">No parameters recorded</p>
                  )}
                </div>
              </div>

              {detailsModal.notes && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-bark-700">Notes</label>
                  <div className="p-3 bg-bark-50 rounded-xl border border-bark-300/30">
                    <p className="text-sm text-bark-700 whitespace-pre-wrap">{detailsModal.notes}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4 border-t border-bark-400/10">
                <Button variant="secondary" onClick={() => setDetailsModal(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Record Sensor Data Modal */}
      <Modal
        open={createModal}
        onClose={() => setCreateModal(false)}
        title="Record Sensor Data"
        size="lg"
      >
        <div className="space-y-4">
          {/* Sensor ID - Required */}
          <div>
            <label className="block text-sm font-semibold text-bark-700 mb-2">
              Sensor ID <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 transition-all"
              placeholder="Enter sensor ID"
              value={form.sensorId}
              onChange={set('sensorId')}
              min="1"
            />
            <p className="text-xs text-bark-400 mt-1">The ID of the sensor recording this data</p>
          </div>

          {/* Parameters JSON */}
          <div>
            <label className="block text-sm font-semibold text-bark-700 mb-2">
              Parameters (JSON Format) <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30 font-mono text-xs transition-all"
              placeholder='Required. Example: {"CO2": 400, "NO2": 25, "PM25": 35}'
              rows="3"
              value={form.parametersJson}
              onChange={set('parametersJson')}
            />
            <p className="text-xs text-bark-400 mt-1">Enter environmental parameters as JSON for detailed analysis</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-bark-400/10">
            <Button
              variant="secondary"
              onClick={() => setCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!form.sensorId.trim()) {
                  toast.error('Sensor ID is required');
                  return;
                }
                if (!form.parametersJson.trim()) {
                  toast.error('Parameters are required');
                  return;
                }
                createMut.mutate({
                  sensorId: parseInt(form.sensorId),
                  parametersJson: form.parametersJson,
                });
              }}
              loading={createMut.isPending}
            >
              Record Data
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteMut.mutate(deleteConfirm)}
        title="Delete Sensor Data Record"
        message={`Are you sure you want to delete this sensor data record (ID: ${deleteConfirm})? This action cannot be undone and will also remove linked analyses.`}
        loading={deleteMut.isPending}
      />
    </DashboardLayout>
  );
}

