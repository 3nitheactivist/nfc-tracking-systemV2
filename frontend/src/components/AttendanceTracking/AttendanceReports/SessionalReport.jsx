import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Select, Button, Table, Spin, Empty, message, Statistic, Tabs, Alert } from 'antd';
import { TeamOutlined, CheckCircleOutlined, BarChartOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../utils/firebase/firebase';
import AttendanceBarChart from '../AttendanceCharts/AttendanceBarChart';
import AttendancePieChart from '../AttendanceCharts/AttendancePieChart';
import AttendanceTrendChart from '../AttendanceCharts/AttendanceTrendChart';
import CSVExport from '../ExportTools/CSVExport';
import ExcelExport from '../ExportTools/ExcelExport';

const { Option } = Select;

function SessionalReport() {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [studentSummary, setStudentSummary] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    averageAttendance: 0
  });

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

  // Handle course change
  const handleCourseChange = (value) => {
    setSelectedCourse(value);
  };

  // Generate report
  const generateReport = async () => {
    if (!selectedCourse) {
      message.warning('Please select a course');
      return;
    }

    setLoading(true);
    try {
      // Query all attendance records for the selected course
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('courseId', '==', selectedCourse),
        orderBy('timestamp', 'desc')
      );
      
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceRecords = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      
      // Group by date to identify unique class sessions
      const classSessions = attendanceRecords.reduce((acc, record) => {
        if (!record.timestamp) return acc;
        
        const date = record.timestamp.toLocaleDateString();
        if (!acc[date]) {
          acc[date] = true;
        }
        
        return acc;
      }, {});
      
      // Group by student to calculate attendance summary
      const studentAttendance = attendanceRecords.reduce((acc, record) => {
        const studentId = record.studentId;
        if (!acc[studentId]) {
          acc[studentId] = {
            studentId,
            studentName: record.studentName,
            totalClasses: 0,
            presentClasses: 0,
            absentClasses: 0,
            attendanceRate: 0
          };
        }
        
        acc[studentId].totalClasses += 1;
        
        if (record.status === 'present') {
          acc[studentId].presentClasses += 1;
        } else {
          acc[studentId].absentClasses += 1;
        }
        
        acc[studentId].attendanceRate = (acc[studentId].presentClasses / acc[studentId].totalClasses) * 100;
        
        return acc;
      }, {});
      
      // Calculate overall statistics
      const totalClasses = Object.keys(classSessions).length;
      const totalStudents = Object.keys(studentAttendance).length;
      const totalPresent = attendanceRecords.filter(record => record.status === 'present').length;
      const totalRecords = attendanceRecords.length;
      const averageAttendance = totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0;
      
      setAttendanceData(attendanceRecords);
      setStudentSummary(Object.values(studentAttendance));
      setStats({
        totalStudents,
        totalClasses,
        averageAttendance: averageAttendance.toFixed(2)
      });
      
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Table columns for student summary
  const studentColumns = [
    {
      title: 'Student Name',
      dataIndex: 'studentName',
      key: 'studentName',
      sorter: (a, b) => a.studentName.localeCompare(b.studentName),
    },
    {
      title: 'Total Classes',
      dataIndex: 'totalClasses',
      key: 'totalClasses',
      sorter: (a, b) => a.totalClasses - b.totalClasses,
    },
    {
      title: 'Present',
      dataIndex: 'presentClasses',
      key: 'presentClasses',
      sorter: (a, b) => a.presentClasses - b.presentClasses,
    },
    {
      title: 'Absent',
      dataIndex: 'absentClasses',
      key: 'absentClasses',
      sorter: (a, b) => a.absentClasses - b.absentClasses,
    },
    {
      title: 'Attendance Rate',
      dataIndex: 'attendanceRate',
      key: 'attendanceRate',
      render: (rate) => `${rate.toFixed(2)}%`,
      sorter: (a, b) => a.attendanceRate - b.attendanceRate,
    }
  ];

  // Get students at risk (attendance below 70%)
  const getStudentsAtRisk = () => {
    return studentSummary.filter(student => student.attendanceRate < 70)
      .sort((a, b) => a.attendanceRate - b.attendanceRate);
  };

  // Replace TabPane usage with items prop
  const tabItems = [
    {
      key: 'all',
      label: 'All Students',
      children: (
        <>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <CSVExport data={studentSummary} filename={`sessional_attendance_${courses.find(c => c.id === selectedCourse)?.code || 'course'}.csv`} />
            <ExcelExport data={studentSummary} filename={`sessional_attendance_${courses.find(c => c.id === selectedCourse)?.code || 'course'}.xlsx`} style={{ marginLeft: 8 }} />
          </div>
          <Table
            dataSource={studentSummary}
            columns={studentColumns}
            rowKey="studentId"
            pagination={{ pageSize: 10 }}
            rowClassName={(record) => record.attendanceRate < 70 ? 'at-risk-row' : ''}
          />
        </>
      )
    },
    {
      key: 'risk',
      label: 'Students at Risk',
      children: (
        <>
          <div style={{ marginBottom: 16 }}>
            <Alert
              message="Students with attendance below 70%"
              type="warning"
              showIcon
            />
          </div>
          <Table
            dataSource={getStudentsAtRisk()}
            columns={studentColumns}
            rowKey="studentId"
            pagination={{ pageSize: 10 }}
            rowClassName="at-risk-row"
          />
        </>
      )
    }
  ];

  return (
    <div className="sessional-report">
      <Card title="Sessional Attendance Report">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={18}>
            <Select
              placeholder="Select Course"
              style={{ width: '100%' }}
              onChange={handleCourseChange}
              value={selectedCourse}
            >
              {courses.map(course => (
                <Option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Button 
              type="primary" 
              onClick={generateReport} 
              loading={loading}
              disabled={!selectedCourse}
              style={{ width: '100%' }}
            >
              Generate Report
            </Button>
          </Col>
        </Row>
      </Card>
      
      {loading ? (
        <div style={{ textAlign: 'center', margin: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : attendanceData.length > 0 ? (
        <>
          <Card style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Statistic 
                  title="Total Students" 
                  value={stats.totalStudents} 
                  prefix={<TeamOutlined />} 
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic 
                  title="Total Classes" 
                  value={stats.totalClasses} 
                  prefix={<BarChartOutlined />} 
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic 
                  title="Average Attendance" 
                  value={stats.averageAttendance} 
                  suffix="%" 
                  precision={2}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: stats.averageAttendance >= 70 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
            </Row>
          </Card>
          
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <AttendancePieChart data={attendanceData} title="Overall Attendance" />
            </Col>
            <Col xs={24} md={12}>
              <AttendanceTrendChart data={attendanceData} title="Attendance Trend" />
            </Col>
          </Row>
          
          <Card style={{ marginTop: 16 }}>
            <Tabs defaultActiveKey="all" items={tabItems} />
          </Card>
        </>
      ) : selectedCourse ? (
        <Card style={{ marginTop: 16, textAlign: 'center' }}>
          <Empty description="No attendance data found for the selected course" />
        </Card>
      ) : null}
    </div>
  );
}

export default SessionalReport;