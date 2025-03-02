import { useState, useEffect } from 'react';
import { Card, message } from 'antd';

const NFCScanner = ({ onScan, scannerType }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);

  useEffect(() => {
    // Check if NFC is supported
    if ('NDEFReader' in window) {
      setNfcSupported(true);
    }
  }, []);

  const startScanning = async () => {
    if (!nfcSupported) {
      message.error('NFC is not supported on this device');
      return;
    }

    try {
      setIsScanning(true);
      const ndef = new NDEFReader();
      await ndef.scan();
      
      ndef.addEventListener("reading", ({ serialNumber }) => {
        onScan(serialNumber, scannerType);
      });

    } catch (error) {
      message.error('Error accessing NFC: ' + error);
      setIsScanning(false);
    }
  };

  return (
    <Card title={`${scannerType} Scanner`}>
      {/* Scanner UI implementation */}
    </Card>
  );
};

export default NFCScanner;
