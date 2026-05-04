import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import Button from './Button';
import { Trash2, Edit, Plus } from 'lucide-react';
import ImpactMetricsForm from './ImpactMetricsForm';
import * as projectsApi from '../api/projectsApi';
import { toast } from 'sonner';
import { labelify, formatNumber } from '../utils/formatters';
import { IMPACT_STATUSES } from '../utils/constants';

const metricDisplay = [
  { key: 'treesPlanted', label: 'Trees Planted', icon: '🌳' },
  { key: 'co2ReducedTons', label: 'CO₂ (tons)', icon: '💨' },
  { key: 'areaRestoredHectares', label: 'Area (hectares)', icon: '🌾' },
  { key: 'renewableEnergyKwh', label: 'Energy (kWh)', icon: '⚡' },
  { key: 'wasteCollectedKg', label: 'Waste (kg)', icon: '♻️' },
  { key: 'peopleBenefited', label: 'People Benefited', icon: '👥' },
];

export default function ImpactManagement({ projectId, impact, onRefresh, canEdit }) {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);

  const createMut = useMutation({
    mutationFn: (d) => projectsApi.addOrUpdateImpact(projectId, { metrics: d }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['impact', projectId] });
      toast.success(impact ? 'Impact updated' : 'Impact created');
      setModal(false);
      onRefresh?.();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save impact'),
  });

  const statusMut = useMutation({
    mutationFn: (status) => projectsApi.updateImpactStatus(projectId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['impact', projectId] });
      toast.success('Impact status updated');
      setStatusModal(false);
      onRefresh?.();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update status'),
  });

  const deleteMut = useMutation({
    mutationFn: () => projectsApi.deleteImpact(projectId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['impact', projectId] });
      toast.success('Impact deleted');
      onRefresh?.();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete impact'),
  });


  if (!impact) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🌍</div>
        <p className="text-bark-400 mb-4">No environmental impact metrics recorded yet.</p>
        {canEdit && (
          <>
            <Button onClick={() => setModal(true)} size="sm">
              <Plus size={16} /> Create Impact Metrics
            </Button>

            <Modal open={modal} onClose={() => setModal(false)} title="Create Impact Metrics" size="lg">
              <ImpactMetricsForm
                initialMetrics={{}}
                onSave={(data) => createMut.mutate(data)}
                loading={createMut.isPending}
                isEdit={false}
              />
            </Modal>
          </>
        )}
      </div>
    );
  }

  const metrics = impact.metrics || {};

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {metricDisplay.map(({ key, label, icon }) => {
          const val = metrics[key];
          if (!val) return null;
          return (
            <div key={key} className="bg-gradient-to-br from-green-50 to-earth-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs font-medium text-green-700 bg-white px-2 py-1 rounded-full">{label}</span>
              </div>
              <div className="text-3xl font-bold text-forest-600">{formatNumber(val)}</div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {metrics.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">📝 Notes</h4>
          <p className="text-sm text-blue-800">{metrics.notes}</p>
        </div>
      )}

      {/* Custom Metrics */}
      {metrics.customMetrics && Object.keys(metrics.customMetrics).length > 0 && (
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <h4 className="text-sm font-semibold text-bark-800 mb-3 flex items-center gap-2">
            <span>🔧</span> Custom Metrics
          </h4>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(metrics.customMetrics).map(([key, val]) => (
              <div key={key} className="bg-white rounded-lg p-2">
                <div className="text-xs text-bark-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                <div className="text-lg font-semibold text-purple-600">{formatNumber(val)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Impact Status Card */}
      <div className="bg-earth-50 rounded-xl p-4 border-2 border-earth-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-bark-600 mb-1">Impact Status</p>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-600" />
              <span className="font-semibold text-bark-800">{labelify(impact.status)}</span>
            </div>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Button
                onClick={() => setStatusModal(true)}
                size="sm"
                variant="outline"
              >
                Change Status
              </Button>
              <Button
                onClick={() => setModal(true)}
                size="sm"
                variant="outline"
              >
                <Edit size={14} /> Edit
              </Button>
              <Button
                onClick={() => {
                  if (window.confirm('Delete all impact metrics? This action cannot be undone.')) {
                    deleteMut.mutate();
                  }
                }}
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Edit Impact Metrics" size="lg">
        <ImpactMetricsForm
          initialMetrics={metrics}
          onSave={(data) => createMut.mutate(data)}
          loading={createMut.isPending}
          isEdit={true}
        />
      </Modal>

      {/* Status Change Modal */}
      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Update Impact Status" size="sm">
        <div className="space-y-2">
          {IMPACT_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => statusMut.mutate(status)}
              disabled={statusMut.isPending}
              className={`w-full p-3 rounded-xl border-2 text-left transition-colors ${
                impact.status === status
                  ? 'border-forest-600 bg-forest-50'
                  : 'border-bark-400/20 hover:border-forest-600 hover:bg-earth-100'
              }`}
            >
              <div className="font-medium text-bark-800">{labelify(status)}</div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

