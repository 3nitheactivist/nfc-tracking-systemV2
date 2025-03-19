import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Select, Alert, Space, Result, Typography, Spin, message, Badge, Row, Col } from 'antd';
import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';
import { useNFCScanner } from '../../hooks/useNFCScanner';

const { Title, Text } = Typography;
const { Option } = Select;

function AttendanceScanner() {
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'success', 'error', or null
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [scanningLoop, setScanningLoop] = useState(false);
  const loopCountRef = useRef(0);

  // NFC scanner integration
  const { startScan, stopScan, scanning, lastScannedId, scanStatus: nfcScanStatus } = useNFCScanner();

  // Load courses on component mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesCollection = collection(db, 'courses');
        const coursesSnapshot = await getDocs(coursesCollection);
        const coursesList = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCourses(coursesList);
      } catch (error) {
        console.error('Error loading courses:', error);
        message.error('Failed to load courses');
      }
    };

    loadCourses();
  }, []);

  // Handle course selection
  const handleCourseChange = (value) => {
    setSelectedCourse(value);
    // Reset student data when course changes
    resetScan();
  };

  // Process scanned NFC ID when received
  useEffect(() => {
    if (lastScannedId && nfcScanStatus === 'success' && selectedCourse) {
      processNfcId(lastScannedId);
      // Reset loop detection
      loopCountRef.current = 0;
      setScanningLoop(false);
    }
  }, [lastScannedId, nfcScanStatus, selectedCourse]);

  // Detect scanning loops
  useEffect(() => {
    if (scanning) {
      loopCountRef.current += 1;
      
      // If we detect multiple consecutive scans, we're probably in a loop
      if (loopCountRef.current > 3) {
        setScanningLoop(true);
      }
    }
  }, [scanning]);

  // Process the NFC ID
  const processNfcId = async (nfcId) => {
    if (!selectedCourse) {
      message.warning('Please select a course first');
      return;
    }

    setLoading(true);
    setScanStatus(null);
    setStudent(null);

    try {
      // Find student by NFC ID
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('nfcTagId', '==', nfcId.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        message.error('No student found with this NFC ID');
        setScanStatus('error');
        setLoading(false);
        return;
      }

      // Get student data
      const studentDoc = querySnapshot.docs[0];
      const studentData = {
        id: studentDoc.id,
        ...studentDoc.data()
      };

      // Check if student has attendance permissions
      if (!studentData.permissions?.attendance) {
        message.error('Student does not have attendance permissions');
        setScanStatus('error');
        setLoading(false);
        return;
      }

      // Check if student has already been marked for this course today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentData.id),
        where('courseId', '==', selectedCourse),
        where('timestamp', '>=', today)
      );
      
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      if (!attendanceSnapshot.empty) {
        message.warning(`${studentData.name} has already been marked for this course today`);
        // Still show the student info but with a warning
        setScanStatus('warning');
      } else {
        // Record attendance
        await addDoc(collection(db, 'attendance'), {
          studentId: studentData.id,
          studentName: studentData.name,
          courseId: selectedCourse,
          courseName: courses.find(c => c.id === selectedCourse)?.name || 'Unknown Course',
          timestamp: serverTimestamp(),
          status: 'present'
        });
        
        message.success(`Attendance recorded for ${studentData.name}`);
        setScanStatus('success');
      }

      // Get recent attendance for this student
      const recentAttendanceQuery = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentData.id),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      
      const recentAttendanceSnapshot = await getDocs(recentAttendanceQuery);
      const recentAttendanceData = recentAttendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));

      // Update state with student and attendance data
      setStudent(studentData);
      setRecentAttendance(recentAttendanceData);
    } catch (error) {
      console.error('Error recording attendance:', error);
      message.error('Failed to record attendance');
      setScanStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Start a new scan
  const handleStartScan = () => {
    if (!selectedCourse) {
      message.warning('Please select a course first');
      return;
    }
    
    resetScan();
    startScan();
  };

  // Reset scan
  const resetScan = () => {
    stopScan();
    setStudent(null);
    setScanStatus(null);
    setRecentAttendance([]);
  };

  // Handle refresh - completely reset the scanner
  const handleRefresh = () => {
    console.log("Refreshing scanner state");
    
    // Stop any active scans
    stopScan();
    
    // Reset student data
    resetScan();
    
    // Reset our loop detection
    loopCountRef.current = 0;
    setScanningLoop(false);
    
    message.success("Scanner has been reset");
  };

  return (
    <div className="attendance-scanner-container">
      {/* Add the refresh alert when loop is detected */}
      {scanningLoop && (
        <Alert
          message="Scanner issues detected"
          description="The scanner appears to be stuck in a loop. Click the refresh button to reset."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh} 
              type="primary" 
              danger
            >
              Reset Scanner
            </Button>
          }
        />
      )}
    
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Class Attendance Scanner" className="scanner-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="Scan a student's NFC ID card to mark attendance"
                type="info"
                showIcon
              />
              
              <div style={{ marginBottom: 16 }}>
                <Select
                  placeholder="Select Course"
                  style={{ width: '100%', marginBottom: 16 }}
                  value={selectedCourse}
                  onChange={handleCourseChange}
                >
                  {courses.map(course => (
                    <Option key={course.id} value={course.id}>
                      {course.code} - {course.name} (Level {course.level})
                    </Option>
                  ))}
                </Select>
              </div>
              
              <div className="scan-button-container" style={{ textAlign: 'center', margin: '20px 0' }}>
                <Button
                  type="primary"
                  icon={<ScanOutlined />}
                  size="large"
                  onClick={handleStartScan}
                  loading={scanning}
                  disabled={scanning || !selectedCourse}
                >
                  {scanning ? 'Scanning...' : 'Scan NFC Card'}
                </Button>
                
                {student && (
                  <Button
                    type="default"
                    style={{ marginLeft: 8 }}
                    onClick={resetScan}
                  >
                    Reset
                  </Button>
                )}
                
                {/* Add refresh button for scanner issues */}
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  style={{ marginLeft: 8 }}
                  title="Reset scanner if it's not working properly"
                >
                  Reset Scanner
                </Button>
              </div>
              
              {loading && (
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>Processing...</div>
                </div>
              )}
              
              {scanStatus && (
                <Result
                  status={scanStatus === 'success' ? 'success' : scanStatus === 'warning' ? 'warning' : 'error'}
                  title={
                    scanStatus === 'success' ? 'Attendance Recorded' : 
                    scanStatus === 'warning' ? 'Already Recorded' : 
                    'Scan Failed'
                  }
                  subTitle={
                    scanStatus === 'success' ? 
                      `${student?.name} has been marked present for ${courses.find(c => c.id === selectedCourse)?.name}` :
                    scanStatus === 'warning' ?
                      `${student?.name} was already marked for this course today` :
                      'Could not record attendance'
                  }
                  icon={
                    scanStatus === 'success' ? <CheckCircleOutlined /> : 
                    scanStatus === 'warning' ? <CheckCircleOutlined /> :
                    <CloseCircleOutlined />
                  }
                />
              )}
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            title="Student Information" 
            className="student-info-card"
          >
            {student ? (
              <div>
                <div className="student-details">
                  <Title level={4}>{student.name}</Title>
                  <Text>Student ID: {student.schoolId || student.studentId || 'N/A'}</Text>
                  <div style={{ margin: '16px 0' }}>
                    <Badge 
                      status={scanStatus === 'success' ? 'success' : scanStatus === 'warning' ? 'warning' : 'error'} 
                      text={
                        scanStatus === 'success' ? 'Attendance Recorded' : 
                        scanStatus === 'warning' ? 'Already Recorded Today' : 
                        'Failed to Record'
                      } 
                    />
                  </div>
                </div>
                
                <Title level={5} style={{ marginTop: 16 }}>Recent Attendance History</Title>
                {recentAttendance.length > 0 ? (
                  <ul className="attendance-list">
                    {recentAttendance.map(record => (
                      <li key={record.id} className="attendance-item">
                        <Badge status="success" text={record.courseName} />
                        <Text type="secondary" style={{ marginLeft: 8 }}>
                          {record.timestamp?.toLocaleString() || 'N/A'}
                        </Text>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Alert message="No recent attendance records found" type="info" />
                )}
              </div>
            ) : (
              <Alert message="Scan a student card to view their information" type="info" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default AttendanceScanner;