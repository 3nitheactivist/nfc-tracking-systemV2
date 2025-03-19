import { useState, useEffect, useCallback, useRef } from 'react';

export function useNFCScanner() {
  const [scanning, setScanning] = useState(false);
  const [lastScannedId, setLastScannedId] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, success, error
  const socketRef = useRef(null);
  const timeoutRef = useRef(null);

  // Handle received fingerprint ID
  const handleReceivedId = useCallback((id) => {
    console.log('Received fingerprint ID:', id);
    
    // Update states immediately
    setLastScannedId(id);
    setScanStatus('success');
    setScanning(false);
    
    // Clear timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Initialize WebSocket connection
  const initWebSocket = useCallback(() => {
    // Close existing connection if any
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }

    try {
      const socket = new WebSocket('ws://localhost:8080');
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connection established');
        setScanStatus('scanning');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Raw WebSocket data:', data);

          if (data.fingerprintID) {
            // Process ID regardless of scanning state
            const normalizedId = data.fingerprintID.toString().trim();
            console.log('Processing fingerprint ID:', normalizedId);
            handleReceivedId(normalizedId);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setScanStatus('error');
        setScanning(false);
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed');
        setScanStatus('idle');
        setScanning(false);
      };

      return socket;
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setScanStatus('error');
      setScanning(false);
      return null;
    }
  }, [handleReceivedId]);

  // Start scanning
  const startScan = useCallback(() => {
    console.log('Starting scan...');
    
    // Make sure any existing connection is fully closed
    if (socketRef.current) {
      console.log('Closing existing connection before starting new scan');
      socketRef.current.close();
      socketRef.current = null;
    }
    
    // Reset states
    setLastScannedId(null);
    setScanStatus('scanning');
    setScanning(true);
    
    // Short delay to ensure previous connection is closed
    setTimeout(() => {
      const socket = initWebSocket();
      if (!socket) {
        setScanStatus('error');
        setScanning(false);
        return;
      }

      // Set timeout to auto-cancel scan after 30 seconds
      timeoutRef.current = setTimeout(() => {
        console.log('Scan timeout');
        stopScan();
      }, 30000);
    }, 100);
  }, [initWebSocket]);

  // Stop scanning
  const stopScan = useCallback(() => {
    console.log('Stopping scan');
    setScanning(false);
    setScanStatus('idle');

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    scanning,
    startScan,
    stopScan,
    lastScannedId,
    scanStatus
  };
} 