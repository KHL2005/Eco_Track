import { useState, useEffect } from 'react';
import { Clock, TrendingUp, ShieldCheck, ClipboardList } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import KpiCard from '../../components/dashboard/KpiCard';
import SectionHeading from '../../components/dashboard/SectionHeading';
import { CHART_COLORS } from '../../components/dashboard/constants';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, COMPLIANCE_RESULTS, AUDIT_STATUSES } from '../../utils/constants';
import * as complianceApi from '../../api/complianceApi';
import * as emissionsApi from '../../api/emissionsApi';

export default function ComplianceDashboard() {
  const { user } = useAuth();

  // Lists fetched from the server
  const [complianceRecords, setComplianceRecords] = useState([]);
  const [auditsList, setAuditsList] = useState([]);
  const [emissions, setEmissions] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Fetch all lists when the page first loads
  useEffect(() => {
    fetchComplianceRecords();
    fetchAudits();
    fetchEmissions();
    fetchDocuments();
  }, []);

  async function fetchComplianceRecords() {
    try {
      const response = await complianceApi.getComplianceRecords();
      setComplianceRecords(response.data);
    } catch (error) {
      setComplianceRecords([]);
    }
  }

  async function fetchAudits() {
    try {
      const response = await complianceApi.getAudits();
      setAuditsList(response.data);
    } catch (error) {
      setAuditsList([]);
    }
  }

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

  // Count compliance records by result
  let compliantCount = 0;
  let nonCompliantCount = 0;
  for (const record of complianceRecords) {
    if (record.result === 'COMPLIANT') compliantCount += 1;
    if (record.result === 'NON_COMPLIANT') nonCompliantCount += 1;
  }

  // Count audits by status
  let completedAudits = 0;
  let inProgressAudits = 0;
  for (const audit of auditsList) {
    if (audit.status === 'COMPLETED') completedAudits += 1;
    if (audit.status === 'IN_PROGRESS') inProgressAudits += 1;
  }

  // Count emissions waiting for review
  let pendingEmissions = 0;
  for (const e of emissions) {
    if (e.status === 'SUBMITTED') pendingEmissions += 1;
  }

  // Count documents waiting for verification
  let pendingDocuments = 0;
  for (const d of documents) {
    if (d.verificationStatus === 'SUBMITTED') pendingDocuments += 1;
  }

  // Overall compliance rate (compliant / total). 0 when there are no records.
  let complianceRate = 0;
  if (complianceRecords.length > 0) {
    complianceRate = Math.round((compliantCount / complianceRecords.length) * 100);
  }

  // Build chart data: compliance records grouped by result
  const complianceByResult = [];
  for (const r of COMPLIANCE_RESULTS) {
    let count = 0;
    for (const record of complianceRecords) {
      if (record.result === r) count += 1;
    }
    if (count > 0) {
      complianceByResult.push({ name: r.replace(/_/g, ' '), value: count });
    }
  }

  // Build chart data: audits grouped by status
  const auditsByStatus = [];
  for (const s of AUDIT_STATUSES) {
    let count = 0;
    for (const audit of auditsList) {
      if (audit.status === s) count += 1;
    }
    if (count > 0) {
      auditsByStatus.push({ name: s, value: count });
    }
  }

  // Mixed/partial bucket size (everything that is neither compliant nor non-compliant)
  const otherCount = complianceRecords.length - compliantCount - nonCompliantCount;

  return (
    <DashboardLayout>
      <PageHeader
        emoji="🛡️"
        title={`Welcome back, ${user && user.name ? user.name : ''}`}
        description={`${ROLE_LABELS.COMPLIANCE_OFFICER} Dashboard`}
      />

      <div className="space-y-6">
        {/* Compliance rate banner */}
        <Card className="bg-gradient-to-r from-forest-600 to-emerald-500 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm mb-1">Overall Compliance Rate</p>
              <p className="text-5xl font-bold">{complianceRate}<span className="text-2xl font-normal">%</span></p>
              <p className="text-white/70 text-xs mt-2">
                {compliantCount} compliant · {nonCompliantCount} non-compliant · {otherCount} pending/partial
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <TrendingUp size={40} className="text-white/40" />
              <div className="w-32 bg-white/20 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-white"
                  style={{ width: `${complianceRate}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* KPI row */}
        <div>
          <SectionHeading emoji="📊" title="Key Metrics" subtitle="Live compliance and audit summary" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard emoji="🛡️" label="Compliance Records" value={complianceRecords.length} sub={`${compliantCount} compliant`} bg="bg-green-50" />
            <KpiCard emoji="✅" label="Compliant Entities" value={compliantCount} sub="Passed all checks" bg="bg-emerald-50" glow="hover:shadow-emerald-200/60" />
            <KpiCard emoji="📋" label="Total Audits" value={auditsList.length} sub={`${completedAudits} completed · ${inProgressAudits} in progress`} bg="bg-sky-50" glow="hover:shadow-sky-200/60" />
            <KpiCard emoji="⏳" label="Pending Emissions" value={pendingEmissions} sub="Awaiting your review" bg="bg-orange-50" glow="hover:shadow-orange-200/60" />
          </div>
        </div>

        {/* Charts */}
        <div>
          <SectionHeading emoji="📈" title="Analytics" subtitle="Distribution of compliance outcomes and audit progress" />
          <div className="grid lg:grid-cols-2 gap-6">
            {complianceByResult.length > 0 ? (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">🛡️ Compliance by Result</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={complianceByResult} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={85} innerRadius={35}>
                      {complianceByResult.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            ) : (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">🛡️ Compliance by Result</h3>
                <div className="flex flex-col items-center justify-center h-[260px] text-bark-400 text-sm gap-2">
                  <ShieldCheck size={32} className="opacity-30" />
                  No compliance records yet
                </div>
              </Card>
            )}

            {auditsByStatus.length > 0 ? (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">📋 Audits by Status</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={auditsByStatus} barCategoryGap="30%">
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            ) : (
              <Card>
                <h3 className="font-semibold text-bark-800 mb-4">📋 Audits by Status</h3>
                <div className="flex flex-col items-center justify-center h-[260px] text-bark-400 text-sm gap-2">
                  <ClipboardList size={32} className="opacity-30" />
                  No audits yet
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Pending emissions spotlight */}
        {pendingEmissions > 0 && (
          <Card className="border-l-4 border-l-orange-400 bg-orange-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center">
                <Clock size={18} className="text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-bark-800">
                  {pendingEmissions} emission{pendingEmissions > 1 ? 's' : ''} awaiting review
                </p>
                <p className="text-xs text-bark-400">Go to Emissions to approve or reject pending submissions.</p>
              </div>
            </div>
          </Card>
        )}

        {/* Pending documents spotlight */}
        {pendingDocuments > 0 && (
          <Card className="border-l-4 border-l-amber-400 bg-amber-50/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock size={18} className="text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-bark-800">
                  {pendingDocuments} document{pendingDocuments > 1 ? 's' : ''} awaiting review
                </p>
                <p className="text-xs text-bark-400">Go to Documents to verify or reject pending submissions.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
