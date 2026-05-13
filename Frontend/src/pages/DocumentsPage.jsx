import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import FileUpload from '../components/FileUpload';
import { Plus, Download, Trash2, FileText } from 'lucide-react';
import * as emissionsApi from '../api/emissionsApi';
import { useRole } from '../hooks/useRole';
import { formatDateTime } from '../utils/formatters';
import { DOC_TYPES } from '../utils/constants';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const { isIndustry, isAdmin, isComplianceOfficer } = useRole();

  // Documents list
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal open/close
  const [modalOpen, setModalOpen] = useState(false);

  // Upload form fields — one state variable per field
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [industryName, setIndustryName] = useState('');
  const [docType, setDocType] = useState('PERMIT');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch documents when the page first loads
  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    setIsLoading(true);
    try {
      const response = await emissionsApi.getDocuments();
      setDocs(response.data);
    } catch (error) {
      setDocs([]);
    } finally {
      setIsLoading(false);
    }
  }

  function openModal() {
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setRegistrationNumber('');
    setIndustryName('');
    setDocType('PERMIT');
    setDescription('');
    setFile(null);
    setUploadProgress(0);
  }

  async function handleDownloadPdf(docId, fileName) {
    try {
      const response = await emissionsApi.downloadDocumentBlob(docId);
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName || `document-${docId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (error) {
      toast.error('Failed to download document');
    }
  }

  async function handleSubmit() {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10 MB');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('registrationNumber', registrationNumber);
      formData.append('industryName', industryName);
      formData.append('docType', docType);
      formData.append('description', description);
      formData.append('file', file);

      await emissionsApi.submitDocument(formData, (event) => {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      });

      toast.success('Document submitted');
      closeModal();
      fetchDocuments();
    } catch (error) {
      toast.error('Upload failed');
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(docId, status) {
    try {
      await emissionsApi.verifyDocument(docId, status);
      toast.success('Document updated');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to update document');
    }
  }

  async function handleDelete(docId) {
    try {
      await emissionsApi.deleteDocument(docId);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  }

  const isSubmitDisabled = !file || !registrationNumber.trim() || !industryName.trim() || !description.trim();

  const columns = [
    { key: 'documentId', label: 'ID', render: (row) => <span className="text-sm text-bark-700">{row.documentId}</span> },
    { key: 'industryName', label: 'Industry', sortable: true, render: (row) => <span className="text-sm text-bark-700">{row.industryName}</span> },
    { key: 'registrationNumber', label: 'Reg. Number', render: (row) => <code className="text-xs font-mono bg-bark-100 text-bark-700 px-1.5 py-0.5 rounded">{row.registrationNumber}</code> },
    { key: 'docType', label: 'Type', render: (row) => <span className="text-sm text-bark-700">{row.docType}</span> },
    { key: 'description', label: 'Description', render: (row) => <span title={row.description || ''} className="text-sm text-bark-600 truncate max-w-[120px] block">{row.description || '—'}</span> },
    {
      key: 'verificationStatus', label: 'Status', render: (row) => (
        <div className="flex flex-col gap-0.5">
          <StatusBadge status={row.verificationStatus} />
          {row.updatedAt && <span className="text-xs text-bark-400">{formatDateTime(row.updatedAt)}</span>}
        </div>
      )
    },
    { key: 'uploadedDate', label: 'Uploaded', render: (row) => <span className="text-sm text-bark-700">{formatDateTime(row.uploadedDate)}</span> },
    {
      label: 'Actions', render: (row) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="flex items-center gap-1 text-xs" onClick={() => handleDownloadPdf(row.documentId || row.id, row.fileName)} title="Download PDF">
            <Download size={13} />Download
          </Button>
          {(isAdmin || isComplianceOfficer) && row.verificationStatus === 'SUBMITTED' && (
            <>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => handleVerify(row.documentId || row.id, 'APPROVED')}>Approve</Button>
              <Button size="sm" variant="danger" className="text-xs" onClick={() => handleVerify(row.documentId || row.id, 'REJECTED')}>Reject</Button>
            </>
          )}
          {isIndustry && row.verificationStatus === 'SUBMITTED' && (
            <button
              onClick={() => handleDelete(row.documentId || row.id)}
              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete document"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader emoji="📄" title="Industry Documents" description="Permits, compliance documents, and certificates"
        action={(isIndustry || isAdmin) && <Button onClick={openModal}><Plus size={16} /> Upload Document</Button>}
      />

      <div className="bg-white rounded-2xl border border-bark-400/10 p-4">
        {!isLoading && docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-bark-400 gap-3">
            <FileText size={40} className="opacity-30" />
            <p className="text-sm">No documents uploaded yet</p>
          </div>
        ) : (
          <DataTable columns={columns} data={docs} loading={isLoading} />
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal} title="Submit Compliance Document" size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Registration Number (e.g. TNPCB-IND-1023)</label>
              <input
                type="text"
                className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Industry Name</label>
              <input
                type="text"
                className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={industryName}
                onChange={(e) => setIndustryName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Document Type</label>
            <select
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-600 mb-1">Description</label>
            <input
              className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <FileUpload onFile={setFile} accept=".pdf" label="Upload PDF (max 10 MB)" progress={uploadProgress} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitDisabled}>Submit</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
