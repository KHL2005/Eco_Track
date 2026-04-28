export default function InputField({ label, type = 'text', value, onChange, placeholder, error, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-text mb-1.5">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border bg-white text-text placeholder-text-muted text-sm transition-all duration-200 outline-none
          ${error ? 'border-error ring-2 ring-error/20' : 'border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20'}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}
