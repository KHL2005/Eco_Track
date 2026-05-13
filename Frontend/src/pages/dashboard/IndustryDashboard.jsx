import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
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
import { ROLE_LABELS, EMISSION_TYPES, EMISSION_STATUSES } from '../../utils/constants';
import * as emissionsApi from '../../api/emissionsApi';

export default function IndustryDashboard() {
  const { user } = useAuth();

  // Lists fetched from the server
  const [emissions, setEmissions] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Fetch both lists when the page first loads
  useEffect(() => {
    fetchEmissions();
    fetchDocuments();
  }, []);

  async function fetchEmissions() {
    try {
      const response = await emissionsApi.getEmissions();
      setEmissions(response.data);
    } catch (error) {
      setEmissions([]);
    }
  }

  async function fetchDocuments() {
    try {
      const response = await emissionsApi.getDocuments();
      setDocuments(response.data);
    } catch (error) {
      setDocuments([]);
    }
  }

  // Count emissions by status
  let approvedEmissions = 0;
  let pendingEmissions = 0;
  for (const e of emissions) {
    if (e.status === 'APPROVED') approvedEmissions += 1;
    if (e.status === 'SUBMITTED') pendingEmissions += 1;
  }

  // Count documents that have been approved
  let approvedDocs = 0;
  for (const d of documents) {
    if (d.verificationStatus === 'APPROVED') approvedDocs += 1;
  }

  // Build chart data: emissions grouped by type
  const emissionsByType = [];
  for (const type of EMISSION_TYPES) {
    const count = emissions.filter(e => e.type === type).length;
    if (count > 0) {
      emissionsByType.push({ name: type, value: count });
    }
  }

  // Build chart data: emissions grouped by status
  const emissionsByStatus = [];
  for (const status of EMISSION_STATUSES) {
    const count = emissions.filter(e => e.status === status).length;
    if (count > 0) {
      emissionsByStatus.push({ name: status, value: count });
    }
  }

  return (
    <DashboardLayout>
      <PageHeader
        emoji="🏭"
        title={`Welcome back, ${user?.name || ''}`}
        description={`${ROLE_LABELS.INDUSTRY} Dashboard`}
      />

      <SectionHeading emoji="📊" title="Compliance overview" subtitle="Your emissions and document submission status" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard emoji="🏭" label="Emissions Logged" value={emissions.length} sub={`${approvedEmissions} approved`} bg="bg-purple-50" glow="hover:shadow-purple-200/60" />
        <KpiCard emoji="✅" label="Approved Emissions" value={approvedEmissions} sub="Verified by compliance" bg="bg-green-50" />
        <KpiCard emoji="⏳" label="Pending Review" value={pendingEmissions} sub="Awaiting verification" bg={pendingEmissions > 0 ? "bg-orange-50" : "bg-green-50"} glow={pendingEmissions > 0 ? "hover:shadow-orange-200/60" : "hover:shadow-green-200/60"} />
        <KpiCard emoji="📄" label="Documents" value={documents.length} sub={`${approvedDocs} verified`} bg="bg-sky-50" glow="hover:shadow-sky-200/60" />
      </div>

      <div className="mb-6 space-y-3">
        <TipCard
          emoji="📌"
          title="Stay ahead of audits"
          body="Submit emissions and supporting documents promptly. Pending items can hold up your quarterly compliance score."
        />
        {pendingEmissions > 0 && (
          <Card className="border-l-4 border-l-orange-400 bg-orange-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock size={18} className="text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-bark-800">
                  {pendingEmissions} emission{pendingEmissions > 1 ? 's' : ''} pending review
                </p>
                <p className="text-xs text-bark-400">Your submission is awaiting verification by a compliance officer.</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      <SectionHeading emoji="📈" title="Analytics" subtitle="Distribution of your emissions" />
      <div className="grid lg:grid-cols-2 gap-6">
        {emissionsByType.length > 0 ? (
          <Card>
            <h3 className="font-semibold text-bark-800 mb-4">🏭 Emissions by Type</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={emissionsByType}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card>
            <h3 className="font-semibold text-bark-800 mb-4">🏭 Emissions by Type</h3>
            <div className="flex items-center justify-center h-[260px] text-bark-400 text-sm">No emissions logged yet</div>
          </Card>
        )}
        {emissionsByStatus.length > 0 ? (
          <Card>
            <h3 className="font-semibold text-bark-800 mb-4">🟢 Emissions by Status</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={emissionsByStatus} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} innerRadius={35}>
                  {emissionsByStatus.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        ) : (
          <Card>
            <h3 className="font-semibold text-bark-800 mb-4">🟢 Emissions by Status</h3>
            <div className="flex items-center justify-center h-[260px] text-bark-400 text-sm">No data available</div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
