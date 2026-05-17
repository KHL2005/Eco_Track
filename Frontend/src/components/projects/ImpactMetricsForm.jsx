import Button from '../common/Button';
import { Plus, Trash2, Edit } from 'lucide-react';
import Modal from '../common/Modal';
import { useState } from 'react';
import { toast } from 'sonner';

const impactMetricFields = [
  { key: 'treesPlanted', label: 'Trees Planted', type: 'number', icon: '🌳' },
  { key: 'areaRestoredHectares', label: 'Area Restored (hectares)', type: 'number', icon: '🌾' },
  { key: 'co2ReducedTons', label: 'CO₂ Reduced (tons)', type: 'number', icon: '💨' },
  { key: 'renewableEnergyKwh', label: 'Renewable Energy (kWh)', type: 'number', icon: '⚡' },
  { key: 'wasteCollectedKg', label: 'Waste Collected (kg)', type: 'number', icon: '♻️' },
  { key: 'waterBodiesCleaned', label: 'Water Bodies Cleaned', type: 'number', icon: '💧' },
  { key: 'pollutionIncidentsResolved', label: 'Pollution Incidents Resolved', type: 'number', icon: '⚠️' },
  { key: 'peopleBenefited', label: 'People Benefited', type: 'number', icon: '👥' },
  { key: 'awarenessSessionsConducted', label: 'Awareness Sessions', type: 'number', icon: '📢' },
  { key: 'volunteerEngagements', label: 'Volunteer Engagements', type: 'number', icon: '🤝' },
];

export default function ImpactMetricsForm({ initialMetrics = {}, onSave, loading = false, isEdit = false }) {
  const [form, setForm] = useState(
    impactMetricFields.reduce((acc, field) => {
      acc[field.key] = initialMetrics[field.key] || '';
      return acc;
    }, {})
  );

  const [notes, setNotes] = useState(initialMetrics.notes || '');
  const [customMetrics, setCustomMetrics] = useState(initialMetrics.customMetrics || {});
  const [newCustomKey, setNewCustomKey] = useState('');
  const [newCustomValue, setNewCustomValue] = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAddCustomMetric = () => {
    if (!newCustomKey || !newCustomValue) {
      toast.error('Both key and value are required');
      return;
    }
    setCustomMetrics(cm => ({ ...cm, [newCustomKey]: parseFloat(newCustomValue) }));
    setNewCustomKey('');
    setNewCustomValue('');
    toast.success('Custom metric added');
  };

  const handleRemoveCustomMetric = (key) => {
    setCustomMetrics(cm => {
      const updated = { ...cm };
      delete updated[key];
      return updated;
    });
  };

  const handleSave = () => {
    const data = {};
    impactMetricFields.forEach(field => {
      const val = form[field.key];
      if (val !== '' && val !== null) {
        data[field.key] = parseFloat(val);
      }
    });

    if (notes) data.notes = notes;
    if (Object.keys(customMetrics).length > 0) data.customMetrics = customMetrics;

    if (Object.keys(data).length === 0) {
      toast.error('Please enter at least one metric');
      return;
    }

    onSave(data);
  };

  return (
    <div className="space-y-6">
      {/* Predefined Metrics Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {impactMetricFields.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-bark-600 mb-2 flex items-center gap-2">
              <span>{field.icon}</span> {field.label}
            </label>
            <input
              type={field.type}
              className="w-full border border-bark-400/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={form[field.key]}
              onChange={set(field.key)}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        ))}
      </div>

      {/* Notes Section */}
      <div className="border-t border-bark-400/20 pt-4">
        <label className="block text-sm font-medium text-bark-600 mb-2">📝 Notes</label>
        <textarea
          rows={3}
          className="w-full border border-bark-400/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional observations or achievements..."
        />
      </div>

      {/* Custom Metrics Section */}
      <div className="border-t border-bark-400/20 pt-4">
        <h4 className="text-sm font-semibold text-bark-800 mb-3">🔧 Custom Metrics</h4>

        {Object.keys(customMetrics).length > 0 && (
          <div className="bg-earth-50 rounded-xl p-3 mb-4 space-y-2">
            {Object.entries(customMetrics).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between bg-white rounded-lg p-2">
                <div className="text-sm">
                  <span className="font-medium text-bark-800 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-bark-600 ml-2">{value}</span>
                </div>
                <button
                  onClick={() => handleRemoveCustomMetric(key)}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <Trash2 size={14} className="text-red-600" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            className="flex-1 border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
            placeholder="Metric name (e.g., aqiBefore)"
            value={newCustomKey}
            onChange={(e) => setNewCustomKey(e.target.value)}
          />
          <input
            className="w-24 border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
            placeholder="Value"
            type="number"
            value={newCustomValue}
            onChange={(e) => setNewCustomValue(e.target.value)}
          />
          <Button
            onClick={handleAddCustomMetric}
            size="sm"
            variant="outline"
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>

      {/* Save Button */}
      <div className="border-t border-bark-400/20 pt-4 flex gap-3 justify-end">
        <Button onClick={handleSave} loading={loading}>
          {isEdit ? 'Update Impact Metrics' : 'Create Impact Metrics'}
        </Button>
      </div>
    </div>
  );
}

