import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEmissionsByIndustry, deleteEmission, getDocumentsByIndustry, deleteDocument } from '../api/emissionsApi';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import EmissionForm from '../components/EmissionForm';
import EmissionTable from '../components/EmissionTable';
import DocumentTable from '../components/DocumentTable';
import { SkeletonRows, ErrorBanner } from '../components/Feedback';

const NAV = [
  { key: 'overview',   icon: '🏠', label: 'Overview' },
  { key: 'log',        icon: '💨', label: 'Log Emission' },
  { key: 'emissions',  icon: '📋', label: 'My Emissions' },
  { key: 'documents',  icon: '📄', label: 'My Documents' },
];

export default function IndustryDashboard() {
  const { user } = useAuth();
  const [section, setSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [emissions, setEmissions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingE, setLoadingE] = useState(true);
  const [loadingD, setLoadingD] = useState(true);
  const [errorE, setErrorE] = useState('');
  const [errorD, setErrorD] = useState('');

  const fetchEmissions = useCallback(async () => {
    setLoadingE(true); setErrorE('');
    try {
      const { data } = await getEmissionsByIndustry(user.name);
      setEmissions(data);
    } catch { setErrorE('Failed to load emissions.'); }
    finally { setLoadingE(false); }
  }, [user.name]);

  const fetchDocuments = useCallback(async () => {
    setLoadingD(true); setErrorD('');
    try {
      const { data } = await getDocumentsByIndustry(user.name);
      setDocuments(data);
    } catch { setErrorD('Failed to load documents.'); }
    finally { setLoadingD(false); }
  }, [user.name]);

  useEffect(() => { fetchEmissions(); fetchDocuments(); }, [fetchEmissions, fetchDocuments]);

  const handleDeleteEmission = async (id) => {
    await deleteEmission(id);
    fetchEmissions();
  };

  const handleDeleteDocument = async (id) => {
    await deleteDocument(id);
    fetchDocuments();
  };

  const handleNav = (key) => { setSection(key); setSidebarCollapsed(true); };

  // Stats
  const totalE = emissions.length;
  const approvedE = emissions.filter(e => e.status === 'APPROVED').length;
  const pendingE = emissions.filter(e => e.status === 'SUBMITTED').length;
  const totalD = documents.length;

  const sectionTitles = { overview: 'Overview', log: 'Log Emission', emissions: 'My Emissions', documents: 'My Documents' };

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar items={NAV} activeKey={section} onSelect={handleNav} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />

      <div className="lg:ml-20 transition-all duration-300">
        <TopBar title={sectionTitles[section]} onMenuToggle={() => setSidebarCollapsed(c => !c)} />

        <main className="p-4 sm:p-6 max-w-6xl mx-auto">
          {/* OVERVIEW */}
          {section === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Emissions', value: totalE, icon: '💨', color: 'from-primary to-accent' },
                { label: 'Approved', value: approvedE, icon: '✅', color: 'from-green-400 to-accent' },
                { label: 'Pending', value: pendingE, icon: '⏳', color: 'from-amber to-yellow-400' },
                { label: 'Documents', value: totalD, icon: '📄', color: 'from-primary to-primary-dark' },
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

          {/* LOG EMISSION */}
          {section === 'log' && (
            <div className="max-w-lg">
              <EmissionForm onSuccess={fetchEmissions} />
            </div>
          )}

          {/* MY EMISSIONS */}
          {section === 'emissions' && (
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-text mb-4">My Emissions</h2>
              {errorE && <ErrorBanner message={errorE} onRetry={fetchEmissions} />}
              {loadingE ? <SkeletonRows rows={5} cols={5} /> : (
                <EmissionTable emissions={emissions} onDelete={handleDeleteEmission} />
              )}
            </div>
          )}

          {/* MY DOCUMENTS */}
          {section === 'documents' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-md p-6">
                <h2 className="text-lg font-bold text-text mb-4">My Documents</h2>
                {errorD && <ErrorBanner message={errorD} onRetry={fetchDocuments} />}
                {loadingD ? <SkeletonRows rows={5} cols={5} /> : (
                  <DocumentTable documents={documents} onDelete={handleDeleteDocument} />
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

