import axios from 'axios';

// create axios instance pointing to django backend
const api = axios.create({
  baseURL: 'http://localhost:8001/api',
});

// helper function to fetch persons with dynamic filters
export const fetchPersons = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return api.get(`/persons/?${params}`);
};

export default api;