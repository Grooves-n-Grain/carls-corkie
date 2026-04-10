import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Pin, ServerToClientEvents, ClientToServerEvents } from '../types/pin';
import { config } from '../config';
import { apiFetch } from '../utils/apiFetch';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'reconnected';
export type TransportType = 'websocket' | 'polling' | 'unknown';

export function useSocket() {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [transport, setTransport] = useState<TransportType>('unknown');
  const wasConnectedRef = useRef(false);

  useEffect(() => {
    const newSocket: TypedSocket = io(config.socketUrl, {
      auth: { token: config.token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect_error', (err) => {
      console.error('[corkie] socket connect_error:', err.message);
      if (err.message === 'Unauthorized') {
        setConnectionStatus('disconnected');
        window.dispatchEvent(new CustomEvent('corkie:auth-error', { detail: { source: 'socket' } }));
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to corkboard server');
      setIsConnected(true);
      
      // Get transport type
      const currentTransport = newSocket.io.engine.transport.name as TransportType;
      setTransport(currentTransport);
      console.log(`Transport: ${currentTransport}`);
      
      // Listen for transport upgrades (polling -> websocket)
      newSocket.io.engine.on('upgrade', (upgradedTransport: { name: string }) => {
        setTransport(upgradedTransport.name as TransportType);
        console.log(`Transport upgraded to: ${upgradedTransport.name}`);
      });
      
      // Show "reconnected" toast if this is a reconnection
      if (wasConnectedRef.current) {
        setConnectionStatus('reconnected');
        // Clear the "reconnected" status after 3 seconds
        setTimeout(() => setConnectionStatus('connected'), 3000);
      } else {
        setConnectionStatus('connected');
      }
      wasConnectedRef.current = true;
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    newSocket.io.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}...`);
      setConnectionStatus('reconnecting');
    });

    // Sync all pins
    newSocket.on('pins:sync', (syncedPins) => {
      setPins(syncedPins);
    });

    // Handle individual pin events
    newSocket.on('pin:created', (pin) => {
      setPins((prev) => {
        // Add to beginning and re-sort
        const updated = [pin, ...prev.filter((p) => p.id !== pin.id)];
        return sortPins(updated);
      });
    });

    newSocket.on('pin:updated', (pin) => {
      setPins((prev) => {
        const updated = prev.map((p) => (p.id === pin.id ? pin : p));
        return sortPins(updated);
      });
    });

    newSocket.on('pin:deleted', (id) => {
      setPins((prev) => prev.filter((p) => p.id !== id));
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const completePin = useCallback(
    (id: string) => {
      socket?.emit('pin:complete', id);
    },
    [socket]
  );

  const dismissPin = useCallback(
    (id: string) => {
      socket?.emit('pin:dismiss', id);
    },
    [socket]
  );

  const deletePin = useCallback(
    async (id: string) => {
      try {
        await apiFetch(`/api/pins/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete pin:', err);
      }
    },
    []
  );

  const toggleComplete = useCallback(
    (id: string, currentStatus: string) => {
      if (currentStatus === 'completed') {
        // Uncomplete - set back to active via REST API
        apiFetch(`/api/pins/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'active' })
        }).catch((err) => console.error('Failed to uncomplete pin:', err));
      } else if (currentStatus === 'dismissed') {
        // Dismiss (for alerts)
        socket?.emit('pin:dismiss', id);
      } else {
        // Complete
        socket?.emit('pin:complete', id);
      }
    },
    [socket]
  );

  const requestSync = useCallback(() => {
    socket?.emit('pins:request');
  }, [socket]);

  return {
    pins,
    isConnected,
    connectionStatus,
    transport,
    completePin,
    dismissPin,
    deletePin,
    toggleComplete,
    requestSync
  };
}

// Sort pins: active first, then by priority, then by date
function sortPins(pins: Pin[]): Pin[] {
  return [...pins].sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === 'active') return -1;
      if (b.status === 'active') return 1;
    }
    if (a.priority !== b.priority) {
      return (a.priority || 3) - (b.priority || 3);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
