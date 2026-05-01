import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as issuesApi from '../api/issuesApi';
import { useAuth } from '../context/AuthContext';
import { ISSUE_TYPES } from '../utils/constants';
import { labelify } from '../utils/formatters';
import { toast } from 'sonner';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function LocationPicker({ position, onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng) });
  return position ? <Marker position={position} /> : null;
}

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-bark-600 mb-1.5">{label}</label>
    {children}
    {error && <p className="text-xs text-danger mt-1">{error}</p>}
  </div>
);

export default function CreateIssuePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', type: '', location: '' });
  const [position, setPosition] = useState(null);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.type) e.type = 'Issue type is required';
    if (!position) e.location = 'Please click the map to select a location';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createMut = useMutation({
    mutationFn: (data) => issuesApi.createIssue(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['issues'] });
      toast.success('Issue reported successfully!');
      navigate(`/issues/${res.data.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to report issue'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    createMut.mutate({
      ...form,
      citizenId: user?.userId,
      citizenName: user?.name,
      latitude: position?.lat,
      longitude: position?.lng,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Report an Issue" description="Help your community by reporting environmental problems" />
        <form onSubmit={handleSubmit}>
          <Card className="space-y-5">
            <Field label="Issue Title *" error={errors.title}>
              <input className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                placeholder="e.g. Illegal dumping near river" value={form.title} onChange={set('title')} />
            </Field>

            <Field label="Issue Type *" error={errors.type}>
              <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={form.type} onChange={set('type')}>
                <option value="">Select type…</option>
                {ISSUE_TYPES.map(t => <option key={t} value={t}>{labelify(t)}</option>)}
              </select>
            </Field>

            <Field label="Description *" error={errors.description}>
              <textarea rows={4} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                placeholder="Describe the issue in detail…" value={form.description} onChange={set('description')} />
            </Field>

            <Field label="Location (address or landmark)">
              <input className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                placeholder="e.g. Near Greenfield Park" value={form.location} onChange={set('location')} />
            </Field>

            <Field label="Pin on Map * (click to mark location)" error={errors.location}>
              <div className="h-64 rounded-xl overflow-hidden border border-bark-400/20">
                <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker position={position} onPick={(latlng) => setPosition(latlng)} />
                </MapContainer>
              </div>
              {position && (
                <p className="text-xs text-bark-400 mt-1">
                  Selected: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                </p>
              )}
            </Field>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancel</Button>
              <Button type="submit" loading={createMut.isPending}>Submit Report</Button>
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}

