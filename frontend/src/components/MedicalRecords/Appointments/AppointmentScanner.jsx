import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Space, Result, Typography, Spin, message, Image } from 'antd';
import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNFCScanner } from '../../../hooks/useNFCScanner';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../utils/firebase/firebase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function AppointmentScanner() {
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [student, setStudent] = useState(null);
  const [appointment, setAppointment] = useState(null);
  
  // NFC scanner integration
  const { startScan, stopScan, scanning, lastScannedId, scanStatus } = useNFCScanner();

  // Reset states
  const resetStates = () => {
    setScanResult(null);
    setStudent(null);
    setAppointment(null);
  };

  // Handle NFC scan result
  useEffect(() => {
    if (lastScannedId && scanStatus === 'success') {
      handleNFCScan(lastScannedId);
    }
  }, [lastScannedId, scanStatus]);

  // Check if the appointment time is valid
  const isValidAppointmentTime = (appointmentTime) => {
    const now = dayjs();
    const appointmentDateTime = dayjs(appointmentTime.appointmentDate + ' ' + appointmentTime.appointmentTime);
    
    // Allow check-in 15 minutes before and up to 15 minutes after appointment time
    const earlyWindow = appointmentDateTime.subtract(15, 'minute');
    const lateWindow = appointmentDateTime.add(15, 'minute');
    
    return now.isAfter(earlyWindow) && now.isBefore(lateWindow);
  };

  // Handle NFC scan
  const handleNFCScan = async (nfcId) => {
    try {
      setLoading(true);
      
      // Find student by NFC ID
      const studentsRef = collection(db, 'students');
      const studentQuery = query(studentsRef, where('nfcTagId', '==', nfcId));
      const studentSnapshot = await getDocs(studentQuery);
      
      if (studentSnapshot.empty) {
        setScanResult({
          status: 'error',
          title: 'Student Not Found',
          message: 'No student found with this ID card.'
        });
        return;
      }

      const studentData = {
        id: studentSnapshot.docs[0].id,
        ...studentSnapshot.docs[0].data()
      };
      setStudent(studentData);

      // Find today's appointment for the student
      const today = dayjs().format('YYYY-MM-DD');
      const appointmentsRef = collection(db, 'medical_appointments');
      const appointmentQuery = query(
        appointmentsRef,
        where('studentId', '==', studentData.id),
        where('appointmentDate', '==', today),
        where('status', '==', 'scheduled')
      );
      
      const appointmentSnapshot = await getDocs(appointmentQuery);
      
      if (appointmentSnapshot.empty) {
        setScanResult({
          status: 'error',
          title: 'No Appointment Found',
          message: 'No scheduled appointment found for today.'
        });
        return;
      }

      const appointmentData = {
        id: appointmentSnapshot.docs[0].id,
        ...appointmentSnapshot.docs[0].data()
      };
      setAppointment(appointmentData);

      // Check if appointment time is valid
      if (!isValidAppointmentTime(appointmentData)) {
        setScanResult({
          status: 'error',
          title: 'Invalid Check-in Time',
          message: `Your appointment is scheduled for ${appointmentData.appointmentTime}. 
                   Please arrive no earlier than 15 minutes before and no later than 15 minutes after your scheduled time.`
        });
        return;
      }

      // Update appointment status to checked-in
      await updateDoc(doc(db, 'medical_appointments', appointmentData.id), {
        status: 'checked-in',
        checkInTime: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      setScanResult({
        status: 'success',
        title: 'Check-in Successful',
        message: `Welcome ${studentData.name}! You have been checked in for your ${appointmentData.appointmentTime} appointment.`
      });

    } catch (error) {
      console.error('Error processing NFC scan:', error);
      setScanResult({
        status: 'error',
        title: 'Check-in Failed',
        message: 'An error occurred while processing your check-in. Please try again.'
      });
    } finally {
      setLoading(false);
      stopScan();
    }
  };

  // Handle new scan
  const handleNewScan = () => {
    resetStates();
    startScan();
  };

  return (
    <Card title="Appointment Check-in Scanner">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Scanner Status */}
        <Alert
          message="Scan student ID card to check in for appointment"
          type="info"
          showIcon
        />

        {/* Scan Button */}
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <Space>
            <Button
              type="primary"
              icon={<ScanOutlined />}
              size="large"
              onClick={handleNewScan}
              loading={scanning}
              disabled={scanning}
            >
              {scanning ? 'Scanning...' : 'Start Scan'}
            </Button>
            
            <Button
              icon={<ReloadOutlined />}
              onClick={resetStates}
              disabled={scanning}
            >
              Reset
            </Button>
          </Space>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Processing...</div>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <Result
            status={scanResult.status}
            title={scanResult.title}
            subTitle={scanResult.message}
            icon={scanResult.status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          />
        )}

        {/* Student Details */}
        {student && (
          <Card size="small" title="Student Information">
            <Space direction="vertical">
              <Image
                width={100}
                height={100}
                src={student.profileImage?.data || 'default-image-url.jpg'} // Use a default image if none exists
                alt={student.name}
                style={{ borderRadius: '50%' }}
              />
              <Text strong>Name:</Text>
              <Text>{student.name}</Text>
              <Text strong>Student ID:</Text>
              <Text>{student.schoolId}</Text>
              {appointment && (
                <>
                  <Text strong>Appointment Time:</Text>
                  <Text>{appointment.appointmentTime}</Text>
                  <Text strong>Reason:</Text>
                  <Text>{appointment.reason}</Text>
                </>
              )}
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );
}

export default AppointmentScanner; 