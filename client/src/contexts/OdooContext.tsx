import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { OdooConnector } from '@/lib/odoo.connector';
import type { OdooConnectorConfig } from '@/lib/odoo.types';

interface OdooContextType {
  connector: OdooConnector | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: (config: OdooConnectorConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  userId: number | null;
  userName: string | null;
}

const OdooContext = createContext<OdooContextType | undefined>(undefined);

export function OdooProvider({ children }: { children: ReactNode }) {
  const [connector, setConnector] = useState<OdooConnector | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Initialize with stored credentials
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        const storedConfig = localStorage.getItem('odoo_config');
        if (storedConfig) {
          const config = JSON.parse(storedConfig);
          await connectToOdoo(config);
        }
      } catch (err) {
        console.error('Failed to initialize Odoo connection:', err);
      }
    };

    initializeConnection();
  }, []);

  const connectToOdoo = async (config: OdooConnectorConfig) => {
    setIsLoading(true);
    setError(null);

    try {
      const newConnector = new OdooConnector(config);
      await newConnector.authenticate();

      // Get current user info
      const session = newConnector.getSession();
      if (session) {
        setUserId(session.uid);
        setUserName(session.username);
      }

      setConnector(newConnector);
      setIsConnected(true);

      // Store config for future use (without password)
      const safeConfig = { ...config };
      delete (safeConfig as any).password;
      localStorage.setItem('odoo_config', JSON.stringify(safeConfig));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      setIsConnected(false);
      console.error('Odoo connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      if (connector) {
        // Optional: Call logout endpoint if available
        // await connector.execute('auth', 'logout', []);
      }
      setConnector(null);
      setIsConnected(false);
      setUserId(null);
      setUserName(null);
      localStorage.removeItem('odoo_config');
    } catch (err) {
      console.error('Disconnect error:', err);
    }
  };

  return (
    <OdooContext.Provider
      value={{
        connector,
        isConnected,
        isLoading,
        error,
        connect: connectToOdoo,
        disconnect,
        userId,
        userName,
      }}
    >
      {children}
    </OdooContext.Provider>
  );
}

export function useOdoo() {
  const context = useContext(OdooContext);
  if (context === undefined) {
    throw new Error('useOdoo must be used within OdooProvider');
  }
  return context;
}
