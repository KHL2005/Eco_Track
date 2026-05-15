import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import FileUpload from '../../components/common/FileUpload';
import { Plus, Upload, Trash2 } from 'lucide-react';
import * as sensorsApi from '../../api/sensorsApi';
import { useRole } from '../../hooks/useRole';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/formatters';
import { formatSensorId, formatAnalysisId, formatAgencyOfficerId, parseFormattedId } from '../../utils/idFormatters';
import { ANALYSIS_STATUSES } from '../../utils/constants';
import { toast } from 'sonner';

export default function AnalysisPage() {
  const { isScientist, isAdmin, isAgencyOfficer } = useRole();
  const { user } = useAuth();
  const [createModal, setCreateModal] = useState(false);
  const [csvModal, setCsvModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({ dataId: '', findings: '' });
  const [csvForm, setCsvForm] = useState({ sensorId: '', sensorType: 'AIR' });
  const [csvFile, setCsvFile] = useState(null);
  const [csvProgress, setCsvProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterAgencyOfficerId, setFilterAgencyOfficerId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAnalysisId, setFilterAnalysisId] = useState('');
  const [filterSensorType, setFilterSensorType] = useState('');
  const [analyses, setAnalyses] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const RECORDS_PER_PAGE = 6;
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setCsv = (k) => (e) => setCsvForm(f => ({ ...f, [k]: e.target.value }));

  async function loadAnalyses() {
    setIsLoading(true);
    try {
      const [analysesRes, sensorsRes] = await Promise.all([
        sensorsApi.getAnalyses().catch(() => ({ data: [] })),
        sensorsApi.getSensors().catch(() => ({ data: [] })),
      ]);
      setAnalyses(analysesRes.data);
      setSensors(sensorsRes.data);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAnalyses();
  }, []);

  // Create a map of sensor ID to sensor type
  const sensorTypeMap = sensors.reduce((acc, s) => {
    acc[s.sensorId] = s.type;
    return acc;
  }, {});

  // Apply filters to analyses
  const filteredAnalyses = analyses.filter(a => {
    if (filterAnalysisId) {
      const parsedFilterId = parseFormattedId(filterAnalysisId) || parseInt(filterAnalysisId, 10);
      if (!isNaN(parsedFilterId)) {
        if (a.analysisId !== parsedFilterId) return false;
      } else {
        if (!a.analysisId?.toString().includes(filterAnalysisId)) return false;
      }
    }

    if (filterAgencyOfficerId) {
      const parsedFilterId = parseFormattedId(filterAgencyOfficerId) || parseInt(filterAgencyOfficerId, 10);
      if (!isNaN(parsedFilterId)) {
        if (a.agencyOfficerId !== parsedFilterId) return false;
      } else {
        if (!a.agencyOfficerId?.toString().includes(filterAgencyOfficerId)) return false;
      }
    }

    if (filterStatus && a.status !== filterStatus) return false;
    if (filterSensorType && sensorTypeMap[a.sensorId] !== filterSensorType) return false;
    return true;
  });

  async function handleCreate(payload) {
    setCreateLoading(true);
    try {
      await sensorsApi.createAnalysis(payload);
      toast.success('Analysis created');
      setCreateModal(false);
      setForm({ dataId: '', findings: '' });
      loadAnalyses();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to create analysis';
      toast.error(errorMsg);
      console.error('Create error:', error);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleReview(id, status, findings) {
    setReviewLoading(true);
    try {
      await sensorsApi.reviewAnalysis(id, status, findings);
      toast.success('Analysis reviewed');
      loadAnalyses();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to review analysis';
      toast.error(errorMsg);
      console.error('Review error:', error);
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleDelete(id) {
    setDeleteLoading(true);
    try {
      await sensorsApi.deleteAnalysis(id);
      toast.success('Analysis deleted');
      setDeleteConfirm(null);
      loadAnalyses();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to delete analysis';
      toast.error(errorMsg);
      console.error('Delete error:', error);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleUploadCsv() {
    setUploadLoading(true);
    try {
      const res = await sensorsApi.uploadCsv(csvFile, csvForm.sensorId, csvForm.sensorType,
        (e) => setCsvProgress(Math.round(e.loaded / e.total * 100)));
      const { successCount, failCount, totalRows } = res.data;
      if (successCount === 0) {
        toast.error(`CSV upload failed: 0 records inserted`, {
          description: `Total rows: ${totalRows}, Failed: ${failCount}. Check that the Sensor ID exists and the CSV columns match the sensor type.`,
          duration: 6000,
        });
      } else if (failCount > 0) {
        toast.warning(`CSV partially uploaded: ${successCount} of ${totalRows} records inserted`, {
          description: `Failed: ${failCount} rows. Some rows may have invalid data or a mismatched Sensor ID.`,
          duration: 6000,
        });
      } else {
        toast.success(`CSV uploaded: ${successCount} records inserted successfully`, {
          description: `Total rows: ${totalRows}`,
          duration: 4000,
        });
      }
      setCsvModal(false);
      setCsvProgress(0);
      setCsvFile(null);
    } catch {
      toast.error('CSV upload failed');
      setCsvProgress(0);
    } finally {
      setUploadLoading(false);
    }
  }

  const columns = [
     { key: 'sensorId', label: 'Sensor ID', render: r => <span className="text-xs font-medium">{formatSensorId(r.sensorId)}</span> },
     { key: 'sensorType', label: 'Type', render: r => <span className="text-xs font-medium px-2 py-1 bg-sky-100 text-sky-700 rounded">{sensorTypeMap[r.sensorId] || '—'}</span> },
     { key: 'analysisId', label: 'Analysis ID', render: r => <span className="text-xs font-semibold text-forest-700">{formatAnalysisId(r.analysisId)}</span> },
     { key: 'agencyOfficerId', label: 'Agency Officer ID', sortable: true, render: r => <span className="text-xs font-medium">{formatAgencyOfficerId(r.agencyOfficerId)}</span> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    {
      key: 'findings',
      label: 'Findings',
      render: r => (
        <textarea
          value={r.findings || ''}
          readOnly
          className="text-xs text-black bg-white border border-bark-300/30 rounded px-2 py-1 w-56 h-16 resize overflow-auto"
          style={{ resize: 'both' }}
        />
      )
    },
    {
      label: 'Actions', render: (r) => {
        return (
          <div className="flex gap-2">
            {r.status !== 'REVIEWED' && (isAdmin || isAgencyOfficer) && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => handleReview(r.analysisId, 'REVIEWED', r.findings)}
                loading={reviewLoading}
              >
                Review
              </Button>
            )}
            <button
              onClick={() => setDeleteConfirm(r.analysisId)}
              className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete analysis"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      }
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader emoji="🔬" title="Sensor Analysis" description="Environmental data analysis and findings"
        action={
          <div className="flex gap-2">
            {(isScientist || isAdmin) && (
              <Button variant="outline" size="sm" onClick={() => setCsvModal(true)}>
                <Upload size={14} /> Upload CSV
              </Button>
            )}
            {(isScientist || isAdmin) && (
              <Button size="sm" onClick={() => setCreateModal(true)}>
                <Plus size={14} /> New Analysis
              </Button>
            )}
          </div>
        }
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        {/* Filter Section */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Filter by Analysis ID</label>
            <input
              type="text"
              placeholder="Enter Analysis ID..."
              value={filterAnalysisId}
              onChange={(e) => { setFilterAnalysisId(e.target.value); setCurrentPage(1); }}
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
            />
          </div>
           <div>
             <label className="block text-sm font-medium text-bark-600 mb-1">Filter by Agency Officer ID</label>
             <input
               type="text"
               placeholder="Enter Agency Officer ID..."
               value={filterAgencyOfficerId}
               onChange={(e) => { setFilterAgencyOfficerId(e.target.value); setCurrentPage(1); }}
               className="w-full border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
             />
           </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Filter by Sensor Type</label>
            <select
              value={filterSensorType}
              onChange={(e) => { setFilterSensorType(e.target.value); setCurrentPage(1); }}
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
            >
              <option value="">All Types</option>
              <option value="AIR">Air</option>
              <option value="WATER">Water</option>
              <option value="NOISE">Noise</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="FLAGGED">Flagged</option>
            </select>
          </div>
        </div>

        <DataTable columns={columns} data={filteredAnalyses} loading={isLoading} searchable={false} currentPage={currentPage} recordsPerPage={RECORDS_PER_PAGE} onPageChange={setCurrentPage} />
      </div>

      {/* Create Analysis Modal */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Create Analysis">
        <div className="space-y-4">
          {[['dataId', 'Sensor Data ID', 'number']].map(([k, label, type]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-bark-600 mb-1">{label} <span className="text-red-500">*</span></label>
              <input type={type} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form[k]} onChange={set(k)} />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Findings / Notes <span className="text-red-500">*</span></label>
            <textarea rows={3} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={form.findings} onChange={set('findings')} placeholder="Document your analysis findings..." />
          </div>

          <div className="p-3 bg-sky-50 rounded-lg border border-sky-200/30">
            <p className="text-xs font-semibold text-sky-700 mb-2">📊 Ideal Parameter Ranges Reference:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-sky-600">
              <div><strong>AIR:</strong> PM2.5 0-35, PM10 0-50</div>
              <div><strong>CO2/NO2:</strong> 400-1200 ppm / 0-40 µg</div>
              <div><strong>WATER:</strong> pH 6.5-8.5, DO 5-8 mg/L</div>
              <div><strong>Turbidity:</strong> 0-5 NTU, BOD 0-5 mg/L</div>
              <div><strong>NOISE:</strong> 0-55 dB (ideal)</div>
              <div><strong>Conductivity:</strong> 200-800 µS/cm</div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => { setCreateModal(false); setForm({ dataId: '', findings: '' }); }}>Cancel</Button>
            <Button onClick={() => {
              if (!form.dataId.trim()) {
                toast.error('Data ID is required');
                return;
              }
              if (!form.findings.trim()) {
                toast.error('Findings are required');
                return;
              }
              handleCreate({ dataId: parseInt(form.dataId), findings: form.findings });
            }} loading={createLoading}>Create</Button>
          </div>
        </div>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal open={csvModal} onClose={() => setCsvModal(false)} title="Bulk CSV Upload">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Sensor ID <span className="text-red-500">*</span></label>
            <select
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={csvForm.sensorId}
              onChange={setCsv('sensorId')}
            >
              <option value="">Select a sensor...</option>
              {sensors.map(s => (
                <option key={s.sensorId} value={s.sensorId}>
                  SNS{String(s.sensorId).padStart(2, '0')} — {s.type} ({s.location})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Sensor Type</label>
            <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30" value={csvForm.sensorType} onChange={setCsv('sensorType')}>
              {['AIR', 'WATER', 'NOISE'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <FileUpload onFile={setCsvFile} accept=".csv" label="Upload CSV File" progress={csvProgress} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setCsvModal(false)}>Cancel</Button>
            <Button onClick={handleUploadCsv} loading={uploadLoading} disabled={!csvFile || !csvForm.sensorId}>Upload</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleDelete(deleteConfirm)}
        title="Delete Analysis"
        message="Are you sure you want to delete this analysis? This action cannot be undone."
        loading={deleteLoading}
        confirmLabel="Delete"
        variant="danger"
      />
    </DashboardLayout>
  );
}
