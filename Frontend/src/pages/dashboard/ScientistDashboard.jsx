import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import KpiCard from '../../components/dashboard/KpiCard';
import SectionHeading from '../../components/dashboard/SectionHeading';
import TipCard from '../../components/dashboard/TipCard';
import { CHART_COLORS } from '../../components/dashboard/constants';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../utils/constants';
import * as sensorsApi from '../../api/sensorsApi';

export default function ScientistDashboard() {
  const { user } = useAuth();

  const [sensors, setSensors] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [analyses, setAnalyses] = useState([]);

  useEffect(() => {
    sensorsApi.getSensors().then(r => setSensors(r.data)).catch(() => setSensors([]));
    sensorsApi.getSensorData().then(r => setSensorData(r.data)).catch(() => setSensorData([]));
    sensorsApi.getAnalyses().then(r => setAnalyses(r.data)).catch(() => setAnalyses([]));
  }, []);

  const activeSensors = sensors.filter(s => s.status === 'ACTIVE').length;
  const pendingAnalyses = analyses.filter(a => a.status === 'PENDING').length;
  const flaggedAnalyses = analyses.filter(a => a.status === 'FLAGGED').length;
  const reviewedAnalyses = analyses.filter(a => a.status === 'REVIEWED').length;

  const sensorsByType = Object.entries(
    sensors.reduce((acc, s) => { acc[s.type] = (acc[s.type] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const sensorsByStatus = Object.entries(
    sensors.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const analysisStatusData = [
    { name: 'Pending',  value: pendingAnalyses },
    { name: 'Reviewed', value: reviewedAnalyses },
    { name: 'Flagged',  value: flaggedAnalyses },
  ].filter(d => d.value > 0);

  return (
    <DashboardLayout>
      <PageHeader
        emoji="🔬"
        title={`Welcome back, ${user?.name || ''}`}
        description={`${ROLE_LABELS.SCIENTIST} Dashboard`}
      />

      {/* Analysis Workload Overview */}
      <SectionHeading emoji="🔬" title="Analysis Workload" subtitle="Your pending reviews and findings" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard emoji="📋" label="Total Analyses" value={analyses.length} sub="All records" bg="bg-purple-50" glow="hover:shadow-purple-200/60" />
        <KpiCard emoji="⏳" label="Pending" value={pendingAnalyses} sub="Awaiting review" bg="bg-yellow-50" glow="hover:shadow-yellow-200/60" />
        <KpiCard emoji="⚠️" label="Flagged" value={flaggedAnalyses} sub="Violations detected" bg="bg-orange-50" glow="hover:shadow-orange-200/60" />
        <KpiCard emoji="✅" label="Reviewed" value={reviewedAnalyses} sub="Completed reviews" bg="bg-green-50" glow="hover:shadow-green-200/60" />
      </div>

      {/* Quick Action Card for Analysis */}
      {(pendingAnalyses + flaggedAnalyses) > 0 && (
        <Card className="border-l-4 border-l-forest-500 bg-forest-50/50 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center">
                <AlertTriangle size={18} className="text-forest-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-bark-800">
                  {pendingAnalyses} pending review
                </p>
                <p className="text-xs text-bark-400">Review your assigned analyses to keep the network running smoothly.</p>
              </div>
            </div>
            <Link to="/analysis"
              className="inline-flex items-center gap-1 px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap">
              <span>Review now</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </Card>
      )}

      {/* Sensor Network Overview */}
      <SectionHeading emoji="📊" title="Sensor Network at a Glance" subtitle="Live status across the deployed sensor fleet" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard emoji="📡" label="Active Sensors" value={activeSensors} sub={`${sensors.length} total`} bg="bg-sky-50" glow="hover:shadow-sky-200/60" />
        <KpiCard emoji="💧" label="Data Records" value={sensorData.length} sub="Total readings" bg="bg-blue-50" glow="hover:shadow-blue-200/60" />
        <KpiCard emoji="🛠️" label="Maintenance" value={sensors.filter(s => s.status === 'MAINTENANCE').length} sub="Under maintenance" bg="bg-yellow-50" glow="hover:shadow-yellow-200/60" />
        <KpiCard emoji="🚫" label="Inactive" value={sensors.filter(s => s.status === 'INACTIVE').length} sub="Not operational" bg="bg-red-50" glow="hover:shadow-red-200/60" />
      </div>

      <div className="mb-6">
        <TipCard
          emoji="🔬"
          title="Tip: Cross-reference anomalies"
          body="When a sensor shows unusual readings, compare it with neighboring sensors and historical baselines before marking as anomaly in your analysis."
        />
      </div>

      {/* Analytics Section */}
      <SectionHeading emoji="📈" title="Network Analytics" subtitle="Sensor distribution and operational status" />
      <div className="grid lg:grid-cols-3 gap-6">
        {sensorsByType.length > 0 && (
          <Card>
            <h3 className="font-semibold text-bark-800 mb-4">📡 Sensors by Type</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sensorsByType}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
        {sensorsByStatus.length > 0 && (
          <Card>
            <h3 className="font-semibold text-bark-800 mb-4">🟢 Sensors by Status</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={sensorsByStatus} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} innerRadius={35}>
                  {sensorsByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
        {analysisStatusData.length > 0 && (
          <Card>
            <h3 className="font-semibold text-bark-800 mb-4">📊 Analysis Status Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={analysisStatusData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} innerRadius={35}>
                  {analysisStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
