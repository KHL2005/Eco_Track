import { useState, useEffect } from 'react';
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

  // Fetch both lists when the page first loads
  useEffect(() => {
    fetchEmissions();
    fetchDocuments();
  }, []);

  async function fetchEmissions() {
    setLoadingE(true);
    setErrorE('');
    try {
      const response = await getEmissionsByIndustry(user.name);
      setEmissions(response.data);
    } catch (error) {
      setErrorE('Failed to load emissions.');
    } finally {
      setLoadingE(false);
    }
  }

  async function fetchDocuments() {
    setLoadingD(true);
    setErrorD('');
    try {
      const response = await getDocumentsByIndustry(user.name);
      setDocuments(response.data);
    } catch (error) {
      setErrorD('Failed to load documents.');
    } finally {
      setLoadingD(false);
    }
  }

  async function handleDeleteEmission(id) {
    await deleteEmission(id);
    fetchEmissions();
  }

  async function handleDeleteDocument(id) {
    await deleteDocument(id);
    fetchDocuments();
  }

  function handleNav(key) {
    setSection(key);
    setSidebarCollapsed(true);
  }

  // Compute overview stats from the emissions list
  const totalEmissions = emissions.length;
  const approvedEmissions = emissions.filter(e => e.status === 'APPROVED').length;
  const pendingEmissions = emissions.filter(e => e.status === 'SUBMITTED').length;
  const totalDocuments = documents.length;

  const sectionTitles = {
    overview: 'Overview',
    log: 'Log Emission',
    emissions: 'My Emissions',
    documents: 'My Documents',
  };

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar items={NAV} activeKey={section} onSelect={handleNav} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)} />

      <div className="lg:ml-20 transition-all duration-300">
        <TopBar title={sectionTitles[section]} onMenuToggle={() => setSidebarCollapsed(c => !c)} />

        <main className="p-4 sm:p-6 max-w-6xl mx-auto">

          {/* OVERVIEW — four stat cards */}
          {section === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

              <div className="bg-white rounded-2xl shadow-md p-5 flex items-center gap-4 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl">💨</div>
                <div>
                  <p className="text-2xl font-bold text-text">{loadingE ? '…' : totalEmissions}</p>
                  <p className="text-xs text-text-muted">Total Emissions</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-5 flex items-center gap-4 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-accent flex items-center justify-center text-xl">✅</div>
                <div>
                  <p className="text-2xl font-bold text-text">{loadingE ? '…' : approvedEmissions}</p>
                  <p className="text-xs text-text-muted">Approved</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-5 flex items-center gap-4 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber to-yellow-400 flex items-center justify-center text-xl">⏳</div>
                <div>
                  <p className="text-2xl font-bold text-text">{loadingE ? '…' : pendingEmissions}</p>
                  <p className="text-xs text-text-muted">Pending</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-md p-5 flex items-center gap-4 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-xl">📄</div>
                <div>
                  <p className="text-2xl font-bold text-text">{loadingD ? '…' : totalDocuments}</p>
                  <p className="text-xs text-text-muted">Documents</p>
                </div>
              </div>

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
