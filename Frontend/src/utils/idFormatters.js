
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

export const formatAgencyOfficerId = (id) => {
  if (!id && id !== 0) return '—';
  return `AO${String(id).padStart(2, '0')}`;
};

export const parseFormattedId = (formattedId) => {
  if (!formattedId || typeof formattedId !== 'string') return null;

  const match = formattedId.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  const [, prefix, number] = match;
  const parsedNumber = parseInt(number, 10);

  return isNaN(parsedNumber) ? null : parsedNumber;
};

export const formatParameterWithRange = (parameter, value) => {
  const ranges = {
    // Air Parameters
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

    // Water Parameters
    'pH': { min: 6.5, max: 8.5, unit: '', label: 'pH Level' },
    'ph': { min: 6.5, max: 8.5, unit: '', label: 'pH Level' },
    'Turbidity': { min: 0, max: 5, unit: 'NTU', label: 'Water Turbidity' },
    'turbidity': { min: 0, max: 5, unit: 'NTU', label: 'Water Turbidity' },
    'Dissolved Oxygen': { min: 5, max: 8, unit: 'mg/L', label: 'Dissolved Oxygen' },
    'dissolvedOxygen': { min: 5, max: 8, unit: 'mg/L', label: 'Dissolved Oxygen' },
    'BOD': { min: 0, max: 5, unit: 'mg/L', label: 'Biochemical Oxygen Demand' },
    'bod': { min: 0, max: 5, unit: 'mg/L', label: 'Biochemical Oxygen Demand' },
    'Conductivity': { min: 200, max: 800, unit: 'µS/cm', label: 'Electrical Conductivity' },
    'conductivity': { min: 200, max: 800, unit: 'µS/cm', label: 'Electrical Conductivity' },

    // Noise Parameters
    'Noise Level': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'noise level': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'NOISE_LEVEL': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'noise_level': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'noiseLevel': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'noise': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'Noise': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'NOISE': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'decibel': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'Decibel': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'DECIBEL': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'dB': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'db': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'DB': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'soundLevel': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
    'sound_level': { min: 0, max: 55, unit: 'dB', label: 'Noise Level' },
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

