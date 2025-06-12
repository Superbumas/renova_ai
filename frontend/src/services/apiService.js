import axios from 'axios';

// First check window.ENV (runtime config), then env vars, then fallback URL
const API_BASE_URL = (window.ENV && window.ENV.API_BASE_URL) || 
                     process.env.REACT_APP_API_BASE_URL || 
                     process.env.REACT_APP_API_URL || 
                     'https://renova.andrius.cloud';

console.log('Using API base URL:', API_BASE_URL);

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

  // Debug method - gets the raw response with full headers for a job
  getRawJobData: async (jobId) => {
    try {
      console.log(`Fetching raw data for job ${jobId}`);
      const response = await axios.get(`${API_BASE_URL}/api/results/${jobId}`, {
        transformResponse: [(data) => data], // prevent JSON parsing
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
      
      console.log('Raw API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      });
      
      // Try to parse the response
      try {
        const parsedData = JSON.parse(response.data);
        console.log('Parsed data:', parsedData);
        return parsedData;
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        return { error: 'Could not parse response', rawData: response.data };
      }
    } catch (error) {
      console.error('Error fetching raw job data:', error);
      return { error: error.message };
    }
  }
};

export default apiService; 