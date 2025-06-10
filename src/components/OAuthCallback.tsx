import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      
      if (!code) {
        navigate('/?error=auth_failed');
        return;
      }

      try {
        // Create Basic Auth header
        const authHeader = `Basic ${btoa(`${import.meta.env.VITE_PAYMAN_CLIENT_ID}:${import.meta.env.VITE_PAYMAN_CLIENT_SECRET}`)}`;
        
        // Exchange code for token
        const response = await axios.post(
          'https://agent.payman.ai/api/oauth2/token',
          {
            grant_type: 'authorization_code',
            code: code,
          },
          {
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json'
            }
          }
        );

        // Store the token and navigate on success
        if (response.status === 200 && response.data.access_token) {
          localStorage.setItem('payman_token', response.data.access_token);
          navigate('/?success=true');
        } else {
          throw new Error('No access token received');
        }
      } catch (error) {
        console.error('Token exchange failed:', error);
        navigate('/?error=auth_failed');
      }
    };

    handleCallback();
  }, [location, navigate]);

  return null;
};

export default OAuthCallback; 