import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../layouts/DashboardLayout';
import * as issuesApi from '../api/issuesApi';
import { useAuth } from '../context/AuthContext';
import { ISSUE_TYPES } from '../utils/constants';
import { labelify } from '../utils/formatters';
import { toast } from 'sonner';
import { Paperclip, X, ImageIcon, Video } from 'lucide-react';

const MAX_IMAGES = 5;
const MAX_VIDEOS = 5;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/quicktime'];

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-[#14532d] mb-1.5">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default function CreateIssuePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [form, setForm] = useState({ title: '', type: '', location: '', description: '' });
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);   // [{ file, preview }]
  const [videos, setVideos]  = useState([]);  // [{ file, name, size }]
  const [uploading, setUploading] = useState(false);

  const mediaInputRef = useRef();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // ─── Validation ────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Issue title is required';
    if (!form.type)               e.type        = 'Issue type is required';
    if (!form.location.trim())    e.location    = 'Location is required';
    if (!form.description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Media Handler ─────────────────────────────────────────────
  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);

    const imgFiles   = files.filter(f => ACCEPTED_IMAGE_TYPES.includes(f.type));
    const vidFiles   = files.filter(f => ACCEPTED_VIDEO_TYPES.includes(f.type));
    const otherFiles = files.filter(f => !ACCEPTED_IMAGE_TYPES.includes(f.type) && !ACCEPTED_VIDEO_TYPES.includes(f.type));

    if (otherFiles.length > 0) toast.error('Unsupported file type. Use jpg/png/gif or mp4/avi/mov');

    const imgRemaining = MAX_IMAGES - images.length;
    const vidRemaining = MAX_VIDEOS - videos.length;

    if (imgFiles.length > imgRemaining) toast.warning(`Only ${imgRemaining} more image(s) allowed (max ${MAX_IMAGES})`);
    if (vidFiles.length > vidRemaining) toast.warning(`Only ${vidRemaining} more video(s) allowed (max ${MAX_VIDEOS})`);

    const toAddImgs = imgFiles.slice(0, imgRemaining);
    const toAddVids = vidFiles.slice(0, vidRemaining);

    setImages(prev => [...prev, ...toAddImgs.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
    setVideos(prev  => [...prev, ...toAddVids.map(f => ({ file: f, name: f.name, size: f.size }))]);

    e.target.value = '';
  };

  const removeImage = (idx) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const removeVideo = (idx) => setVideos(prev => prev.filter((_, i) => i !== idx));

  // ─── Submit ────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: (data) => issuesApi.createIssue(data),
    onSuccess: async (res) => {
      qc.invalidateQueries({ queryKey: ['issues'] });
      const issueId = res.data.issueId;
      const allFiles = [...images.map(i => i.file), ...videos.map(v => v.file)];

      if (allFiles.length > 0) {
        setUploading(true);
        let failed = 0;
        for (const file of allFiles) {
          try { await issuesApi.uploadMedia(issueId, file); }
          catch { failed++; }
        }
        setUploading(false);
        failed > 0
          ? toast.warning(`Issue created but ${failed} file(s) failed to upload`)
          : toast.success('Issue reported with media successfully!');
      } else {
        toast.success('Issue reported successfully!');
      }
      navigate(`/issues/${issueId}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to report issue'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    createMut.mutate({ ...form, citizenId: user?.userId });
  };

  const totalMedia  = images.length + videos.length;
  const isLoading   = createMut.isPending || uploading;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Citizen-themed page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#14532d] flex items-center gap-2">📸 Report an Issue</h1>
            <p className="text-sm text-[#64748b] mt-0.5">Help your community by reporting environmental problems 🌍</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white border border-[#bbf7d0] rounded-2xl shadow-sm p-6 space-y-5">

            {/* Issue Title */}
            <Field label="Issue Title *" error={errors.title}>
              <input
                className="w-full border border-[#bbf7d0] rounded-xl px-3 py-2.5 text-sm text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#86efac]"
                placeholder="e.g. Illegal dumping near river"
                value={form.title}
                onChange={set('title')}
              />
            </Field>

            {/* Issue Type */}
            <Field label="Issue Type *" error={errors.type}>
              <select
                className="w-full border border-[#bbf7d0] rounded-xl px-3 py-2.5 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#86efac]"
                value={form.type}
                onChange={set('type')}
              >
                <option value="">Select type…</option>
                {ISSUE_TYPES.map(t => <option key={t} value={t}>{labelify(t)}</option>)}
              </select>
            </Field>

            {/* Location */}
            <Field label="Location *" error={errors.location}>
              <input
                className="w-full border border-[#bbf7d0] rounded-xl px-3 py-2.5 text-sm text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#86efac]"
                placeholder="e.g. Near Greenfield Park, River Road"
                value={form.location}
                onChange={set('location')}
              />
            </Field>

            {/* Description */}
            <Field label="Description *" error={errors.description}>
              <textarea
                rows={4}
                className="w-full border border-[#bbf7d0] rounded-xl px-3 py-2.5 text-sm text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#86efac] resize-none"
                placeholder="Describe the issue in detail…"
                value={form.description}
                onChange={set('description')}
              />
            </Field>

            {/* ─── Combined Media Upload ─────────────────────────── */}
            <div className="border-t border-[#bbf7d0] pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Paperclip size={15} className="text-[#16a34a]" />
                  <span className="text-sm font-semibold text-[#14532d]">Attach Media</span>
                  <span className="text-xs text-[#64748b] font-normal">(optional)</span>
                </div>
                {totalMedia < (MAX_IMAGES + MAX_VIDEOS) && (
                  <button
                    type="button"
                    onClick={() => mediaInputRef.current?.click()}
                    className="text-xs text-[#16a34a] hover:text-[#15803d] font-semibold transition-colors"
                  >
                    + Add Files
                  </button>
                )}
              </div>

              {/* Hidden combined file input */}
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,video/mp4,video/avi,video/quicktime"
                multiple
                hidden
                onChange={handleMediaSelect}
              />

              {/* Empty state */}
              {totalMedia === 0 && (
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#86efac] hover:border-[#16a34a] hover:bg-[#f0fdf4] rounded-xl py-8 flex flex-col items-center gap-2 text-[#94a3b8] hover:text-[#16a34a] transition-all"
                >
                  <Paperclip size={26} />
                  <span className="text-sm font-medium">Click to attach images or videos</span>
                  <span className="text-xs opacity-70">Images: jpg, png, gif (max 5) &nbsp;·&nbsp; Videos: mp4, avi, mov (max 5)</span>
                </button>
              )}

              {/* Image thumbnails */}
              {images.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-[#16a34a] mb-2 flex items-center gap-1">
                    <ImageIcon size={12} /> Images ({images.length}/{MAX_IMAGES})
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative group aspect-square rounded-xl overflow-hidden border border-[#bbf7d0] bg-[#f0fdf4]"
                      >
                        <img src={img.preview} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => mediaInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-[#86efac] hover:border-[#16a34a] hover:bg-[#f0fdf4] flex items-center justify-center text-[#94a3b8] hover:text-[#16a34a] transition-all"
                      >
                        <X size={16} className="rotate-45" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Video list */}
              {videos.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#16a34a] mb-2 flex items-center gap-1">
                    <Video size={12} /> Videos ({videos.length}/{MAX_VIDEOS})
                  </p>
                  <div className="space-y-2">
                    {videos.map((vid, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl px-3 py-2.5"
                      >
                        <Video size={14} className="text-[#16a34a] shrink-0" />
                        <span className="text-sm text-[#1e293b] truncate flex-1">{vid.name}</span>
                        <span className="text-xs text-[#64748b] shrink-0">
                          {(vid.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                        <button
                          type="button"
                          onClick={() => removeVideo(idx)}
                          className="text-[#cbd5e1] hover:text-red-500 transition-colors shrink-0"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    {videos.length < MAX_VIDEOS && (
                      <button
                        type="button"
                        onClick={() => mediaInputRef.current?.click()}
                        className="w-full border border-dashed border-[#86efac] hover:border-[#16a34a] hover:bg-[#f0fdf4] rounded-xl py-2 text-xs text-[#64748b] hover:text-[#16a34a] transition-all flex items-center justify-center gap-1.5"
                      >
                        <Video size={12} /> Add another video
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Counter summary when files exist */}
              {totalMedia > 0 && (
                <p className="text-xs text-[#64748b] mt-2">
                  {totalMedia} file{totalMedia > 1 ? 's' : ''} selected
                  &nbsp;({images.length} image{images.length !== 1 ? 's' : ''}, {videos.length} video{videos.length !== 1 ? 's' : ''})
                </p>
              )}
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-[#16a34a] bg-[#dcfce7] rounded-xl px-4 py-3">
                <div className="w-4 h-4 border-2 border-[#16a34a] border-t-transparent rounded-full animate-spin shrink-0" />
                Uploading media files, please wait…
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2 border-t border-[#bbf7d0]">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={isLoading}
                className="px-4 py-2.5 text-sm font-medium text-[#14532d] bg-white border border-[#bbf7d0] hover:bg-[#f0fdf4] rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#16a34a] hover:bg-[#15803d] rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2 shadow-sm"
              >
                {isLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {uploading ? 'Uploading…' : 'Submit Report'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
