import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { Plus, FileText, Download, Trash2, AlertCircle } from 'lucide-react';
import * as reportsApi from '../../api/reportsApi';
import * as projectsApi from '../../api/projectsApi';
import * as issuesApi from '../../api/issuesApi';
import { useRole } from '../../hooks/useRole';
import { formatDateTime } from '../../utils/formatters';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { isAdmin, isAgencyOfficer } = useRole();
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
   const [deleteConfirm, setDeleteConfirm] = useState(null);
   // Single scope filter: 'PROJECT' or 'ISSUE'
   const [filterScope, setFilterScope] = useState('');
   const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  const [selectedProjectImpact, setSelectedProjectImpact] = useState(null);

  const [form, setForm] = useState({ scope: 'PROJECT', projectId: '', issueId: '' });
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const canViewReports = isAdmin || isAgencyOfficer;
  const canGenerateReports = isAdmin || isAgencyOfficer;
  const canDeleteReports = isAdmin || isAgencyOfficer;

  // Load reports
  async function loadReports() {
    if (!canViewReports) return;
    setIsLoading(true);
    try {
      const res = await reportsApi.getReports();
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load reports');
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }

  // Load projects and issues
  async function loadProjects() {
    try {
      const res = await projectsApi.getProjects();
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    }
  }

  async function loadIssues() {
    try {
      const res = await issuesApi.getIssues();
      setIssues(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load issues:', error);
      setIssues([]);
    }
  }

  useEffect(() => {
    loadReports();
    loadProjects();
    loadIssues();
  }, [canViewReports]);

   // Apply client-side filter by scope only
   const displayedReports = reports.filter((r) => {
     if (!filterScope) return true; // Show all if no filter
     return r.scope === filterScope;
   });

  // Handle scope change
  const handleScopeChange = (e) => {
    setForm({ scope: e.target.value, projectId: '', issueId: '' });
  };

  // Handle project/issue selection
  const handleSelectionChange = (e) => {
    const field = form.scope === 'PROJECT' ? 'projectId' : 'issueId';
    setForm(f => ({ ...f, [field]: e.target.value }));
  };

   // Generate report
   const handleGenerateReport = async () => {
     const entityId = form.scope === 'PROJECT' ? form.projectId : form.issueId;
     if (!entityId) {
       toast.error(`Please select a ${form.scope.toLowerCase()}`);
       return;
     }

     // Validate that the issue still exists (not deleted)
     if (form.scope === 'ISSUE') {
       try {
         await issuesApi.getIssueById(entityId);
       } catch (err) {
         toast.error('The selected issue no longer exists or has been deleted');
         return;
       }
     }

     // Validate that the project still exists
     if (form.scope === 'PROJECT') {
       try {
         await projectsApi.getProjectById(entityId);
       } catch (err) {
         toast.error('The selected project no longer exists or has been deleted');
         return;
       }
     }

     setCreateLoading(true);
     try {
       const payload = {
         scope: form.scope,
         [form.scope === 'PROJECT' ? 'projectId' : 'issueId']: parseInt(entityId),
       };
       await reportsApi.createReport(payload);
       await loadReports();
       toast.success('Report generated successfully');
       setModal(false);
       setForm({ scope: 'PROJECT', projectId: '', issueId: '' });
     } catch (err) {
       toast.error(err.response?.data?.message || 'Failed to generate report');
     } finally {
       setCreateLoading(false);
     }
   };

    // Download report as file
    const handleDownloadReport = async (report) => {
      // If project-scoped report, try to include impact details
       let projectDetails = null;
       let projectImpact = null;
      if (report.scope === 'PROJECT' && report.projectId) {
        try {
          const p = await projectsApi.getProjectById(report.projectId);
          projectDetails = p.data;
        } catch (e) {
          console.error('Failed to fetch project details:', e);
        }
        try {
          const imp = await projectsApi.getImpactByProject(report.projectId);
           projectImpact = imp.data?.metrics || null;
        } catch (e) {
          console.error('Failed to fetch impact data:', e);
        }
      }
       // If no impact data returned, show a safe fallback (zeros + note) so exported reports never have an empty Impact section
       if (report.scope === 'PROJECT' && report.projectId && !projectImpact) {
         projectImpact = {
           treesPlanted: 0,
           co2ReducedTons: 0,
           areaRestoredHectares: 0,
           waterBodiesCleaned: 0,
           peopleBenefited: 0,
           notes: 'No recorded impact metrics for this project.'
         };
       }
     const htmlContent = `
     <!DOCTYPE html>
     <html lang="en">
     <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>${report.title}</title>
       <style>
         * { margin: 0; padding: 0; box-sizing: border-box; }
         body {
           font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
           line-height: 1.6;
           color: #333;
           background: #f5f5f5;
         }
         .container {
           max-width: 900px;
           margin: 0 auto;
           background: white;
           padding: 40px;
           box-shadow: 0 2px 10px rgba(0,0,0,0.1);
         }
         header {
           border-bottom: 3px solid #1f7a4a;
           padding-bottom: 20px;
           margin-bottom: 30px;
         }
         h1 {
           color: #1f7a4a;
           font-size: 28px;
           margin-bottom: 10px;
         }
         h2 {
           color: #1f7a4a;
           font-size: 20px;
           margin-top: 25px;
           margin-bottom: 15px;
         }
         .description {
           color: #666;
           font-size: 14px;
           margin-bottom: 20px;
         }
         .metadata {
           display: grid;
           grid-template-columns: 1fr 1fr;
           gap: 20px;
           background: #f0f9f6;
           padding: 20px;
           border-radius: 8px;
           margin-bottom: 30px;
           border-left: 4px solid #1f7a4a;
         }
         .metadata-item {
           display: flex;
           flex-direction: column;
         }
         .metadata-label {
           font-weight: 600;
           color: #1f7a4a;
           font-size: 12px;
           text-transform: uppercase;
           letter-spacing: 0.5px;
           margin-bottom: 5px;
         }
         .metadata-value {
           font-size: 14px;
           color: #333;
         }
         .content-section {
           margin-bottom: 30px;
         }
         .section-title {
           font-size: 16px;
           font-weight: 600;
           color: #1f7a4a;
           margin-bottom: 15px;
           text-transform: uppercase;
           letter-spacing: 0.5px;
           padding-bottom: 10px;
           border-bottom: 2px solid #e0e0e0;
         }
         .report-content {
           background: #f5f5f5;
           padding: 20px;
           border-radius: 8px;
           border-left: 4px solid #1f7a4a;
           font-family: 'Courier New', monospace;
           font-size: 13px;
           overflow-x: auto;
           white-space: pre-wrap;
           word-wrap: break-word;
           max-height: 600px;
           overflow-y: auto;
           line-height: 1.5;
         }
         .impact-metrics {
           display: grid;
           grid-template-columns: 1fr 1fr;
           gap: 15px;
           margin-bottom: 15px;
         }
         .impact-item {
           background: white;
           padding: 15px;
           border-radius: 6px;
           border-left: 4px solid #16a34a;
         }
         .impact-label {
           font-size: 12px;
           color: #666;
           text-transform: uppercase;
           font-weight: 600;
           margin-bottom: 5px;
           letter-spacing: 0.5px;
         }
         .impact-value {
           font-size: 24px;
           font-weight: bold;
           color: #1f7a4a;
         }
         .impact-unit {
           font-size: 12px;
           color: #999;
           margin-top: 3px;
         }
         .impact-notes {
           background: #f9fdf8;
           padding: 12px;
           border-radius: 6px;
           border-left: 3px solid #16a34a;
           font-size: 13px;
           color: #555;
           font-style: italic;
           margin-top: 10px;
         }
         footer {
           margin-top: 50px;
           padding-top: 20px;
           border-top: 1px solid #ddd;
           text-align: center;
           font-size: 12px;
           color: #999;
         }
         .eco-badge {
           display: inline-block;
           background: #1f7a4a;
           color: white;
           padding: 8px 12px;
           border-radius: 5px;
           font-size: 12px;
           font-weight: 600;
           margin-right: 10px;
         }
         @media print {
           body { background: white; }
           .container { box-shadow: none; max-width: 100%; }
         }
       </style>
     </head>
     <body>
       <div class="container">
         <header>
           <h1>🌍 ${report.title}</h1>
           ${report.description ? `<p class="description">${report.description}</p>` : ''}
         </header>

         <div class="metadata">
           <div class="metadata-item">
             <span class="metadata-label">Report ID</span>
             <span class="metadata-value">#${report.reportId}</span>
           </div>
           <div class="metadata-item">
             <span class="metadata-label">Scope</span>
             <span class="metadata-value"><span class="eco-badge">${report.scope}</span></span>
           </div>
           <div class="metadata-item">
             <span class="metadata-label">Generated Date</span>
             <span class="metadata-value">${formatDateTime(report.generatedDate)}</span>
           </div>
           <div class="metadata-item">
             <span class="metadata-label">Generated By</span>
             <span class="metadata-value">EcoTrack System</span>
           </div>
         </div>

          ${projectImpact ? `
          <div class="content-section">
            <h2 class="section-title">🌿 Environmental Impact Summary</h2>
            <div class="impact-metrics">
              ${projectImpact.treesPlanted != null ? `
              <div class="impact-item">
                <div class="impact-label">🌳 Trees Planted</div>
                <div class="impact-value">${projectImpact.treesPlanted.toLocaleString()}</div>
                <div class="impact-unit">number of trees</div>
              </div>
              ` : ''}
              ${projectImpact.co2ReducedTons != null ? `
              <div class="impact-item">
                <div class="impact-label">💨 CO₂ Reduced</div>
                <div class="impact-value">${projectImpact.co2ReducedTons.toLocaleString()}</div>
                <div class="impact-unit">metric tons</div>
              </div>
              ` : ''}
              ${projectImpact.waterBodiesCleaned != null ? `
              <div class="impact-item">
                <div class="impact-label">💧 Water Bodies Cleaned</div>
                <div class="impact-value">${projectImpact.waterBodiesCleaned.toLocaleString()}</div>
                <div class="impact-unit">count</div>
              </div>
              ` : ''}
              ${projectImpact.areaRestoredHectares != null ? `
              <div class="impact-item">
                <div class="impact-label">🌱 Area Restored</div>
                <div class="impact-value">${projectImpact.areaRestoredHectares.toLocaleString()}</div>
                <div class="impact-unit">hectares</div>
              </div>
              ` : ''}
              ${projectImpact.peopleBenefited != null ? `
              <div class="impact-item">
                <div class="impact-label">👥 People Benefited</div>
                <div class="impact-value">${projectImpact.peopleBenefited.toLocaleString()}</div>
                <div class="impact-unit">people impacted</div>
              </div>
              ` : ''}
            </div>
            ${projectImpact.notes ? `<div class="impact-notes">📝 <strong>Notes:</strong> ${projectImpact.notes}</div>` : ''}
          </div>
          ` : ''}

         <div class="content-section">
           <h2 class="section-title">📋 Report Details</h2>
           <div class="report-content">${report.metrics}</div>
         </div>

         ${projectDetails ? `
         <div class="content-section">
           <h2 class="section-title">🌳 Project Summary</h2>
           <div class="report-content">
             <strong>${projectDetails.title}</strong><br/>
             ${projectDetails.description || ''}<br/>
             Timeline: ${projectDetails.startDate || '—'} → ${projectDetails.endDate || 'Ongoing'}<br/>
             Budget: ${projectDetails.budget != null ? projectDetails.budget : '—'}
           </div>
         </div>
         ` : ''}

         <footer>
           <p>📄 Report ID: ${report.reportId} | 🕐 Generated: ${new Date().toLocaleString()}</p>
           <p style="margin-top: 10px; color: #ccc;">This is an official EcoTrack sustainability report. Please handle with appropriate care.</p>
         </footer>
       </div>
     </body>
     </html>
     `;

     const blob = new Blob([htmlContent], { type: 'text/html' });
     const url = window.URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `Report-${report.reportId}-${new Date().toISOString().split('T')[0]}.html`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     window.URL.revokeObjectURL(url);
   };

  // Delete report
  const handleDeleteReport = async (id) => {
    try {
      await reportsApi.deleteReport(id);
      await loadReports();
      toast.success('Report deleted successfully');
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete report');
    }
  };

    const openView = async (r) => {
      setSelectedReport(r);
      setViewModal(true);
      setSelectedProjectDetails(null);
      setSelectedProjectImpact(null);
      if (r.scope === 'PROJECT' && r.projectId) {
        try {
          const proj = await projectsApi.getProjectById(r.projectId);
          setSelectedProjectDetails(proj.data || null);
        } catch {
          setSelectedProjectDetails(null);
        }
         try {
           const impactRes = await projectsApi.getImpactByProject(r.projectId);
           setSelectedProjectImpact(impactRes.data?.metrics || null);
         } catch {
           // If backend has no impact record, populate a default object so the UI shows a meaningful Impact Summary instead of nothing
           setSelectedProjectImpact({
             treesPlanted: 0,
             co2ReducedTons: 0,
             areaRestoredHectares: 0,
             waterBodiesCleaned: 0,
             peopleBenefited: 0,
             notes: 'No recorded impact metrics for this project.'
           });
         }
      }
    };

    const columns = [
     {
       key: 'reportId',
       label: '#',
       render: r => <span className="text-xs font-semibold text-forest-600">#{r.reportId}</span>
     },
     {
       key: 'title',
       label: 'Title',
       render: r => <span className="text-sm font-medium text-bark-800">{r.title}</span>
     },
     {
       key: 'scope',
       label: 'Scope',
       render: r => <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">{r.scope}</span>
     },
     {
       key: 'generatedDate',
       label: 'Generated',
       render: r => <span className="text-xs text-bark-600 font-medium">{formatDateTime(r.generatedDate)}</span>
     },
     {
       label: 'Actions',
        render: r => (
          <div className="flex gap-2">
            <button
              onClick={() => openView(r)}
              className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-forest-600 hover:bg-forest-100 transition-colors border border-transparent hover:border-forest-300 cursor-pointer"
            >
              <FileText size={14} className="transition-colors group-hover:text-forest-800" />
              <span className="group-hover:text-forest-800">View</span>
            </button>
           {canDeleteReports && (
             <button
               onClick={() => setDeleteConfirm(r.reportId)}
               className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors border border-transparent hover:border-red-300"
               title="Delete report"
             >
               <Trash2 size={14} /> Delete
             </button>
           )}
         </div>
       )
     },
   ];

  return (
    <DashboardLayout>
      <PageHeader
        emoji="📜"
        title="Reports & Analytics"
        description="Generate, view, and manage environmental sustainability reports"
        action={
          canGenerateReports && (
            <Button onClick={() => setModal(true)} className="flex items-center gap-2">
              <Plus size={16} /> Generate Report
            </Button>
          )
        }
      />

        {!canViewReports ? (
          <div className="bg-white rounded-2xl border border-bark-400/10 p-8 text-center">
            <AlertCircle size={40} className="mx-auto text-bark-300 mb-3" />
            <h3 className="text-bark-700 font-medium mb-1">Access Denied</h3>
            <p className="text-sm text-bark-500">You don't have permission to view reports. Only administrators and agency officers can access this page.</p>
          </div>
        ) : (
        <div className="space-y-4">
            {/* Single scope filter dropdown */}
            <div className="flex gap-3 items-center mb-2">
              <div className="text-sm">
                <label className="block text-xs text-bark-600">Filter by Scope</label>
                <select
                  value={filterScope}
                  onChange={e => setFilterScope(e.target.value)}
                  className="border border-bark-300 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="">All Reports</option>
                  <option value="PROJECT">🌳 Projects</option>
                  <option value="ISSUE">⚠️ Issues</option>
                </select>
              </div>
              <div className="ml-auto text-sm text-bark-500 self-end pb-2">Showing {displayedReports.length} of {reports.length}</div>
            </div>
           <div className="bg-white rounded-2xl border border-bark-400/10 p-4 shadow-sm">
              {isLoading ? (
              <div className="text-center py-8 text-bark-500">Loading reports...</div>
              ) : displayedReports.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle size={40} className="mx-auto text-bark-300 mb-3" />
                <h3 className="text-bark-700 font-medium mb-1">No reports yet</h3>
                <p className="text-sm text-bark-500">Generate your first report to get started</p>
              </div>
              ) : (
                <DataTable columns={columns} data={displayedReports} searchable={false} />
              )}
          </div>
        </div>
      )}

       {/* Generate Report Modal */}
       <Modal open={modal} onClose={() => setModal(false)} title="Generate Report" size="md">
         <div className="space-y-4">
           <div className="bg-green-50 border border-green-200 rounded-lg p-3">
             <p className="text-xs text-green-900 font-semibold">📋 Quick Report Generation</p>
             <p className="text-xs text-green-800 mt-1">Select a scope and entity to generate a comprehensive report</p>
           </div>

           <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
             <p className="text-xs text-yellow-900 font-semibold">⚠️ Uniqueness Constraint</p>
             <p className="text-xs text-yellow-800 mt-1">Only one report can exist per project or issue. If a report already exists for your selection, you must delete it first before generating a new one.</p>
           </div>

           <div>
             <label className="block text-sm font-semibold text-bark-700 mb-2">Scope</label>
             <select
               value={form.scope}
               onChange={handleScopeChange}
               className="w-full border-2 border-bark-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 bg-white"
             >
               <option value="PROJECT">🌳 Project Report</option>
               <option value="ISSUE">⚠️ Issue Report</option>
             </select>
           </div>

           {form.scope === 'PROJECT' && (
             <div>
               <label className="block text-sm font-semibold text-bark-700 mb-2">Select Project</label>
               <select
                 value={form.projectId}
                 onChange={handleSelectionChange}
                 className="w-full border-2 border-bark-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 bg-white"
               >
                 <option value="">-- Choose a project --</option>
                 {projects.map(p => (
                   <option key={p.projectId} value={p.projectId}>
                     {p.title}
                   </option>
                 ))}
               </select>
               {projects.length === 0 && (
                 <p className="text-xs text-amber-600 mt-2">No projects available</p>
               )}
             </div>
           )}

            {form.scope === 'ISSUE' && (
              <div>
                <label className="block text-sm font-semibold text-bark-700 mb-2">Select Issue</label>
                <select
                  value={form.issueId}
                  onChange={handleSelectionChange}
                  className="w-full border-2 border-bark-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 bg-white"
                >
                  <option value="">-- Choose an issue --</option>
                  {issues
                    .filter(i => !i.deletionReason)
                    .map(i => (
                      <option key={i.issueId} value={i.issueId}>
                        Issue #{i.issueId} - {i.type}
                      </option>
                    ))}
                </select>
                {issues.filter(i => !i.deletionReason).length === 0 && (
                  <p className="text-xs text-amber-600 mt-2">No available issues</p>
                )}
              </div>
            )}

           <div className="flex gap-2 justify-end pt-2 border-t border-bark-200">
             <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
             <Button onClick={handleGenerateReport} loading={createLoading} className="bg-green-600 hover:bg-green-700">Generate Report</Button>
           </div>
         </div>
       </Modal>

       {/* View Report Modal */}
       <Modal open={viewModal} onClose={() => setViewModal(false)} title={selectedReport ? `Report #${selectedReport.reportId}` : 'Report'} size="lg">
         {selectedReport && (
           <div className="space-y-4">
             {/* Report Header */}
             <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
               <h3 className="text-lg font-bold text-green-900 mb-2">{selectedReport.title}</h3>
               {selectedReport.description && (
                 <p className="text-sm text-green-800">{selectedReport.description}</p>
               )}
             </div>

          <div className="metadata">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold mb-1">Report ID</p>
              <p className="text-sm font-bold text-blue-900">#{selectedReport.reportId}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-600 font-semibold mb-1">Scope</p>
              <p className="text-sm font-bold text-purple-900">{selectedReport.scope}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
              <p className="text-xs text-indigo-600 font-semibold mb-1">Generated Date</p>
              <p className="text-sm font-bold text-indigo-900">{new Date(selectedReport.generatedDate).toLocaleDateString()}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-600 font-semibold mb-1">Generated Time</p>
              <p className="text-sm font-bold text-amber-900">{new Date(selectedReport.generatedDate).toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Environmental Impact - Prominent Display */}
          {selectedReport.scope === 'PROJECT' && (
            <div>
              {selectedProjectImpact ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <h4 className="text-sm font-bold text-green-900 mb-4 flex items-center gap-2">
                    🌿 Environmental Impact Summary
                  </h4>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                     {selectedProjectImpact.treesPlanted != null && (
                       <div className="bg-white rounded-lg p-3 border border-green-200 text-center hover:shadow-lg transition-shadow">
                         <p className="text-2xl mb-1">🌳</p>
                         <p className="text-xs text-green-600 font-semibold">Trees Planted</p>
                         <p className="text-xl font-bold text-green-900">{selectedProjectImpact.treesPlanted.toLocaleString()}</p>
                       </div>
                     )}
                     {selectedProjectImpact.co2ReducedTons != null && (
                       <div className="bg-white rounded-lg p-3 border border-green-200 text-center hover:shadow-lg transition-shadow">
                         <p className="text-2xl mb-1">💨</p>
                         <p className="text-xs text-green-600 font-semibold">CO₂ Reduced</p>
                         <p className="text-xl font-bold text-green-900">{selectedProjectImpact.co2ReducedTons.toLocaleString()}</p>
                         <p className="text-xs text-green-600">metric tons</p>
                       </div>
                     )}
                     {selectedProjectImpact.waterBodiesCleaned != null && (
                       <div className="bg-white rounded-lg p-3 border border-green-200 text-center hover:shadow-lg transition-shadow">
                         <p className="text-2xl mb-1">💧</p>
                         <p className="text-xs text-green-600 font-semibold">Water Bodies Cleaned</p>
                         <p className="text-xl font-bold text-green-900">{selectedProjectImpact.waterBodiesCleaned.toLocaleString()}</p>
                         <p className="text-xs text-green-600">count</p>
                       </div>
                     )}
                     {selectedProjectImpact.areaRestoredHectares != null && (
                       <div className="bg-white rounded-lg p-3 border border-green-200 text-center hover:shadow-lg transition-shadow">
                         <p className="text-2xl mb-1">🌱</p>
                         <p className="text-xs text-green-600 font-semibold">Area Restored</p>
                         <p className="text-xl font-bold text-green-900">{selectedProjectImpact.areaRestoredHectares.toLocaleString()}</p>
                         <p className="text-xs text-green-600">hectares</p>
                       </div>
                     )}
                     {selectedProjectImpact.peopleBenefited != null && (
                       <div className="bg-white rounded-lg p-3 border border-green-200 text-center hover:shadow-lg transition-shadow">
                         <p className="text-2xl mb-1">👥</p>
                         <p className="text-xs text-green-600 font-semibold">People Benefited</p>
                         <p className="text-xl font-bold text-green-900">{selectedProjectImpact.peopleBenefited.toLocaleString()}</p>
                       </div>
                     )}
                   </div>
                  {selectedProjectImpact.notes && (
                    <div className="mt-4 text-xs text-green-700 bg-white rounded-lg p-3 border border-green-200 italic">
                      📝 <strong>Notes:</strong> {selectedProjectImpact.notes}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <p className="text-sm text-amber-800">⏳ Loading environmental impact data...</p>
                </div>
              )}
            </div>
          )}
          {selectedReport.scope === 'ISSUE' && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-900">ℹ️ <strong>Note:</strong> Environmental impact metrics are tracked at the project level. This is an issue-scoped report.</p>
            </div>
          )}

             {/* Report Content */}
             <div>
               <p className="text-xs text-bark-600 font-semibold mb-2 uppercase tracking-wide">📊 Report Content</p>
               <div className="bg-earth-50 rounded-xl p-4 border border-earth-200 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-bark-700 whitespace-pre-wrap font-mono leading-relaxed">{selectedReport.metrics}</pre>
                    {selectedProjectDetails && (
                      <div className="mt-4 p-3 bg-white rounded-lg border border-bark-200">
                        <h4 className="text-sm font-semibold text-bark-800 mb-1">Project Summary</h4>
                        <p className="text-xs text-bark-600">{selectedProjectDetails.title}</p>
                        {selectedProjectDetails.description && <p className="text-xs text-bark-500 mt-1">{selectedProjectDetails.description}</p>}
                      </div>
                    )}
               </div>
             </div>

             {/* Action Buttons */}
             <div className="flex gap-2 justify-end pt-2 border-t border-earth-200">
               <Button variant="secondary" onClick={() => setViewModal(false)}>Close</Button>
               <Button onClick={() => handleDownloadReport(selectedReport)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                 <Download size={16} /> Download Report
               </Button>
             </div>
           </div>
         )}
       </Modal>

       {/* Delete Confirmation Modal */}
       <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Report" size="sm">
         <div className="space-y-4">
           <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-3">
             <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
             <p className="text-sm text-red-900">Are you sure you want to delete this report? This action cannot be undone.</p>
           </div>
           <div className="flex gap-3 justify-end">
             <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
             <Button
               variant="danger"
               onClick={() => handleDeleteReport(deleteConfirm)}
             >
               Delete Report
             </Button>
           </div>
         </div>
       </Modal>
    </DashboardLayout>
  );
}
