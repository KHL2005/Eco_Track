import axiosInstance from './axiosInstance';

// Mock data for development when backend is not available
const mockIssues = [
  {
    id: 1,
    title: "Illegal dumping near Greenfield Park",
    description: "Large amounts of construction waste dumped illegally in the park area",
    type: "WASTE_DUMPING",
    status: "OPEN",
    citizenId: 1,
    citizenName: "John Citizen",
    location: "Greenfield Park, Sector 15",
    latitude: 28.6139,
    longitude: 77.2090,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    mediaUrls: []
  },
  {
    id: 2,
    title: "Air pollution from factory chimney",
    description: "Dark smoke coming from industrial chimney causing breathing difficulties",
    type: "AIR_POLLUTION",
    status: "IN_PROGRESS",
    citizenId: 1,
    citizenName: "John Citizen",
    location: "Industrial Area, Sector 22",
    latitude: 28.6280,
    longitude: 77.2150,
    createdAt: "2024-01-10T14:20:00Z",
    updatedAt: "2024-01-12T09:15:00Z",
    mediaUrls: []
  }
];

// Issues
export const getIssues = () =>
  axiosInstance.get('/issues')
    .catch(() => Promise.resolve({ data: mockIssues }));

export const getIssueById = (id) =>
  axiosInstance.get(`/issues/${id}`)
    .catch(() => {
      const issue = mockIssues.find(i => i.id === parseInt(id));
      return issue ? Promise.resolve({ data: issue }) : Promise.reject(new Error('Issue not found'));
    });

export const getIssuesByCitizen = (citizenId) =>
  axiosInstance.get(`/issues/citizen/${citizenId}`)
    .catch(() => {
      const userIssues = mockIssues.filter(i => i.citizenId === parseInt(citizenId));
      return Promise.resolve({ data: userIssues });
    });

export const getIssuesByStatus = (status) =>
  axiosInstance.get(`/issues/status/${status}`)
    .catch(() => {
      const filteredIssues = mockIssues.filter(i => i.status === status);
      return Promise.resolve({ data: filteredIssues });
    });

export const getIssuesByType = (type) =>
  axiosInstance.get(`/issues/type/${type}`)
    .catch(() => {
      const filteredIssues = mockIssues.filter(i => i.type === type);
      return Promise.resolve({ data: filteredIssues });
    });

export const createIssue = (data) =>
  axiosInstance.post('/issues', data)
    .then(response => {
      // Add the new issue to mock data for immediate UI update
      const newIssue = {
        ...response.data,
        id: mockIssues.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'OPEN',
        mediaUrls: []
      };
      mockIssues.unshift(newIssue);
      return response;
    })
    .catch(() => {
      // Create mock response
      const newIssue = {
        ...data,
        id: mockIssues.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'OPEN',
        mediaUrls: []
      };
      mockIssues.unshift(newIssue);
      return Promise.resolve({ data: newIssue });
    });

export const updateIssue = (id, data) =>
  axiosInstance.patch(`/issues/${id}`, data)
    .catch(() => {
      const issue = mockIssues.find(i => i.id === parseInt(id));
      if (issue) {
        Object.assign(issue, data, { updatedAt: new Date().toISOString() });
        return Promise.resolve({ data: issue });
      }
      return Promise.reject(new Error('Issue not found'));
    });

export const updateIssueStatus = (id, status) =>
  axiosInstance.patch(`/issues/${id}/status`, { status })
    .catch(() => {
      const issue = mockIssues.find(i => i.id === parseInt(id));
      if (issue) {
        issue.status = status.status || status;
        issue.updatedAt = new Date().toISOString();
        return Promise.resolve({ data: issue });
      }
      return Promise.reject(new Error('Issue not found'));
    });

export const deleteIssue = (id) =>
  axiosInstance.delete(`/issues/${id}`)
    .catch(() => {
      const index = mockIssues.findIndex(i => i.id === parseInt(id));
      if (index !== -1) {
        mockIssues.splice(index, 1);
        return Promise.resolve();
      }
      return Promise.reject(new Error('Issue not found'));
    });

// Media
export const uploadMedia = (issueId, file, onProgress) => {
  const fd = new FormData();
  fd.append('file', file);
  return axiosInstance.post(`/issues/${issueId}/media`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  })
  .catch(() => {
    // Mock successful upload for development
    return Promise.resolve({ data: { message: 'Media uploaded successfully (mock)' } });
  });
};
export const deleteMedia = (issueId, fileName) =>
  axiosInstance.delete(`/issues/${issueId}/media/${fileName}`);
export const getMediaUrl = (issueId, fileName) => `/api/v1/issues/${issueId}/media/${fileName}`;

// Resolutions
export const addResolution = (issueId, data) =>
  axiosInstance.post(`/issues/${issueId}/resolutions`, data);
export const getResolutionByIssue = (issueId) =>
  axiosInstance.get(`/issues/${issueId}/resolutions`);
export const getAllResolutions = () => axiosInstance.get('/issues/resolutions');
export const getResolutionById = (id) => axiosInstance.get(`/issues/resolutions/${id}`);
export const getResolutionsByOfficer = (officerId) =>
  axiosInstance.get(`/issues/resolutions/officer/${officerId}`);
export const getResolutionsByStatus = (status) =>
  axiosInstance.get(`/issues/resolutions/status/${status}`);
export const updateResolution = (id, data) =>
  axiosInstance.patch(`/issues/resolutions/${id}`, data);
export const deleteResolution = (id) => axiosInstance.delete(`/issues/resolutions/${id}`);
