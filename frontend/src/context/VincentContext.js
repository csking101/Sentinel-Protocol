'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const VincentContext = createContext(null);

const VINCENT_JWT_KEY = 'VINCENT_AUTH_JWT';

export function VincentProvider({ children }) {
  const [vincentClient, setVincentClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);
  const [jwt, setJwt] = useState(null);
  const [error, setError] = useState(null);
  const [VincentWebAuth, setVincentWebAuth] = useState(null);
  const [VincentJWT, setVincentJWT] = useState(null);

  // Dynamically import Vincent SDK modules
  useEffect(() => {
    const loadModules = async () => {
      try {
        const [webAuthModule, jwtModule] = await Promise.all([
          import('@lit-protocol/vincent-app-sdk/webAuthClient'),
          import('@lit-protocol/vincent-app-sdk/jwt')
        ]);
        setVincentWebAuth(webAuthModule);
        setVincentJWT(jwtModule);
      } catch (err) {
        console.error('Failed to load Vincent SDK modules:', err);
        setError(err.message);
        setIsConnecting(false);
      }
    };
    
    loadModules();
  }, []);

  // Initialize Vincent client on mount
  useEffect(() => {
    if (!VincentWebAuth) return;
    
    const appIdStr = process.env.NEXT_PUBLIC_VINCENT_APP_ID;
    
    if (!appIdStr || appIdStr === 'your-vincent-app-id' || appIdStr === 'your-vincent-app-id-here') {
      setError('Please set NEXT_PUBLIC_VINCENT_APP_ID in .env.local file');
      setIsConnecting(false);
      return;
    }
    
    const appId = Number(appIdStr);
    
    if (isNaN(appId)) {
      setError('Invalid NEXT_PUBLIC_VINCENT_APP_ID - must be a number');
      setIsConnecting(false);
      return;
    }
    
    try {
      const client = VincentWebAuth.getWebAuthClient({ 
        appId,
        appVersion: 8  // Specify version 6
      });
      setVincentClient(client);
    } catch (err) {
      console.error('Failed to initialize Vincent client:', err);
      setError(err.message);
      setIsConnecting(false);
    }
  }, [VincentWebAuth]);

  // Handle authentication on mount and when client is ready
  useEffect(() => {
    if (!vincentClient || !VincentJWT) return;

    const handleAuth = async () => {
      try {
        // Check if URI contains Vincent JWT (user just logged in)
        if (vincentClient.uriContainsVincentJWT()) {
          try {
            // Try to use Vincent's decode method first
            let decoded = null;
            let newJwt = null;
            
            try {
              const result = vincentClient.decodeVincentJWTFromUri(window.location.origin);
              if (result && result.decoded && result.jwt) {
                decoded = result.decoded;
                newJwt = result.jwt;
              }
            } catch (vincentDecodeError) {
              console.warn('Vincent decode failed, using manual decode');
            }
            
            // If Vincent's decode failed, manually extract and decode the JWT from URL
            if (!newJwt) {
              const urlParams = new URLSearchParams(window.location.search);
              const jwtParam = urlParams.get('jwt') || urlParams.get('token');
              
              if (jwtParam) {
                newJwt = jwtParam;
                const payloadBase64 = newJwt.split('.')[1];
                decoded = JSON.parse(atob(payloadBase64));
              } else {
                throw new Error('No JWT found in URL parameters');
              }
            }
            
            // Store JWT
            localStorage.setItem(VINCENT_JWT_KEY, newJwt);
            setJwt(newJwt);
            
            // Extract wallet address from decoded JWT
            const address = decoded?.pkpInfo?.ethAddress || 
                          decoded?.address || 
                          decoded?.iss || 
                          decoded?.sub;
            
            if (address) {
              setWalletAddress(address);
              setIsConnected(true);
            }
            
            setIsConnecting(false);
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (decodeError) {
            console.error('Failed to decode Vincent JWT:', decodeError);
            setError(`Authentication failed: ${decodeError.message}`);
            setIsConnecting(false);
          }
        } else {
          // Check for existing JWT
          const storedJwt = localStorage.getItem(VINCENT_JWT_KEY);
          
          if (storedJwt) {
            try {
              // Decode the JWT to check expiration
              const decoded = JSON.parse(atob(storedJwt.split('.')[1]));
              
              // Check if expired using the decoded JWT
              if (!VincentJWT.isExpired(decoded)) {
                setJwt(storedJwt);
                const address = decoded?.pkpInfo?.ethAddress || 
                              decoded?.address || 
                              decoded?.iss || 
                              decoded?.sub;
                if (address) {
                  setWalletAddress(address);
                  setIsConnected(true);
                }
              } else {
                // JWT is expired, remove it
                localStorage.removeItem(VINCENT_JWT_KEY);
              }
            } catch (e) {
              console.error('Failed to decode stored JWT:', e);
              localStorage.removeItem(VINCENT_JWT_KEY);
            }
          }
          
          setIsConnecting(false);
        }
      } catch (err) {
        console.error('Error handling Vincent auth:', err);
        setError(err.message);
        setIsConnecting(false);
      }
    };

    handleAuth();
  }, [vincentClient, VincentJWT]);

  const connect = () => {
    if (!vincentClient) {
      setError('Vincent client not initialized');
      return;
    }

    const redirectUri = typeof window !== 'undefined' ? window.location.origin : '';
    
    if (!redirectUri) {
      setError('Cannot determine redirect URI');
      return;
    }
    
    vincentClient.redirectToConnectPage({ redirectUri });
  };

  const disconnect = () => {
    localStorage.removeItem(VINCENT_JWT_KEY);
    setJwt(null);
    setIsConnected(false);
    setWalletAddress(null);
    setError(null);
  };

  const value = {
    vincentClient,
    isConnected,
    isConnecting,
    walletAddress,
    jwt,
    error,
    connect,
    disconnect,
  };

  return (
    <VincentContext.Provider value={value}>
      {children}
    </VincentContext.Provider>
  );
}

export function useVincent() {
  const context = useContext(VincentContext);
  if (!context) {
    throw new Error('useVincent must be used within a VincentProvider');
  }
  return context;
}
