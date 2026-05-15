import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import FileUpload from '../../components/common/FileUpload';
import { Plus, Download, Trash2, FileText, Info } from 'lucide-react';
import * as emissionsApi from '../../api/emissionsApi';
import { useRole } from '../../hooks/useRole';
import { formatDate, formatTime } from '../../utils/formatters';
import { DOC_TYPES } from '../../utils/constants';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const { isIndustry, isAdmin, isComplianceOfficer } = useRole();

  // Documents list
  const [docs, setDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal open/close
  const [modalOpen, setModalOpen] = useState(false);

  // Description that the user clicked on, shown in a small modal
  const [viewDescription, setViewDescription] = useState(null);

  // Reject-reason modal state. Holds the row being rejected and the typed reason.
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Read-only modal that shows the stored rejection reason when a REJECTED badge is clicked.
  const [viewRejectionReason, setViewRejectionReason] = useState(null);

  // Upload form fields — one state variable per field
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [industryName, setIndustryName] = useState('');
  const [docType, setDocType] = useState('PERMIT');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form validation errors
  const [regNumError, setRegNumError] = useState('');
  const [industryNameError, setIndustryNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [fileError, setFileError] = useState('');

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
    setRegNumError('');
    setIndustryNameError('');
    setDescriptionError('');
    setFileError('');
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

  function validate() {
    let valid = true;

    // Registration Number: required, min 3, max 15
    if (!registrationNumber.trim()) {
      setRegNumError('Registration number is required');
      valid = false;
    } else if (registrationNumber.trim().length < 3 || registrationNumber.trim().length > 15) {
      setRegNumError('Must be 3–15 characters');
      valid = false;
    } else {
      setRegNumError('');
    }

    // Industry Name: required, min 3, max 100, letters/spaces/hyphens only
    if (!industryName.trim()) {
      setIndustryNameError('Industry name is required');
      valid = false;
    } else if (industryName.trim().length < 3 || industryName.trim().length > 100) {
      setIndustryNameError('Must be 3–100 characters, letters and spaces only');
      valid = false;
    } else if (!/^[A-Za-z\s-]+$/.test(industryName.trim())) {
      setIndustryNameError('Must be 3–100 characters, letters and spaces only');
      valid = false;
    } else {
      setIndustryNameError('');
    }

    // Description: required, min 10, max 500
    if (!description.trim()) {
      setDescriptionError('Minimum 10 characters required');
      valid = false;
    } else if (description.trim().length < 10) {
      setDescriptionError('Minimum 10 characters required');
      valid = false;
    } else if (description.trim().length > 500) {
      setDescriptionError('Must be under 500 characters');
      valid = false;
    } else {
      setDescriptionError('');
    }

    // File: null check, extension, MIME type, size
    if (!file) {
      setFileError('Please select a PDF file');
      valid = false;
    } else if (!file.name.toLowerCase().endsWith('.pdf')) {
      setFileError('File must have a .pdf extension');
      valid = false;
    } else if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are accepted');
      valid = false;
    } else if (file.size > 10 * 1024 * 1024) {
      setFileError('File size must be under 10 MB');
      valid = false;
    } else {
      setFileError('');
    }

    return valid;
  }

  async function handleSubmit() {
    if (!validate()) return;

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

  function openRejectModal(row) {
    setRejectTarget(row);
    setRejectReason('');
  }

  function closeRejectModal() {
    setRejectTarget(null);
    setRejectReason('');
  }

  async function handleConfirmReject() {
    const trimmed = rejectReason.trim();
    if (trimmed.length < 10) return;
    setIsRejecting(true);
    try {
      const docId = rejectTarget.documentId || rejectTarget.id;
      await emissionsApi.verifyDocument(docId, 'REJECTED', trimmed);
      toast.success('Document rejected');
      closeRejectModal();
      fetchDocuments();
    } catch (error) {
      let msg = 'Failed to reject document';
      if (error.response && error.response.data && error.response.data.message) {
        msg = error.response.data.message;
      }
      toast.error(msg);
    } finally {
      setIsRejecting(false);
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
    {
      key: 'industryName', label: 'Industry', sortable: true,
      render: (row) => (
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-sm text-bark-800">{row.industryName}</span>
          <code className="text-[10px] font-mono text-black mt-0.5">{row.registrationNumber}</code>
        </div>
      )
    },
    { key: 'docType', label: 'Type', render: (row) => <span className="text-sm text-bark-700 whitespace-nowrap">{row.docType}</span> },
    {
      key: 'description', label: 'Description',
      render: (row) => (
        row.description ? (
          <button
            type="button"
            onClick={() => setViewDescription(row.description)}
            title="Click to view full description"
            className="text-sm text-bark-600 truncate max-w-[140px] block text-left hover:text-forest-700 hover:underline cursor-pointer"
          >
            {row.description}
          </button>
        ) : (
          <span className="text-sm text-bark-400">—</span>
        )
      )
    },
    {
      key: 'verificationStatus', label: 'Status',
      render: (row) => {
        const isRejected = row.verificationStatus === 'REJECTED';
        const reason = row.rejectionReason ? row.rejectionReason : 'No reason provided';
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <StatusBadge status={row.verificationStatus} />
              {isRejected && (
                <button
                  type="button"
                  onClick={() => setViewRejectionReason(reason)}
                  title="View rejection reason"
                  className="p-1 rounded-full text-red-500 hover:bg-red-50 cursor-pointer"
                >
                  <Info size={14} />
                </button>
              )}
            </div>
            {row.updatedAt && (
              <div className="flex flex-col whitespace-nowrap leading-tight">
                <span className="text-[10px] text-bark-400">{formatDate(row.updatedAt)}</span>
                <span className="text-[10px] text-bark-400">{formatTime(row.updatedAt)}</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'uploadedDate', label: 'Uploaded',
      render: (row) => (
        <div className="flex flex-col whitespace-nowrap">
          <span className="text-sm text-bark-700">{formatDate(row.uploadedDate)}</span>
          {formatTime(row.uploadedDate) && <span className="text-xs text-bark-400">{formatTime(row.uploadedDate)}</span>}
        </div>
      )
    },
    {
      label: 'Actions', render: (row) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="flex items-center gap-1 text-xs" onClick={() => handleDownloadPdf(row.documentId || row.id, row.fileName)} title="Download PDF">
            <Download size={13} />Download
          </Button>
          {(isAdmin || isComplianceOfficer) && row.verificationStatus === 'SUBMITTED' && (
            <>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => handleVerify(row.documentId || row.id, 'APPROVED')}>Approve</Button>
              <Button size="sm" variant="danger" className="text-xs" onClick={() => openRejectModal(row)}>Reject</Button>
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

      <Modal open={viewDescription !== null} onClose={() => setViewDescription(null)} title="Description" size="sm">
        <div className="text-sm text-bark-700 whitespace-pre-wrap break-words">
          {viewDescription}
        </div>
      </Modal>

      <Modal open={viewRejectionReason !== null} onClose={() => setViewRejectionReason(null)} title="Rejection Reason" size="sm">
        <div className="text-sm text-bark-700 whitespace-pre-wrap break-words bg-red-50 border border-red-200 rounded-xl p-3">
          {viewRejectionReason}
        </div>
      </Modal>

      <Modal open={rejectTarget !== null} onClose={closeRejectModal} title="Reject Document" size="sm">
        {rejectTarget !== null && (() => {
          const trimmed = rejectReason.trim();
          const valid = trimmed.length >= 10;
          const showError = trimmed.length > 0 && !valid;
          return (
            <div className="space-y-4">
              <div className="text-xs text-bark-500 bg-bark-50 rounded-xl px-3 py-2">
                Rejecting document <span className="font-medium text-bark-700">#{rejectTarget.documentId || rejectTarget.id}</span>
                {' · '}<span className="font-medium text-bark-700">{rejectTarget.industryName}</span>
                {' · '}<span className="font-medium text-bark-700">{rejectTarget.docType}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-bark-600 mb-1">Reason for rejection</label>
                <textarea
                  rows={4}
                  autoFocus
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${showError ? 'border-red-400 focus:ring-red-400/30' : 'border-bark-400/20 focus:ring-forest-600/30'}`}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this document is being rejected (min 10 characters)…"
                />
                <p className={`text-xs mt-1 ${showError ? 'text-red-500' : 'text-bark-400'}`}>
                  {showError
                    ? `Reason must be at least 10 characters (${trimmed.length}/10).`
                    : `${trimmed.length} character${trimmed.length === 1 ? '' : 's'} — minimum 10.`}
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={closeRejectModal}>Cancel</Button>
                <Button variant="danger" onClick={handleConfirmReject} loading={isRejecting} disabled={!valid}>Reject</Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Modal open={modalOpen} onClose={closeModal} title="Submit Compliance Document" size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Registration Number (e.g. TNPCB-IND-1023)</label>
              <input
                type="text"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${regNumError ? 'border-red-400 focus:ring-red-400/30' : 'border-bark-400/20 focus:ring-forest-600/30'}`}
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
              />
              {regNumError && <p className="mt-1 text-xs text-red-500">{regNumError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-600 mb-1">Industry Name</label>
              <input
                type="text"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${industryNameError ? 'border-red-400 focus:ring-red-400/30' : 'border-bark-400/20 focus:ring-forest-600/30'}`}
                value={industryName}
                onChange={(e) => setIndustryName(e.target.value)}
              />
              {industryNameError && <p className="mt-1 text-xs text-red-500">{industryNameError}</p>}
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
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${descriptionError ? 'border-red-400 focus:ring-red-400/30' : 'border-bark-400/20 focus:ring-forest-600/30'}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            {descriptionError && <p className="mt-1 text-xs text-red-500">{descriptionError}</p>}
          </div>
          <div>
            <FileUpload onFile={setFile} accept=".pdf" label="Upload PDF (max 10 MB)" progress={uploadProgress} />
            {fileError && <p className="mt-1 text-xs text-red-500">{fileError}</p>}
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitDisabled}>Submit</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
