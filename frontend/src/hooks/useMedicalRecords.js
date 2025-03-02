import { useState, useCallback } from 'react';
import { medicalService } from '../utils/firebase/medicalService';
import { studentService } from '../utils/firebase/studentService';
import { message } from 'antd';

export const useMedicalRecords = () => {
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [records, setRecords] = useState([]);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'

  const handleNFCScan = useCallback(async (nfcId) => {
    try {
      setLoading(true);
      setScanStatus('scanning');
      
      // Try multiple formats of the NFC ID
      const variations = getIdVariations(nfcId);
      let studentData = null;
      
      // Try each variation until we find a match
      for (const idVariation of variations) {
        console.log(`Trying to find student with NFC ID: ${idVariation}`);
        const result = await studentService.getStudentByNfcId(idVariation);
        if (result) {
          studentData = result;
          break;
        }
      }
      
      // If no student is found with any variation
      if (!studentData) {
        console.error(`No student found with NFC ID variations of: ${nfcId}`);
        message.error('Student not found. Please check the NFC ID.');
        setScanStatus('error');
        return false;
      }
      
      // Check if student has medical permissions
      if (!studentData.permissions?.medical) {
        message.error('Student does not have permission to access medical services.');
        setScanStatus('error');
        return false;
      }
      
      // Student found and has permissions
      setStudent(studentData);
      
      // Fetch medical records for this student
      const medicalRecords = await medicalService.getStudentMedicalRecords(studentData.id);
      setRecords(medicalRecords);
      
      setScanStatus('success');
      message.success(`Student ${studentData.name} identified successfully`);
      return true;
    } catch (error) {
      console.error('Error in NFC scan for medical records:', error);
      message.error('Failed to process NFC scan');
      setScanStatus('error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate different variations of NFC ID formats to try
  const getIdVariations = (nfcId) => {
    // Clean the ID to get the base part
    const baseId = nfcId.replace(/^(nfc[_-]?)/i, '').toUpperCase();
    
    return [
      nfcId,                  // Original input
      nfcId.toUpperCase(),    // Uppercase
      nfcId.toLowerCase(),    // Lowercase
      `NFC_${baseId}`,        // NFC_XXXXX format
      `NFC-${baseId}`,        // NFC-XXXXX format
      baseId,                 // Just the ID part
      `NFC_${baseId.toLowerCase()}`, // NFC_xxxxx format
      `nfc_${baseId.toLowerCase()}`, // nfc_xxxxx format
    ];
  };

  const resetStudent = useCallback(() => {
    setStudent(null);
    setRecords([]);
    setScanStatus('idle');
  }, []);

  return {
    loading,
    student,
    records,
    scanStatus,
    handleNFCScan,
    resetStudent
  };
}; 