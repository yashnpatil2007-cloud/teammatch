import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000, // 60s timeout to comfortably accommodate free-tier cold starts
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('teammatch_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('teammatch_token');
      localStorage.removeItem('teammatch_user');
      window.dispatchEvent(new Event('teammatch:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const errMsg = (e) => {
  if (e?.code === 'ECONNABORTED' || (typeof e?.message === 'string' && e.message.toLowerCase().includes('timeout'))) {
    return 'The server took longer than expected to respond. On the free tier, the backend sleeps when inactive and can take 30-45 seconds to wake up. Please wait a moment and try again.';
  }
  if (e?.message === 'Network Error' || e?.code === 'ERR_NETWORK') {
    return 'Unable to reach the server. The backend may be spinning up from sleep or your connection was interrupted. Please retry in a few seconds.';
  }
  return e?.response?.data?.message || e?.message || 'Something went wrong. Please try again.';
};

export const resolveFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const backendBase = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendBase}${cleanPath}`;
};

export const authApi = {
  login: (email, password) => API.post('/auth/login', { email, password }).then((r) => r.data),
  register: (payload) => API.post('/auth/register', payload).then((r) => r.data),
  me: () => API.get('/auth/me').then((r) => r.data),
};

export const problemApi = {
  list: (params) => API.get('/problems', { params }).then((r) => r.data),
  get: (id) => API.get(`/problems/${id}`).then((r) => r.data),
  create: (payload) => API.post('/problems', payload).then((r) => r.data),
  update: (id, payload) => API.put(`/problems/${id}`, payload).then((r) => r.data),
  remove: (id) => API.delete(`/problems/${id}`).then((r) => r.data),
  analyze: (title, description) => API.post('/problems/analyze', { title, description }).then((r) => r.data),
};

export const teamApi = {
  list: (params) => API.get('/teams', { params }).then((r) => r.data),
  mine: () => API.get('/teams/mine').then((r) => r.data),
  get: (id) => API.get(`/teams/${id}`).then((r) => r.data),
  create: (payload) => API.post('/teams', payload).then((r) => r.data),
  update: (id, payload) => API.put(`/teams/${id}`, payload).then((r) => r.data),
  remove: (id) => API.delete(`/teams/${id}`).then((r) => r.data),
  removeMember: (id, userId) => API.post(`/teams/${id}/remove-member`, { userId }).then((r) => r.data),
  match: (paramsOrProblemId) => {
    const params =
      typeof paramsOrProblemId === 'object' && paramsOrProblemId !== null
        ? paramsOrProblemId
        : { problemId: paramsOrProblemId };
    return API.get('/teams/match', { params }).then((r) => r.data);
  },
  requestJoin: (teamId) => API.post(`/teams/${teamId}/request-join`).then((r) => r.data),
  analyze: (teamId) => API.get(`/teams/${teamId}/analyze`).then((r) => r.data),
  invite: (teamId, userId) => API.post(`/teams/${teamId}/invite`, { userId }).then((r) => r.data),
  respond: (teamId, userId, action) => API.post(`/teams/${teamId}/respond`, { userId, action }).then((r) => r.data),
  workspace: (teamId) => API.get(`/teams/${teamId}/workspace`).then((r) => r.data),
  createTask: (teamId, payload) => API.post(`/teams/${teamId}/tasks`, payload).then((r) => r.data),
  updateTask: (teamId, taskId, payload) => API.put(`/teams/${teamId}/tasks/${taskId}`, payload).then((r) => r.data),
  deleteTask: (teamId, taskId) => API.delete(`/teams/${teamId}/tasks/${taskId}`).then((r) => r.data),
  addMilestone: (teamId, payload) => API.post(`/teams/${teamId}/milestones`, payload).then((r) => r.data),
  updateMilestone: (teamId, milestoneId, payload) => API.put(`/teams/${teamId}/milestones/${milestoneId}`, payload).then((r) => r.data),
  addResource: (teamId, payload) => API.post(`/teams/${teamId}/resources`, payload).then((r) => r.data),
  messages: (teamId) => API.get(`/teams/${teamId}/messages`).then((r) => r.data),
  postMessage: (teamId, text) => API.post(`/teams/${teamId}/messages`, { text }).then((r) => r.data),
};

export const userApi = {
  leaderboard: (metric) => API.get('/users/leaderboard', { params: { metric } }).then((r) => r.data),
  list: (params) => API.get('/users', { params }).then((r) => r.data),
  get: (id) => API.get(`/users/${id}`).then((r) => r.data),
  updateProfile: (payload) => API.put('/users/profile', payload).then((r) => r.data),
  submitQuiz: (payload) => API.post('/users/quiz', payload).then((r) => r.data),
  quizHistory: () => API.get('/users/me/quiz-history').then((r) => r.data),
  update: (id, payload) => API.put(`/users/${id}`, payload).then((r) => r.data),
  remove: (id) => API.delete(`/users/${id}`).then((r) => r.data),
  addCertificate: (payload) => API.post('/users/certificates', payload).then((r) => r.data),
  uploadCertificate: (formData) =>
    API.post('/users/certificates/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
  deleteCertificate: (certId) => API.delete(`/users/certificates/${certId}`).then((r) => r.data),
  uploadResume: (formData) =>
    API.post('/users/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
  deleteResume: () => API.delete('/users/resume').then((r) => r.data),
  uploadProfilePhoto: (formData, onProgress) =>
    API.post('/users/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }).then((r) => r.data),
  deleteProfilePhoto: () => API.delete('/users/profile-photo').then((r) => r.data),
  pendingCertificates: (params) => API.get('/users/certificates/pending', { params }).then((r) => r.data),
  verifyCertificate: (certId, action, rejectionReason) =>
    API.put(`/users/certificates/${certId}/verify`, { action, rejectionReason }).then((r) => r.data),
};

export const reviewApi = {
  create: (payload) => API.post('/reviews', payload).then((r) => r.data),
  byUser: (userId) => API.get(`/reviews/${userId}`).then((r) => r.data),
  all: () => API.get('/reviews').then((r) => r.data),
};

export const quizApi = {
  list: () => API.get('/quizzes').then((r) => r.data),
  getById: (id) => API.get(`/quizzes/id/${id}`).then((r) => r.data),
  bySkill: (skill) => API.get(`/quizzes/${skill}`).then((r) => r.data),
  create: (payload) => API.post('/quizzes', payload).then((r) => r.data),
  update: (id, payload) => API.put(`/quizzes/${id}`, payload).then((r) => r.data),
  remove: (id) => API.delete(`/quizzes/${id}`).then((r) => r.data),
  grade: (skill, answers) => API.post('/quizzes/grade', { skill, answers }).then((r) => r.data),
};

export const assessmentApi = {
  overview: () => API.get('/assessments/overview').then((r) => r.data),
  aptitudeQuestions: () => API.get('/assessments/aptitude/questions').then((r) => r.data),
  submitAptitude: (payload) => API.post('/assessments/aptitude/submit', payload).then((r) => r.data),
  personalityQuestions: () => API.get('/assessments/personality/questions').then((r) => r.data),
  submitPersonality: (payload) => API.post('/assessments/personality/submit', payload).then((r) => r.data),
  technicalSkills: () => API.get('/assessments/technical/skills').then((r) => r.data),
  technicalQuestions: (skill) => API.get(`/assessments/technical/${skill}/questions`).then((r) => r.data),
  submitTechnical: (payload) => API.post('/assessments/technical/submit', payload).then((r) => r.data),
  myHistory: (params) => API.get('/assessments/my-history', { params }).then((r) => r.data),
  adminStats: () => API.get('/assessments/admin/stats').then((r) => r.data),
  addAdminQuestion: (payload) => API.post('/assessments/admin/questions', payload).then((r) => r.data),
};

export const statsApi = {
  get: () => API.get('/stats').then((r) => r.data),
  admin: () => API.get('/stats/admin').then((r) => r.data),
};

export const submissionApi = {
  submit: (payload) => API.post('/submissions', payload).then((r) => r.data),
  getByTeam: (teamId) => API.get(`/submissions/team/${teamId}`).then((r) => r.data),
  list: (params) => API.get('/submissions', { params }).then((r) => r.data),
  getOne: (id) => API.get(`/submissions/${id}`).then((r) => r.data),
  review: (id, payload) => API.post(`/submissions/${id}/review`, payload).then((r) => r.data),
  upload: (formData) =>
    API.post('/submissions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data),
};

export const notificationApi = {
  list: (params) => API.get('/notifications', { params }).then((r) => r.data),
  unreadCount: () => API.get('/notifications/unread-count').then((r) => r.data),
  markAsRead: (id) => API.put(`/notifications/${id}/read`).then((r) => r.data),
  markAllAsRead: () => API.put('/notifications/read-all').then((r) => r.data),
  delete: (id) => API.delete(`/notifications/${id}`).then((r) => r.data),
};

export const healthApi = {
  check: () => API.get('/health').then((r) => r.data),
};

export default API;
