import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllEmissions, updateEmissionStatus, getAllDocuments, updateDocumentStatus } from '../api/officerApi';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import EmissionTable from '../components/EmissionTable';
import DocumentTable from '../components/DocumentTable';
import { SkeletonRows, ErrorBanner } from '../components/Feedback';

const NAV = [
  { key: 'overview',  icon: '🏠', label: 'Overview' },
  { key: 'emissions', icon: '💨', label: 'Review Emissions' },
  { key: 'documents', icon: '📄', label: 'Review Documents' },
];

const STATUS_FILTERS = ['ALL', 'SUBMITTED', 'APPROVED', 'REJECTED'];

export default function OfficerDashboard() {
  const { token } = useAuth();
  const [section, setSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const [emissions, setEmissions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingE, setLoadingE] = useState(true);
  const [loadingD, setLoadingD] = useState(true);
  const [errorE, setErrorE] = useState('');
  const [errorD, setErrorD] = useState('');

  // Filters
  const [statusFilterE, setStatusFilterE] = useState('ALL');
  const [searchE, setSearchE] = useState('');
  const [statusFilterD, setStatusFilterD] = useState('ALL');
  const [searchD, setSearchD] = useState('');

  const fetchEmissions = useCallback(async () => {
    setLoadingE(true); setErrorE('');
    try { const { data } = await getAllEmissions(token); setEmissions(data); }
    catch { setErrorE('Failed to load emissions.'); }
    finally { setLoadingE(false); }
  }, [token]);

  const fetchDocuments = useCallback(async () => {
    setLoadingD(true); setErrorD('');
    try { const { data } = await getAllDocuments(token); setDocuments(data); }
    catch { setErrorD('Failed to load documents.'); }
    finally { setLoadingD(false); }
  }, [token]);

  useEffect(() => { fetchEmissions(); fetchDocuments(); }, [fetchEmissions, fetchDocuments]);

  const handleApproveEmission = async (id) => { await updateEmissionStatus(id, 'APPROVED', token); fetchEmissions(); };
  const handleRejectEmission = async (id) => { await updateEmissionStatus(id, 'REJECTED', token); fetchEmissions(); };
  const handleApproveDoc = async (id) => { await updateDocumentStatus(id, 'APPROVED', token); fetchDocuments(); };
  const handleRejectDoc = async (id) => { await updateDocumentStatus(id, 'REJECTED', token); fetchDocuments(); };

  const handleNav = (key) => { setSection(key); setSidebarCollapsed(true); };

  // Filtered data
  const filteredE = emissions
    .filter(e => statusFilterE === 'ALL' || e.status === statusFilterE)
    .filter(e => !searchE || e.industryName.toLowerCase().includes(searchE.toLowerCase()));

  const filteredD = documents
    .filter(d => statusFilterD === 'ALL' || d.verificationStatus === statusFilterD)
    .filter(d => !searchD || d.industryName.toLowerCase().includes(searchD.toLowerCase()));

  // Stats
  const totalSub = emissions.length + documents.length;
  const pending = emissions.filter(e => e.status === 'SUBMITTED').length + documents.filter(d => d.verificationStatus === 'SUBMITTED').length;
  const approved = emissions.filter(e => e.status === 'APPROVED').length + documents.filter(d => d.verificationStatus === 'APPROVED').length;
  const rejected = emissions.filter(e => e.status === 'REJECTED').length + documents.filter(d => d.verificationStatus === 'REJECTED').length;

  const sectionTitles = { overview: 'Overview', emissions: 'Review Emissions', documents: 'Review Documents' };

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar items={NAV} activeKey={section} onSelect={handleNav} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />

      <div className="lg:ml-20 transition-all duration-300">
        <TopBar title={sectionTitles[section]} onMenuToggle={() => setSidebarCollapsed(c => !c)} />

        <main className="p-4 sm:p-6 max-w-7xl mx-auto">
          {/* OVERVIEW */}
          {section === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Submissions', value: totalSub, icon: '📊', color: 'from-primary to-accent' },
                { label: 'Pending Review', value: pending, icon: '⏳', color: 'from-amber to-yellow-400' },
                { label: 'Approved', value: approved, icon: '✅', color: 'from-green-400 to-accent' },
                { label: 'Rejected', value: rejected, icon: '❌', color: 'from-error to-red-400' },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-2xl shadow-md p-5 flex items-center gap-4 hover:shadow-lg transition-shadow">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-xl`}>
                    {c.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text">{loadingE || loadingD ? '…' : c.value}</p>
                    <p className="text-xs text-text-muted">{c.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* REVIEW EMISSIONS */}
          {section === 'emissions' && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-text mb-4">All Emissions</h2>
              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="text" value={searchE} onChange={(e) => setSearchE(e.target.value)}
                  placeholder="Search by company…"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <div className="flex gap-2 flex-wrap">
                  {STATUS_FILTERS.map(s => (
                    <button key={s} onClick={() => setStatusFilterE(s)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer
                        ${statusFilterE === s ? 'bg-primary text-white shadow-md' : 'bg-bg text-text-muted hover:bg-gray-200'}`}
                    >{s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}</button>
                  ))}
                </div>
              </div>
              {errorE && <ErrorBanner message={errorE} onRetry={fetchEmissions} />}
              {loadingE ? <SkeletonRows rows={6} cols={6} /> : (
                <EmissionTable emissions={filteredE} showCompany onApprove={handleApproveEmission} onReject={handleRejectEmission} />
              )}
            </div>
          )}

          {/* REVIEW DOCUMENTS */}
          {section === 'documents' && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-text mb-4">All Industry Documents</h2>
              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                  type="text" value={searchD} onChange={(e) => setSearchD(e.target.value)}
                  placeholder="Search by company…"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <div className="flex gap-2 flex-wrap">
                  {STATUS_FILTERS.map(s => (
                    <button key={s} onClick={() => setStatusFilterD(s)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer
                        ${statusFilterD === s ? 'bg-primary text-white shadow-md' : 'bg-bg text-text-muted hover:bg-gray-200'}`}
                    >{s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}</button>
                  ))}
                </div>
              </div>
              {errorD && <ErrorBanner message={errorD} onRetry={fetchDocuments} />}
              {loadingD ? <SkeletonRows rows={6} cols={6} /> : (
                <DocumentTable documents={filteredD} showCompany onApprove={handleApproveDoc} onReject={handleRejectDoc} />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

