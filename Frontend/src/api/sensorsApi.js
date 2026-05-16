import axiosInstance from './axiosInstance';

// Sensors
export const getSensors = () => axiosInstance.get('/sensors');
export const getSensorById = (id) => axiosInstance.get(`/sensors/${id}`);
export const createSensor = (data) => axiosInstance.post('/sensors', data);
export const updateSensorStatus = (id, status) =>
  axiosInstance.patch(`/sensors/${id}/status`, null, { params: { status } });
export const updateSensorLocation = (id, location) =>
  axiosInstance.patch(`/sensors/${id}/location`, null, { params: { location } });
export const updateSensorType = (id, type) =>
  axiosInstance.patch(`/sensors/${id}/type`, null, { params: { type } });
export const deleteSensor = (id) => axiosInstance.delete(`/sensors/${id}`);

// Sensor Data
export const getSensorData = () => axiosInstance.get('/sensor-data');
export const getSensorDataById = (dataId) => axiosInstance.get(`/sensor-data/${dataId}`);
export const getDataBySensor = (sensorId) => axiosInstance.get(`/sensor-data/sensor/${sensorId}`);
export const addSensorData = (data) => axiosInstance.post('/sensor-data', data);
export const deleteSensorData = (dataId) => axiosInstance.delete(`/sensor-data/${dataId}`);

// CSV Upload
export const uploadCsv = (file, sensorId, sensorType, onProgress) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('sensorId', sensorId);
  fd.append('sensorType', sensorType);
  return axiosInstance.post('/upload-csv', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
};

// Analysis
export const getAnalyses = () => axiosInstance.get('/analysis');
export const getAnalysisById = (id) => axiosInstance.get(`/analysis/${id}`);
export const getAnalysesByData = (dataId) => axiosInstance.get(`/analysis/data/${dataId}`);
export const getAnalysesByScientist = (scientistId) =>
  axiosInstance.get(`/analysis/scientist/${scientistId}`);
export const getAnalysesByStatus = (status) =>
  axiosInstance.get(`/analysis/status/${status}`);
export const getAnalysesBySensor = (sensorId) =>
  axiosInstance.get(`/analysis/sensor/${sensorId}`);
export const createAnalysis = (data) => axiosInstance.post('/analysis', data);
export const reviewAnalysis = (id, status, findings) =>
  axiosInstance.patch(
    `/analysis/${id}/review`,
    null,
    {
      params: { status, findings },
    }
  );
export const deleteAnalysis = (id) => axiosInstance.delete(`/analysis/${id}`);


