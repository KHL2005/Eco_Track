import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../layouts/DashboardLayout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { ArrowLeft, MapPin } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import * as sensorsApi from '../../api/sensorsApi';
import { formatDateTime } from '../../utils/formatters';

export default function SensorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: sensor, isLoading: sensorLoading } = useQuery({
    queryKey: ['sensor', id],
    queryFn: () => sensorsApi.getSensorById(id).then(r => r.data),
  });

  const { data: sensorData = [] } = useQuery({
    queryKey: ['sensorData', id],
    queryFn: () => sensorsApi.getDataBySensor(id).then(r => r.data).catch(() => []),
  });

  const { data: analyses = [] } = useQuery({
    queryKey: ['analyses', 'sensor', id],
    queryFn: () => sensorsApi.getAnalyses().then(r => r.data.filter(a => sensorData.some(d => d.id === a.dataId))).catch(() => []),
    enabled: sensorData.length > 0,
  });

  const chartData = [...sensorData]
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
    .slice(-50)
    .map(d => ({ time: formatDateTime(d.recordedAt), value: d.value, unit: d.unit }));

  if (sensorLoading) return <DashboardLayout><div className="animate-pulse h-64 bg-earth-100 rounded-2xl" /></DashboardLayout>;
  if (!sensor) return <DashboardLayout><p className="text-bark-400">Sensor not found.</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</Button>
        </div>

        <Card className="mb-4">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-bark-800 flex items-center gap-2"><span aria-hidden="true">📡</span> Sensor #{sensor.sensorId}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-bark-400">
                <span>Type: <strong className="text-bark-600">{sensor.type}</strong></span>
                {sensor.location && <span className="flex items-center gap-1"><MapPin size={13} />{sensor.location}</span>}
              </div>
            </div>
            <StatusBadge status={sensor.status} />
          </div>
        </Card>

        {/* Time-series chart */}
        <Card className="mb-4">
          <h3 className="font-semibold text-bark-800 mb-4">
            Sensor Readings — Last {chartData.length} data points
            {chartData[0]?.unit && <span className="text-sm font-normal text-bark-400 ml-2">({chartData[0].unit})</span>}
          </h3>
          {chartData.length === 0 ? (
            <p className="text-sm text-bark-400 py-8 text-center">No data recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Recent data table */}
        <Card>
          <h3 className="font-semibold text-bark-800 mb-4">Recent Readings ({sensorData.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bark-400/10">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-bark-400 uppercase">Data ID</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-bark-400 uppercase">Sensor ID</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-bark-400 uppercase">Value</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-bark-400 uppercase">Unit</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-bark-400 uppercase">Recorded At</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-bark-400 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bark-400/10">
                {sensorData.slice(0, 20).map(d => (
                  <tr key={d.id} className="hover:bg-earth-100/60">
                    <td className="py-2 px-3 font-medium text-xs">{d.id}</td>
                    <td className="py-2 px-3 font-medium text-xs">{d.sensorId || sensor.sensorId}</td>
                    <td className="py-2 px-3 font-medium">{d.value}</td>
                    <td className="py-2 px-3 text-bark-400">{d.unit}</td>
                    <td className="py-2 px-3 text-bark-400 text-xs">{formatDateTime(d.recordedAt)}</td>
                    <td className="py-2 px-3 text-bark-400 text-xs">{d.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

