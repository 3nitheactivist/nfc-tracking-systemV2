import { useState, useCallback } from 'react';
import { libraryService } from '../utils/firebase/libraryService';
import { message } from 'antd';

export const useLibraryAccess = () => {
  const [loading, setLoading] = useState(false);
  const [accessHistory, setAccessHistory] = useState([]);

  const handleNFCScan = useCallback(async (nfcId) => {
    try {
      setLoading(true);
      await libraryService.recordAccess(nfcId, 'ENTRY');
      message.success('Library access granted');
      
      // Refresh access history
      const history = await libraryService.getStudentAccessHistory(nfcId);
      setAccessHistory(history);
    } catch (error) {
      message.error('Failed to record library access');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    accessHistory,
    handleNFCScan
  };
}; 