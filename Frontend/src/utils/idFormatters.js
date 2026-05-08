/**
 * ID Formatting Utilities
 * Formats raw database IDs into professional display formats
 *
 * Examples:
 * - Sensor ID 1 → SNS01
 * - Analysis ID 42 → ANL042
 * - Data ID 123 → DATA123
 * - Scientist ID 7 → SC07
 */

export const formatSensorId = (id) => {
  if (!id && id !== 0) return '—';
  return `SNS${String(id).padStart(2, '0')}`;
};

export const formatAnalysisId = (id) => {
  if (!id && id !== 0) return '—';
  return `ANL${String(id).padStart(3, '0')}`;
};

export const formatDataId = (id) => {
  if (!id && id !== 0) return '—';
  return `DATA${String(id).padStart(3, '0')}`;
};

export const formatScientistId = (id) => {
  if (!id && id !== 0) return '—';
  return `SC${String(id).padStart(2, '0')}`;
};

/**
 * Parse formatted ID back to number
 * Examples:
 * - "SNS01" → 1
 * - "ANL042" → 42
 * - "DATA123" → 123
 * - "SC07" → 7
 */
export const parseFormattedId = (formattedId) => {
  if (!formattedId || typeof formattedId !== 'string') return null;

  const match = formattedId.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  const [, prefix, number] = match;
  const parsedNumber = parseInt(number, 10);

  return isNaN(parsedNumber) ? null : parsedNumber;
};

/**
 * Format sensor data with ideal ranges
 * Shows the parameter and whether it's within ideal range
 */
export const formatParameterWithRange = (parameter, value) => {
  const ranges = {
    'PM2.5': { min: 0, max: 35, unit: 'µg/m³', label: 'PM2.5' },
    'PM25': { min: 0, max: 35, unit: 'µg/m³', label: 'PM2.5' }, // Alternative format
    'pm2.5': { min: 0, max: 35, unit: 'µg/m³', label: 'PM2.5' }, // Lowercase
    'pm25': { min: 0, max: 35, unit: 'µg/m³', label: 'PM2.5' }, // Lowercase alternative
    'PM10': { min: 0, max: 50, unit: 'µg/m³', label: 'PM10' },
    'pm10': { min: 0, max: 50, unit: 'µg/m³', label: 'PM10' }, // Lowercase
    'NO2': { min: 0, max: 40, unit: 'µg/m³', label: 'Nitrogen Dioxide' },
    'CO2': { min: 400, max: 1200, unit: 'ppm', label: 'Carbon Dioxide' },
    'O3': { min: 0, max: 100, unit: 'µg/m³', label: 'Ozone' },
    'SO2': { min: 0, max: 20, unit: 'µg/m³', label: 'Sulfur Dioxide' },
    'pH': { min: 6.5, max: 8.5, unit: '', label: 'pH Level' },
    'Turbidity': { min: 0, max: 5, unit: 'NTU', label: 'Water Turbidity' },
    'Dissolved Oxygen': { min: 5, max: 8, unit: 'mg/L', label: 'Dissolved Oxygen' },
    'Temperature': { min: 15, max: 35, unit: '°C', label: 'Temperature' },
    'Noise Level': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
  };

  const range = ranges[parameter];
  if (!range) {
    return { value, isInRange: null, range: null, label: parameter };
  }

  const numValue = parseFloat(value);
  const isInRange = numValue >= range.min && numValue <= range.max;

  return {
    value,
    isInRange,
    range,
    label: range.label,
    display: `${value} ${range.unit}`,
  };
};

