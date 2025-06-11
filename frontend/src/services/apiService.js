import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const apiService = {
  // Health check
  healthCheck: async () => {
    const response = await apiClient.get('/api/health');
    return response.data;
  },

  // Generate design/redesign
  generateDesign: async (data) => {
    const response = await apiClient.post('/api/generate', data);
    return response.data;
  },

  // Get generation results
  getResults: async (jobId) => {
    const response = await apiClient.get(`/api/results/${jobId}`);
    return response.data;
  },

  // Enhance prompt with OpenAI
  enhancePrompt: async (prompt) => {
    const response = await apiClient.post('/api/chat', { prompt });
    return response.data;
  },

  // Refine existing design based on user feedback
  refineDesign: async (data) => {
    const response = await apiClient.post('/api/refine', data);
    return response.data;
  },

  // Analyze furniture in generated design
  analyzeFurniture: async (data) => {
    const response = await apiClient.post('/api/analyze-furniture', data);
    return response.data;
  },

  // Generate architectural blueprint
  generateBlueprint: async (data) => {
    const response = await apiClient.post('/api/generate-blueprint', data);
    return response.data;
  },

  // Generate advanced furniture blueprint with CAD precision
  generateFurnitureBlueprint: async (data) => {
    const response = await apiClient.post('/api/generate-furniture-blueprint', data);
    return response.data;
  },

  // List all jobs (for debugging)
  listJobs: async () => {
    const response = await apiClient.get('/api/jobs');
    return response.data;
  },
};

export default apiService; 