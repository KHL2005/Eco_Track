import axiosInstance from './axiosInstance';

// Compliance
export const getComplianceRecords = () => axiosInstance.get('/compliance');
export const getComplianceById = (id) => axiosInstance.get(`/compliance/${id}`);
export const getComplianceByEntity = (entityId) =>
  axiosInstance.get(`/compliance/entity/${entityId}`);
export const getComplianceByType = (type) => axiosInstance.get(`/compliance/type/${type}`);
export const getComplianceByResult = (result) => axiosInstance.get(`/compliance/result/${result}`);
export const createCompliance = (data) => axiosInstance.post('/compliance', data);
export const updateCompliance = (id, result, notes) =>
  axiosInstance.patch(`/compliance/${id}`, null, { params: { result, ...(notes !== undefined ? { notes } : {}) } });
export const deleteCompliance = (id) => axiosInstance.delete(`/compliance/${id}`);
export const downloadComplianceReport = () =>
  axiosInstance.get('/compliance/report/download', { responseType: 'blob' });

// Audits
export const getAudits = () => axiosInstance.get('/audits');
export const getAuditById = (id) => axiosInstance.get(`/audits/${id}`);
export const getAuditsByOfficer = (officerId) =>
  axiosInstance.get(`/audits/officer/${officerId}`);
export const createAudit = (data) => axiosInstance.post('/audits', data);
export const updateAuditStatus = (id, status, findings) =>
  axiosInstance.patch(`/audits/${id}/status`, null, {
    params: { status, findings },
  });

