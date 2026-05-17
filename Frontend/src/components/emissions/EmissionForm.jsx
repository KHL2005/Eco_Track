import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { logEmission } from '../../api/emissionsApi';
import { EMISSION_TYPES } from '../../utils/constants';
import InputField from './InputField';
import { SuccessBanner, ErrorBanner } from '../common/Feedback';

export default function EmissionForm({ onSuccess }) {
  const { user } = useAuth();
  const [type, setType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [typeError, setTypeError] = useState('');
  const [quantityError, setQuantityError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [apiError, setApiError] = useState('');

  async function handleSubmit() {
    setSuccess('');
    setApiError('');

    // Validate each field individually
    let hasError = false;
    if (!type) {
      setTypeError('Select an emission type');
      hasError = true;
    } else {
      setTypeError('');
    }
    if (!quantity || Number(quantity) <= 0) {
      setQuantityError('Quantity must be a positive number');
      hasError = true;
    } else {
      setQuantityError('');
    }
    if (hasError) return;

    setLoading(true);
    try {
      await logEmission({ industryId: user.userId, industryName: user.name, type, quantity: Number(quantity) });
      setSuccess('Emission logged successfully!');
      setType('');
      setQuantity('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      let msg = 'Failed to log emission.';
      if (err.response && err.response.data && err.response.data.message) {
        msg = err.response.data.message;
      } else if (err.message) {
        msg = err.message;
      }
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-lg font-bold text-text mb-5">Log New Emission</h2>
      {success && <SuccessBanner message={success} onDismiss={() => setSuccess('')} />}
      {apiError && <ErrorBanner message={apiError} />}
      <div className="space-y-4">
        <InputField label="Industry Name" value={user?.name || ''} readOnly className="bg-gray-50 cursor-not-allowed" />

        <div className="w-full">
          <label className="block text-sm font-medium text-text mb-1.5">Emission Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={`w-full px-4 py-3 rounded-xl border bg-white text-text text-sm outline-none transition-all
              ${typeError ? 'border-error ring-2 ring-error/20' : 'border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20'}`}
          >
            <option value="">Select type…</option>
            {EMISSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {typeError && <p className="mt-1 text-xs text-error">{typeError}</p>}
        </div>

        <InputField
          label="Quantity (metric tons)"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="e.g. 1250.75"
          error={quantityError}
          min="0"
          step="0.01"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
        >
          {loading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
          {loading ? 'Submitting…' : 'Log Emission'}
        </button>
      </div>
    </div>
  );
}
