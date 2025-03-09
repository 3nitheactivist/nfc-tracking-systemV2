import React, { useState } from 'react';
import { Row, Col, Card, Tabs, Input, Button, Select, Table, Alert, Space, Typography, Spin, message, Badge, Result } from 'antd';
import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase/firebase';
import AttendanceHistory from '../components/AttendanceTracking/AttendanceHistory';
import DailyReport from '../components/AttendanceTracking/AttendanceReports/DailyReport';
import WeeklyReport from '../components/AttendanceTracking/AttendanceReports/WeeklyReport';
import SessionalReport from '../components/AttendanceTracking/AttendanceReports/SessionalReport';
import CourseManagement from '../components/AttendanceTracking/CourseManagement';
import AttendanceScanner from '../components/AttendanceTracking/AttendanceScanner';

const { Title, Text } = Typography;
const { Option } = Select;

const AttendanceTrackingPage = () => {
  // State for NFC scanning
  const [nfcId, setNfcId] = useState('');
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [scanStatus, setScanStatus] = useState(null); // 'success', 'error', or null
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [recentAttendance, setRecentAttendance] = useState([]);

  // Load courses on component mount
  React.useEffect(() => {
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

      // Record attendance
      const attendanceRef = collection(db, 'attendance');
      await addDoc(attendanceRef, {
        studentId: studentData.id,
        studentName: studentData.name,
        courseId: selectedCourse,
        courseName: courses.find(c => c.id === selectedCourse)?.name || 'Unknown Course',
        timestamp: serverTimestamp(),
        status: 'present'
      });

      // Get recent attendance for this student
      const recentAttendanceQuery = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentData.id),
        where('courseId', '==', selectedCourse)
      );
      const recentAttendanceSnapshot = await getDocs(recentAttendanceQuery);
      const recentAttendanceData = recentAttendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })).sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

      // Update state with student and attendance data
      setStudent(studentData);
      setRecentAttendance(recentAttendanceData);
      setScanStatus('success');
      message.success(`Attendance recorded for ${studentData.name}`);
    } catch (error) {
      console.error('Error recording attendance:', error);
      message.error('Failed to record attendance');
      setScanStatus('error');
    } finally {
      setLoading(false);
      setNfcId(''); // Clear input field after scan
    }
  };

  // Reset scan
  const resetScan = () => {
    setNfcId('');
    setStudent(null);
    setScanStatus(null);
    setRecentAttendance([]);
  };

  // Columns for recent attendance table
  const attendanceColumns = [
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => timestamp?.toLocaleString() || 'N/A'
    },
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge 
          status={status === 'present' ? 'success' : 'error'} 
          text={status === 'present' ? 'Present' : 'Absent'} 
        />
      )
    }
  ];

  // Render attendance scanner component
  const renderAttendanceScanner = () => (
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
                  <Option key={course.id} value={course.id}>{course.name}</Option>
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
                status={scanStatus === 'success' ? 'success' : 'error'}
                title={scanStatus === 'success' ? 'Attendance Recorded' : 'Scan Failed'}
                subTitle={
                  scanStatus === 'success'
                    ? `${student?.name} has been marked present for ${courses.find(c => c.id === selectedCourse)?.name}`
                    : 'Could not record attendance'
                }
                icon={
                  scanStatus === 'success' 
                    ? <CheckCircleOutlined />
                    : <CloseCircleOutlined />
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
                <Text>Student ID: {student.studentId || 'N/A'}</Text>
                <div style={{ margin: '16px 0' }}>
                  <Badge status="success" text="Attendance Recorded" />
                </div>
              </div>
              
              <Title level={5} style={{ marginTop: 16 }}>Recent Attendance History</Title>
              {recentAttendance.length > 0 ? (
                <Table 
                  dataSource={recentAttendance} 
                  columns={attendanceColumns} 
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
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

  // Define tab items
  const tabItems = [
    {
      key: '1',
      label: 'Attendance Scanner',
      children: <AttendanceScanner />
    },
    {
      key: '2',
      label: 'Attendance History',
      children: <AttendanceHistory />
    },
    {
      key: '3',
      label: 'Course Management',
      children: <CourseManagement />
    },
    {
      key: '4',
      label: 'Reports',
      children: (
        <Tabs
          defaultActiveKey="daily"
          items={[
            {
              key: 'daily',
              label: 'Daily Report',
              children: <DailyReport />
            },
            {
              key: 'weekly',
              label: 'Weekly Report',
              children: <WeeklyReport />
            },
            {
              key: 'sessional',
              label: 'Sessional Report',
              children: <SessionalReport />
            }
          ]}
        />
      )
    }
  ];

  return (
    <div className="attendance-tracking-page">
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Attendance Tracking</Title>
        <Text type="secondary">Manage student attendance records</Text>
      </div>
      
      <Tabs defaultActiveKey="1" items={tabItems} />
    </div>
  );
};

export default AttendanceTrackingPage;