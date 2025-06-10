import { useEffect, useState, useCallback } from 'react';
import { PaymanClient } from '@paymanai/payman-ts';
import { Button } from '@mui/material';

interface PaymanConnectProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onTokenExchange?: (isExchanging: boolean) => void;
}

const PaymanConnect = ({ onConnect, onDisconnect, onTokenExchange }: PaymanConnectProps = {}) => {
  const [isConnected, setIsConnected] = useState(false);

  // Memoize the message handler to keep it stable between renders
  const handleMessage = useCallback(async (event: MessageEvent) => {
    if (event.data.type === 'payman-oauth-redirect') {
      const url = new URL(event.data.redirectUri);
      const code = url.searchParams.get('code');
      if (code) {
        try {
          // Signal start of token exchange
          if (onTokenExchange) onTokenExchange(true);

          // Initialize PaymanClient with auth code
          const client = PaymanClient.withAuthCode(
            {
              clientId: import.meta.env.VITE_PAYMAN_CLIENT_ID,
              clientSecret: import.meta.env.VITE_PAYMAN_CLIENT_SECRET,
            },
            code
          );

          // Get access token
          const tokenResponse = await client.getAccessToken();
          
          if (!tokenResponse?.accessToken || !tokenResponse?.expiresIn) {
            throw new Error('Invalid token response');
          }

          // Initialize client with token
          const tokenClient = PaymanClient.withToken(
            import.meta.env.VITE_PAYMAN_CLIENT_ID,
            {
              accessToken: tokenResponse.accessToken,
              expiresIn: tokenResponse.expiresIn,
            }
          );

          // Store token in localStorage
          localStorage.setItem('payman_token', tokenResponse.accessToken);
          setIsConnected(true);
          
          // Call onConnect callback
          if (onConnect) onConnect();
        } catch (error) {
          console.error('Token exchange failed:', error);
          if (onDisconnect) onDisconnect();
        } finally {
          // Signal end of token exchange
          if (onTokenExchange) onTokenExchange(false);
        }
      }
    }
  }, [onConnect, onDisconnect, onTokenExchange]);

  useEffect(() => {
    // Check if already connected
    const token = localStorage.getItem('payman_token');
    setIsConnected(!!token);

    // Only proceed with script initialization if not connected
    if (!token) {
      // Remove any existing scripts and event listeners
      const existingScripts = document.querySelectorAll('script[src="https://app.paymanai.com/js/pm.js"]');
      existingScripts.forEach(script => script.remove());

      // Create new script element
      const script = document.createElement('script');
      script.src = 'https://app.paymanai.com/js/pm.js';
      script.setAttribute('data-client-id', import.meta.env.VITE_PAYMAN_CLIENT_ID);
      script.setAttribute('data-scopes', 'read_balance,read_list_wallets,read_list_payees,read_list_transactions,write_create_payee,write_send_payment,write_create_wallet');
      script.setAttribute('data-redirect-uri', `${window.location.origin}/oauth/callback`);
      script.setAttribute('data-target', '#payman-connect');
      script.setAttribute('data-dark-mode', 'false');
      script.setAttribute('data-styles', JSON.stringify({
        borderRadius: '8px',
        fontSize: '14px',
        width: '100%'
      }));

      // Add event listener
      window.addEventListener('message', handleMessage);

      // Append script to document
      document.body.appendChild(script);

      // Cleanup function
      return () => {
        window.removeEventListener('message', handleMessage);
        const scriptsToRemove = document.querySelectorAll('script[src="https://app.paymanai.com/js/pm.js"]');
        scriptsToRemove.forEach(script => script.remove());
      };
    }
  }, [handleMessage]);

  const handleDisconnect = () => {
    // Remove the script when disconnecting
    const scriptsToRemove = document.querySelectorAll('script[src="https://app.paymanai.com/js/pm.js"]');
    scriptsToRemove.forEach(script => script.remove());
    
    localStorage.removeItem('payman_token');
    setIsConnected(false);
    if (onDisconnect) onDisconnect();
  };

  if (isConnected) {
    return (
      <Button 
        variant="contained" 
        color="secondary" 
        onClick={handleDisconnect}
        fullWidth
        sx={{ 
          bgcolor: '#1B4D3E',
          '&:hover': {
            bgcolor: '#143729'
          }
        }}
      >
        Disconnect from Payman
      </Button>
    );
  }

  return <div id="payman-connect" style={{ marginTop: '20px' }}></div>;
};

export default PaymanConnect; 