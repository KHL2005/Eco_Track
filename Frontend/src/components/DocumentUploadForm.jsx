import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadDocument } from '../api/industryApi';
import InputField from './InputField';
import { SuccessBanner, ErrorBanner } from './Feedback';

const DOC_TYPES = ['PERMIT', 'COMPLIANCE', 'OTHERS'];

export default function DocumentUploadForm({ onSuccess }) {
  const { user, token } = useAuth();
  const fileRef = useRef(null);
  const [docType, setDocType] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!docType) e.docType = 'Select a document type';
    if (!file) e.file = 'Please select a PDF file';
    else if (file.type !== 'application/pdf') e.file = 'Only PDF files are accepted';
    else if (file.size > 10 * 1024 * 1024) e.file = 'File size must be under 10 MB';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    setSuccess(''); setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('industryId', user.userId);
      fd.append('industryName', user.name);
      fd.append('docType', docType);
      fd.append('description', description);
      fd.append('file', file);
      await uploadDocument(fd, token);
      setSuccess(`Document "${file.name}" uploaded successfully!`);
      setDocType(''); setDescription(''); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      onSuccess?.();
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Upload failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-lg font-bold text-text mb-5">Upload Compliance Document</h2>
      {success && <SuccessBanner message={success} onDismiss={() => setSuccess('')} />}
      {apiError && <ErrorBanner message={apiError} />}
      <div className="space-y-4">
        <InputField label="Industry Name" value={user?.name || ''} readOnly className="bg-gray-50 cursor-not-allowed" />

        <div className="w-full">
          <label className="block text-sm font-medium text-text mb-1.5">Document Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border bg-white text-text text-sm outline-none transition-all
              ${errors.docType ? 'border-error ring-2 ring-error/20' : 'border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20'}`}
          >
            <option value="">Select type…</option>
            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.docType && <p className="mt-1 text-xs text-error">{errors.docType}</p>}
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium text-text mb-1.5">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the document…"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-text text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
          />
        </div>

        {/* File drop zone */}
        <div className="w-full">
          <label className="block text-sm font-medium text-text mb-1.5">PDF File (max 10 MB)</label>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`w-full border-2 border-dashed rounded-xl px-4 py-8 text-center cursor-pointer transition-all
              ${errors.file ? 'border-error bg-error-light/30' : 'border-gray-200 hover:border-accent hover:bg-accent/5'}`}
          >
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span className="text-sm text-text font-medium">{file.name}</span>
                <span className="text-xs text-text-muted">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            ) : (
              <div>
                <svg className="w-8 h-8 text-text-muted mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p className="text-sm text-text-muted">Drag & drop a PDF here, or <span className="text-primary font-semibold">browse</span></p>
              </div>
            )}
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
          </div>
          {errors.file && <p className="mt-1 text-xs text-error">{errors.file}</p>}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
          {loading ? 'Uploading…' : 'Upload Document'}
        </button>
      </div>
    </div>
  );
}

