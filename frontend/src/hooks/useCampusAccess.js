import { useState, useCallback } from 'react';
import { campusAccessService } from '../utils/firebase/campusAccessService';
import { studentService } from '../utils/firebase/studentService';
import { message } from 'antd';

export const useCampusAccess = () => {
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [accessEvents, setAccessEvents] = useState([]);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle', 'scanning', 'success', 'error'
  const [accessStatus, setAccessStatus] = useState(null); // 'granted', 'denied', null
  const [currentAction, setCurrentAction] = useState('entry'); // 'entry' or 'exit'

  const handleNFCScan = useCallback(async (nfcId) => {
    try {
      // Start with clean state
      setLoading(true);
      setScanStatus('scanning');
      setAccessStatus(null); // Important: Reset access status to null
      
      // Fetch student information using the NFC ID
      const studentData = await studentService.getStudentByNfcId(nfcId);
      
      if (!studentData) {
        // Don't set student or access status yet
        setScanStatus('error');
        
        // Record unknown access attempt
        await campusAccessService.recordAccessEvent({
          nfcId,
          accessType: 'denied',
          reason: 'Student not found',
          timestamp: new Date()
        });
        
        // Now set the final status and show message
        setAccessStatus('denied');
        message.error('Student not found. Please register the student first.');
        return false;
      }
      
      // Check if student has campus access permissions
      if (!studentData.permissions?.campus) {
        // Don't set student or access status yet
        setScanStatus('error');
        
        // Record denied access
        await campusAccessService.recordAccessEvent({
          studentId: studentData.id,
          studentName: studentData.name,
          nfcId,
          accessType: 'denied',
          reason: 'No access permission',
          timestamp: new Date()
        });
        
        // Now set the final status and show message
        setAccessStatus('denied');
        message.error('Student does not have permission to access campus.');
        return false;
      }
      
      // Check if student is already checked in
      const recentEvents = await campusAccessService.getStudentAccessEvents(studentData.id);
      
      // Determine if this should be an entry or exit
      let eventType = 'entry'; // Default to entry
      
      if (recentEvents.length > 0) {
        const lastEvent = recentEvents[0]; // Most recent event
        if (lastEvent.eventType === 'entry' && lastEvent.accessType === 'granted') {
          eventType = 'exit';
        }
      }
      
      // Record access event
      await campusAccessService.recordAccessEvent({
        studentId: studentData.id,
        studentName: studentData.name,
        nfcId,
        accessType: 'granted',
        eventType: eventType,
        timestamp: new Date()
      });
      
      // Refresh events after recording the new one
      const updatedEvents = await campusAccessService.getStudentAccessEvents(studentData.id);
      
      // Now that everything is successful, update all state at once
      setStudent(studentData);
      setAccessEvents(updatedEvents);
      setCurrentAction(eventType);
      setScanStatus('success');
      setAccessStatus('granted');
      
      message.success(`${eventType === 'entry' ? 'Check-in' : 'Check-out'} recorded for ${studentData.name}`);
      return true;
    } catch (error) {
      console.error('Error in NFC scan for campus access:', error);
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

  // Manual record exit is no longer needed as the system automatically toggles
  // But we'll keep it for explicit exit recording if needed
  const recordExit = useCallback(async () => {
    if (!student) {
      message.error('No student selected');
      return false;
    }
    
    try {
      setLoading(true);
      
      await campusAccessService.recordAccessEvent({
        studentId: student.id,
        studentName: student.name,
        eventType: 'exit',
        accessType: 'granted',
        timestamp: new Date()
      });
      
      // Refresh events
      const events = await campusAccessService.getStudentAccessEvents(student.id);
      
      // Update state all at once
      setAccessEvents(events);
      setCurrentAction('exit');
      
      message.success(`Exit recorded for ${student.name}`);
      return true;
    } catch (error) {
      console.error('Error recording exit:', error);
      message.error('Failed to record exit');
      return false;
    } finally {
      setLoading(false);
    }
  }, [student]);

  return {
    loading,
    student,
    accessEvents,
    scanStatus,
    accessStatus,
    currentAction,
    handleNFCScan,
    resetStudent,
    recordExit
  };
};