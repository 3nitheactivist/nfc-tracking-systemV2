import { useState, useCallback } from 'react';
import { hostelService } from '../utils/firebase/hostelService';
import { studentService } from '../utils/firebase/studentService';
import { message } from 'antd';

export const useHostelAccess = () => {
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [accessEvents, setAccessEvents] = useState([]);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'
  const [accessStatus, setAccessStatus] = useState(null); // 'granted', 'denied', null
  const [currentAction, setCurrentAction] = useState('entry'); // 'entry' or 'exit'

  const handleNFCScan = useCallback(async (nfcId, hostelId) => {
    try {
      // Start with clean state
      setLoading(true);
      setScanStatus('scanning');
      setAccessStatus(null); // Reset access status to null
      
      // Fetch student information using the NFC ID
      const studentData = await studentService.getStudentByNfcId(nfcId);
      
      if (!studentData) {
        // Record unknown access attempt
        await hostelService.recordAccessEvent({
          nfcId,
          hostelId,
          accessType: 'denied',
          reason: 'Student not found',
          timestamp: new Date()
        });
        
        // Now set the final status and show message
        setScanStatus('error');
        setAccessStatus('denied');
        message.error('Student not found. Please register the student first.');
        return false;
      }
      
      // Check if student has hostel access permissions
      if (!studentData.permissions?.hostel) {
        // Record denied access
        await hostelService.recordAccessEvent({
          studentId: studentData.id,
          studentName: studentData.name,
          nfcId,
          hostelId,
          accessType: 'denied',
          reason: 'No hostel access permission',
          timestamp: new Date()
        });
        
        // Now set the final status and show message
        setScanStatus('error');
        setAccessStatus('denied');
        message.error('Student does not have permission to access hostel.');
        return false;
      }
      
      // Check if student is assigned to this hostel
      if (!studentData.hostelAssignment || studentData.hostelAssignment.hostelId !== hostelId) {
        // Record denied access
        await hostelService.recordAccessEvent({
          studentId: studentData.id,
          studentName: studentData.name,
          nfcId,
          hostelId,
          accessType: 'denied',
          reason: 'Not assigned to this hostel',
          timestamp: new Date()
        });
        
        // Now set the final status and show message
        setScanStatus('error');
        setAccessStatus('denied');
        message.error('Student is not assigned to this hostel.');
        return false;
      }
      
      // Check if student is already checked in
      const recentEvents = await hostelService.getStudentAccessEvents(studentData.id);
      
      // Determine if this should be an entry or exit
      let eventType = 'entry'; // Default to entry
      
      if (recentEvents.length > 0) {
        const lastEvent = recentEvents[0]; // Most recent event
        if (lastEvent.eventType === 'entry' && lastEvent.accessType === 'granted') {
          eventType = 'exit';
        }
      }
      
      // Record access event
      await hostelService.recordAccessEvent({
        studentId: studentData.id,
        studentName: studentData.name,
        nfcId,
        hostelId,
        roomId: studentData.hostelAssignment.roomId,
        roomNumber: studentData.hostelAssignment.roomNumber,
        accessType: 'granted',
        eventType,
        timestamp: new Date()
      });
      
      // Refresh events after recording the new one
      const updatedEvents = await hostelService.getStudentAccessEvents(studentData.id);
      
      // Now that everything is successful, update all state at once
      setStudent(studentData);
      setAccessEvents(updatedEvents);
      setCurrentAction(eventType);
      setScanStatus('success');
      setAccessStatus('granted');
      
      message.success(`${eventType === 'entry' ? 'Check-in' : 'Check-out'} recorded for ${studentData.name}`);
      return true;
    } catch (error) {
      console.error('Error in NFC scan for hostel access:', error);
      setScanStatus('error');
      setAccessStatus('denied');
      message.error('Failed to process NFC scan');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetStudent = useCallback(() => {
    setStudent(null);
    setAccessEvents([]);
    setScanStatus('idle');
    setAccessStatus(null);
    setCurrentAction('entry');
  }, []);

  return {
    loading,
    student,
    accessEvents,
    scanStatus,
    accessStatus,
    currentAction,
    handleNFCScan,
    resetStudent
  };
}; 