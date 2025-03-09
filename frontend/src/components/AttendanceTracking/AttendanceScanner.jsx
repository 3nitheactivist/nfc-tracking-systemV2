import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Select, Alert, Space, Result, Typography, Spin, message, Badge, Row, Col } from 'antd';
import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';

const { Title, Text } = Typography;
const { Option } = Select;

function AttendanceScanner() {
  const [nfcId, setNfcId] = useState('');
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'success', 'error', or null
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);

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

  // Handle NFC ID input
  const handleNfcIdChange = (e) => {
    setNfcId(e.target.value);
  };

  // Handle course selection
  const handleCourseChange = (value) => {
    setSelectedCourse(value);
    // Reset student data when course changes
    setStudent(null);
    setScanStatus(null);
  };

  // Handle NFC scan
  const handleScan = async () => {
    if (!nfcId.trim()) {
      message.warning('Please enter an NFC ID');
      return;
    }

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

  // Reset scan
  const resetScan = () => {
    setNfcId('');
    setStudent(null);
    setScanStatus(null);
    setRecentAttendance([]);
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Card title="Class Attendance Scanner" className="scanner-card">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="Scan student's NFC ID card or enter the ID manually"
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
              
              <Input.Search
                placeholder="Enter NFC ID"
                value={nfcId}
                onChange={handleNfcIdChange}
                onSearch={handleScan}
                enterButton="Submit"
                loading={loading}
                disabled={!selectedCourse}
              />
            </div>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <Button
                type="primary"
                icon={<ScanOutlined />}
                size="large"
                onClick={handleScan}
                loading={loading}
                disabled={!nfcId.trim() || !selectedCourse}
              >
                {loading ? 'Scanning...' : 'Scan NFC Card'}
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
  );
}

export default AttendanceScanner;