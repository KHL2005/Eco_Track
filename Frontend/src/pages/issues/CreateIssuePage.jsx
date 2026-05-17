import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import * as issuesApi from '../../api/issuesApi';
import { useAuth } from '../../context/AuthContext';
import { ISSUE_TYPES } from '../../utils/constants';
import { labelify } from '../../utils/formatters';
import { toast } from 'sonner';
import { Paperclip, X, ImageIcon, Video } from 'lucide-react';

const MAX_IMAGES = 5;
const MAX_VIDEOS = 5;

// Helper: check if file is an allowed image
function isImageType(file) {
  if (file.type === 'image/jpeg') return true;
  if (file.type === 'image/png') return true;
  if (file.type === 'image/gif') return true;
  return false;
}

// Helper: check if file is an allowed video
function isVideoType(file) {
  if (file.type === 'video/mp4') return true;
  if (file.type === 'video/avi') return true;
  if (file.type === 'video/quicktime') return true;
  return false;
}

export default function CreateIssuePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form fields — one useState for each field
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState({});
  const [images, setImages] = useState([]);   // each item: { file, preview }
  const [videos, setVideos] = useState([]);   // each item: { file, name, size }
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mediaInputRef = useRef();

  // ─── Validation ────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (title.trim() === '') {
      e.title = 'Issue title is required';
    }
    if (type === '') {
      e.type = 'Issue type is required';
    }
    if (location.trim() === '') {
      e.location = 'Location is required';
    }
    if (description.trim() === '') {
      e.description = 'Description is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ─── Media Handler ─────────────────────────────────────────────
  function handleMediaSelect(e) {
    const selected = e.target.files;

    // Sort the selected files into images, videos, or "other"
    const imgFiles = [];
    const vidFiles = [];
    let hasUnsupported = false;

    for (let i = 0; i < selected.length; i++) {
      const f = selected[i];
      if (isImageType(f)) {
        imgFiles.push(f);
      } else if (isVideoType(f)) {
        vidFiles.push(f);
      } else {
        hasUnsupported = true;
      }
    }

    if (hasUnsupported) {
      toast.error('Unsupported file type. Use jpg/png/gif or mp4/avi/mov');
    }

    const imgRemaining = MAX_IMAGES - images.length;
    const vidRemaining = MAX_VIDEOS - videos.length;

    if (imgFiles.length > imgRemaining) {
      toast.warning('Only ' + imgRemaining + ' more image(s) allowed (max ' + MAX_IMAGES + ')');
    }
    if (vidFiles.length > vidRemaining) {
      toast.warning('Only ' + vidRemaining + ' more video(s) allowed (max ' + MAX_VIDEOS + ')');
    }

    // Build the new image entries (respect the remaining-slots limit)
    const newImages = [];
    for (let i = 0; i < imgFiles.length; i++) {
      if (i >= imgRemaining) break;
      newImages.push({
        file: imgFiles[i],
        preview: URL.createObjectURL(imgFiles[i]),
      });
    }

    // Build the new video entries
    const newVideos = [];
    for (let i = 0; i < vidFiles.length; i++) {
      if (i >= vidRemaining) break;
      newVideos.push({
        file: vidFiles[i],
        name: vidFiles[i].name,
        size: vidFiles[i].size,
      });
    }

    setImages(images.concat(newImages));
    setVideos(videos.concat(newVideos));

    e.target.value = '';
  }

  function removeImage(idx) {
    URL.revokeObjectURL(images[idx].preview);
    const next = [];
    for (let i = 0; i < images.length; i++) {
      if (i !== idx) {
        next.push(images[i]);
      }
    }
    setImages(next);
  }

  function removeVideo(idx) {
    const next = [];
    for (let i = 0; i < videos.length; i++) {
      if (i !== idx) {
        next.push(videos[i]);
      }
    }
    setVideos(next);
  }

  // ─── Submit ────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      let citizenId = null;
      if (user) {
        citizenId = user.userId;
      }

      const res = await issuesApi.createIssue({
        title: title,
        type: type,
        location: location,
        description: description,
        citizenId: citizenId,
      });
      const issueId = res.data.issueId;

      // Collect all the files into one list
      const allFiles = [];
      for (let i = 0; i < images.length; i++) {
        allFiles.push(images[i].file);
      }
      for (let i = 0; i < videos.length; i++) {
        allFiles.push(videos[i].file);
      }

      if (allFiles.length > 0) {
        setUploading(true);
        let failed = 0;
        for (let i = 0; i < allFiles.length; i++) {
          try {
            await issuesApi.uploadMedia(issueId, allFiles[i]);
          } catch (uploadErr) {
            failed = failed + 1;
          }
        }
        setUploading(false);

        if (failed > 0) {
          toast.warning('Issue created but ' + failed + ' file(s) failed to upload');
        } else {
          toast.success('Issue reported with media successfully!');
        }
      } else {
        toast.success('Issue reported successfully!');
      }

      navigate('/issues/' + issueId);
    } catch (err) {
      let message = 'Failed to report issue';
      if (err.response && err.response.data && err.response.data.message) {
        message = err.response.data.message;
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  const totalMedia = images.length + videos.length;
  const isLoading = submitting || uploading;

  function openFilePicker() {
    if (mediaInputRef.current) {
      mediaInputRef.current.click();
    }
  }

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
            <div>
              <label className="block text-sm font-medium text-[#14532d] mb-1.5">Issue Title *</label>
              <input
                className="w-full border border-[#bbf7d0] rounded-xl px-3 py-2.5 text-sm text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#86efac]"
                placeholder="e.g. Illegal dumping near river"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium text-[#14532d] mb-1.5">Issue Type *</label>
              <select
                className="w-full border border-[#bbf7d0] rounded-xl px-3 py-2.5 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#86efac]"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">Select type…</option>
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>{labelify(t)}</option>
                ))}
              </select>
              {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-[#14532d] mb-1.5">Location *</label>
              <input
                className="w-full border border-[#bbf7d0] rounded-xl px-3 py-2.5 text-sm text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#86efac]"
                placeholder="e.g. Near Greenfield Park, River Road"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#14532d] mb-1.5">Description *</label>
              <textarea
                rows={4}
                className="w-full border border-[#bbf7d0] rounded-xl px-3 py-2.5 text-sm text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 focus:border-[#86efac] resize-none"
                placeholder="Describe the issue in detail…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>

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
                    onClick={openFilePicker}
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
                  onClick={openFilePicker}
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
                        onClick={openFilePicker}
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
                        onClick={openFilePicker}
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
