import axiosInstance from './axiosInstance';

// Emissions
export const getEmissions = () => axiosInstance.get('/emissions');
export const getEmissionById = (id) => axiosInstance.get(`/emissions/${id}`);
export const getEmissionsByIndustry = (industryName) =>
  axiosInstance.get('/emissions/industry', { params: { industryName } });
export const logEmission = (data) => axiosInstance.post('/emissions', data);
export const updateEmissionStatus = (id, status, rejectionReason) => {
  const params = { status };
  if (rejectionReason) params.rejectionReason = rejectionReason;
  return axiosInstance.patch(`/emissions/${id}/status`, null, { params });
};
export const deleteEmission = (id) => axiosInstance.delete(`/emissions/${id}`);

// Industry Documents
export const getDocuments = () => axiosInstance.get('/industry-documents');
export const getDocumentById = (docId) => axiosInstance.get(`/industry-documents/${docId}`);
export const getDocumentsByIndustry = (industryName) =>
  axiosInstance.get('/industry-documents/industry', { params: { industryName } });
export const getDocumentViewUrl = (docId) => `/api/v1/industry-documents/${docId}?view=true`;
export const getDocumentDownloadUrl = (docId) => `/api/v1/industry-documents/${docId}?download=true`;
export const fetchDocumentBlob = (docId) =>
  axiosInstance.get(`/industry-documents/${docId}`, { params: { view: true }, responseType: 'blob' });
export const downloadDocumentBlob = (docId) =>
  axiosInstance.get(`/industry-documents/${docId}`, { params: { download: true }, responseType: 'blob' });
export const submitDocument = (formData, onProgress) =>
  axiosInstance.post('/industry-documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
export const verifyDocument = (docId, status, rejectionReason) => {
  const params = { status };
  if (rejectionReason) params.rejectionReason = rejectionReason;
  return axiosInstance.patch(`/industry-documents/${docId}/verify`, null, { params });
};
export const deleteDocument = (docId) => axiosInstance.delete(`/industry-documents/${docId}`);

