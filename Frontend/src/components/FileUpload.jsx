import { useRef, useState } from 'react';
import { Upload, X, File } from 'lucide-react';
import PropTypes from 'prop-types';

export default function FileUpload({ onFile, accept, label = 'Upload File', progress, maxFiles = 5 }) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState([]);

  const handleFile = (files) => {
    if (!files || files.length === 0) return;
    const validFiles = Array.from(files).filter(file => {
      const isValidType = accept ? accept.split(',').some(type => {
        const trimmed = type.trim();
        if (trimmed.startsWith('.')) return file.name.toLowerCase().endsWith(trimmed);
        return file.type.match(trimmed.replace('*', '.*'));
      }) : true;
      return isValidType;
    });
    if (validFiles.length + selected.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }
    const newSelected = [...selected, ...validFiles];
    setSelected(newSelected);
    onFile(newSelected);
  };

  return (
    <div>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragging ? 'border-forest-600 bg-leaf-400/10' : 'border-bark-400/30 hover:border-forest-600 hover:bg-earth-100'}`}
      >
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => handleFile(e.target.files)} multiple />
        <Upload className="mx-auto mb-2 text-bark-400" size={28} />
        <p className="text-sm font-medium text-bark-600">{label}</p>
        <p className="text-xs text-bark-400 mt-1">Click or drag & drop</p>
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          {selected.map((file, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-earth-100 rounded-xl">
              <File size={18} className="text-forest-600 flex-shrink-0" />
              <span className="text-sm text-bark-600 flex-1 truncate">{file.name}</span>
              <button onClick={() => {
                const newSelected = selected.filter((_, i) => i !== index);
                setSelected(newSelected);
                onFile(newSelected);
              }} className="text-bark-400 hover:text-danger">
                <X size={16} />
              </button>
            </div>
          ))}
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
  maxFiles: PropTypes.number,
};
