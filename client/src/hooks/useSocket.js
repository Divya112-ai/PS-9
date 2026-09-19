import { useEffect, useRef } from 'react';
import socket, { connectSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';

/**
 * Connect to Socket.IO once authenticated. Automatically disconnects on logout.
 */
export const useSocketConnection = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    }
  }, [isAuthenticated]);
};

/**
 * Subscribe to a Socket.IO event. Auto-cleans up on unmount.
 *
 * Usage:
 *   useSocketEvent('incident:created', (payload) => {
 *     setIncidents((prev) => [payload, ...prev]);
 *   });
 */
export const useSocketEvent = (eventName, handler) => {
  const handlerRef = useRef(handler);

  // Keep the ref updated with the latest handler
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!eventName) return;

    const wrapped = (...args) => handlerRef.current?.(...args);
    socket.on(eventName, wrapped);

    return () => {
      socket.off(eventName, wrapped);
    };
  }, [eventName]);
};