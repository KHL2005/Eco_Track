import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import FileUpload from '../components/FileUpload';
import * as issuesApi from '../api/issuesApi';
import { useAuth } from '../context/AuthContext';
import { ISSUE_TYPES } from '../utils/constants';
import { labelify } from '../utils/formatters';
import { toast } from 'sonner';

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-bark-600 mb-1.5">{label}</label>
    {children}
    {error && <p className="text-xs text-danger mt-1">{error}</p>}
  </div>
);

export default function CitizenReportIssue() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', type: '', location: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.type) e.type = 'Issue type is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createMut = useMutation({
    mutationFn: (data) => issuesApi.createIssue(data),
    onSuccess: async (res) => {
      qc.invalidateQueries({ queryKey: ['issues'] });

      // Upload media if file was selected
      if (selectedFile) {
        try {
          await issuesApi.uploadMedia(res.data.id, selectedFile, (progress) => {
            setUploadProgress(Math.round(progress.loaded / progress.total * 100));
          });
          toast.success('Issue reported with media successfully!');
        } catch (uploadError) {
          toast.warning('Issue reported but media upload failed. You can try uploading again from the issue details.');
        }
      } else {
        toast.success('Issue reported successfully!');
      }

      navigate(`/citizen/issues/${res.data.id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to report issue'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    createMut.mutate({
      ...form,
      citizenId: user?.userId,
      citizenName: user?.name,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Report an Issue" description="Help your community by reporting environmental problems" />
        <form onSubmit={handleSubmit}>
          <Card className="space-y-5">
            <Field label="Issue Title *" error={errors.title}>
              <input className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                placeholder="e.g. Illegal dumping near river" value={form.title} onChange={set('title')} />
            </Field>

            <Field label="Issue Type *" error={errors.type}>
              <select className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                value={form.type} onChange={set('type')}>
                <option value="">Select type…</option>
                {ISSUE_TYPES.map(t => <option key={t} value={t}>{labelify(t)}</option>)}
              </select>
            </Field>

            <Field label="Location (address or landmark)">
              <input className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                placeholder="e.g. Near Greenfield Park" value={form.location} onChange={set('location')} />
            </Field>

            <Field label="Description *" error={errors.description}>
              <textarea rows={4} className="w-full border border-bark-400/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-600/30"
                placeholder="Describe the issue in detail…" value={form.description} onChange={set('description')} />
            </Field>

            <Field label="Upload Image/Video (optional)">
              <FileUpload
                accept="image/*,video/*"
                label="Upload photo or video evidence"
                onFile={setSelectedFile}
                progress={uploadProgress}
              />
            </Field>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" type="button" onClick={() => navigate('/citizen/dashboard')}>Cancel</Button>
              <Button type="submit" loading={createMut.isPending}>Submit Report</Button>
            </div>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
