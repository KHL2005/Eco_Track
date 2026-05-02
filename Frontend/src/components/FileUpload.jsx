import { useRef, useState } from 'react';
import { Upload, X, File } from 'lucide-react';
import PropTypes from 'prop-types';

export default function FileUpload({ onFile, accept, label = 'Upload File', progress }) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleFile = (file) => {
    if (!file) return;
    setSelected(file);
    onFile(file);
  };

  return (
    <div>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragging ? 'border-forest-600 bg-leaf-400/10' : 'border-bark-400/30 hover:border-forest-600 hover:bg-earth-100'}`}
      >
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
        <Upload className="mx-auto mb-2 text-bark-400" size={28} />
        <p className="text-sm font-medium text-bark-600">{label}</p>
        <p className="text-xs text-bark-400 mt-1">Click or drag & drop</p>
      </div>

      {selected && (
        <div className="mt-3 flex items-center gap-3 p-3 bg-earth-100 rounded-xl">
          <File size={18} className="text-forest-600 flex-shrink-0" />
          <span className="text-sm text-bark-600 flex-1 truncate">{selected.name}</span>
          <button onClick={() => { setSelected(null); onFile(null); }} className="text-bark-400 hover:text-danger">
            <X size={16} />
          </button>
        </div>
      )}

      {progress != null && progress > 0 && progress < 100 && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-bark-400 mb-1">
            <span>Uploading…</span><span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-earth-100 rounded-full overflow-hidden">
            <div className="h-full bg-forest-600 transition-all rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

FileUpload.propTypes = {
  onFile: PropTypes.func.isRequired,
  accept: PropTypes.string,
  label: PropTypes.string,
  progress: PropTypes.number,
};

