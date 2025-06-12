import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Button, Skeleton } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const ResultViewer = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const checkResultStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/results/${jobId}`);
        console.log('Result data:', response.data);
        setResult(response.data);

        if (response.data.status === 'completed') {
          console.log('Image URL:', response.data.result_url);
          setLoading(false);
        } else if (response.data.status === 'failed') {
          console.error('Generation failed:', response.data.error);
          setError(`Generation failed: ${response.data.error || 'Unknown error'}`);
          setLoading(false);
        } else {
          // Still processing, check again in 2 seconds
          setTimeout(checkResultStatus, 2000);
        }
      } catch (err) {
        console.error('Error fetching result:', err);
        setError('Error fetching result: ' + (err.response?.data?.error || err.message));
        setLoading(false);
      }
    };

    checkResultStatus();
  }, [jobId]);

  const handleImageLoad = () => {
    console.log('Image loaded successfully');
    setImageLoaded(true);
  };

  const handleImageError = () => {
    console.error('Error loading image from URL:', result?.result_url);
    setImageError(true);
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Box sx={{ p: 2, maxWidth: '1200px', mx: 'auto' }}>
      <Button variant="outlined" onClick={handleBack} sx={{ mb: 2 }}>
        Back to Design
      </Button>

      <Typography variant="h4" gutterBottom>
        Design Result
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Generating your design...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      ) : (
        <Box>
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status: {result?.status}
            </Typography>
            {result?.prompt && (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                <strong>Prompt:</strong> {result.prompt}
              </Typography>
            )}
          </Paper>

          {result?.result_url ? (
            <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
              {!imageLoaded && !imageError && <Skeleton variant="rectangular" height={500} />}
              {imageError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Failed to load image from URL: {result.result_url}
                </Alert>
              )}
              <img
                src={result.result_url}
                alt="Generated Design"
                style={{ 
                  width: '100%', 
                  display: imageError ? 'none' : 'block',
                  visibility: imageLoaded ? 'visible' : 'hidden'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </Paper>
          ) : (
            <Alert severity="warning" sx={{ my: 2 }}>
              No result image available. Status: {result?.status}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ResultViewer; 