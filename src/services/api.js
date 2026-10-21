import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
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

export const errMsg = (e) =>
  e?.response?.data?.message || e?.message || 'Something went wrong. Please try again.';

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
  match: (problemId) => API.get('/teams/match', { params: { problemId } }).then((r) => r.data),
  analyze: (teamId) => API.get(`/teams/${teamId}/analyze`).then((r) => r.data),
  invite: (teamId, userId) => API.post(`/teams/${teamId}/invite`, { userId }).then((r) => r.data),
  respond: (teamId, userId, action) => API.post(`/teams/${teamId}/respond`, { userId, action }).then((r) => r.data),
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
  pendingCertificates: () => API.get('/users/certificates/pending').then((r) => r.data),
  verifyCertificate: (certId, action) => API.put(`/users/certificates/${certId}/verify`, { action }).then((r) => r.data),
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

export const statsApi = {
  get: () => API.get('/stats').then((r) => r.data),
};

export default API;
