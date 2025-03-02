import { useState, useCallback, useEffect } from 'react';

export const useNFCScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [lastScannedId, setLastScannedId] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'
  
  // Start scanning for NFC tags
  const startScan = useCallback(() => {
    setScanning(true);
    setScanStatus('scanning');
    setLastScannedId(null);
    
    // In a real implementation, you would connect to the NFC reader here
    // For now, we'll simulate a successful scan after a delay
    console.log('NFC scanning started');
  }, []);
  
  // Stop scanning for NFC tags
  const stopScan = useCallback(() => {
    setScanning(false);
    setScanStatus('idle');
    
    // In a real implementation, you would disconnect from the NFC reader here
    console.log('NFC scanning stopped');
  }, []);
  
  // Simulate a successful scan (for testing)
  const simulateScan = useCallback((id) => {
    if (scanning) {
      setLastScannedId(id);
      setScanStatus('success');
      setScanning(false);
    }
  }, [scanning]);
  
  return {
    scanning,
    startScan,
    stopScan,
    lastScannedId,
    scanStatus,
    simulateScan
  };
}; 