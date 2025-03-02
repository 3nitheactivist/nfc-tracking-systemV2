import { useState, useCallback, useEffect } from 'react';

export const useNFCScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [lastScannedId, setLastScannedId] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'

  // Mock function to simulate NFC scanning
  const startScan = useCallback(() => {
    setScanning(true);
    setScanStatus('scanning');
    
    // Simulate a scan after 2 seconds
    setTimeout(() => {
      // Generate a random mock NFC ID
      const mockNfcId = `NFC-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      setLastScannedId(mockNfcId);
      setScanStatus('success');
    }, 2000);
  }, []);

  const stopScan = useCallback(() => {
    setScanning(false);
    setScanStatus('idle');
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scanning) {
        stopScan();
      }
    };
  }, [scanning, stopScan]);

  return {
    startScan,
    stopScan,
    scanning,
    lastScannedId,
    scanStatus
  };
}; 