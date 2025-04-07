import React, { useState, useEffect } from 'react';
import { Card, Row, Col, DatePicker, Select, Button, Table, Spin, Empty, message, Statistic } from 'antd';
import { CalendarOutlined, TeamOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../utils/firebase/firebase';
import SimpleAttendanceBarChart from '../AttendanceCharts/SimpleAttendanceBarChart';
import SimpleAttendanceTrendChart from '../AttendanceCharts/SimpleAttendanceTrendChart';
import CSVExport from '../ExportTools/CSVExport';
import ExcelExport from '../ExportTools/ExcelExport';
import SimpleAttendancePieChart from '../AttendanceCharts/SimpleAttendancePieChart';

const { Option } = Select;
const { RangePicker } = DatePicker;

function WeeklyReport() {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    totalRecords: 0,
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

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // Handle course change
  const handleCourseChange = (value) => {
    setSelectedCourse(value);
  };

  // Generate report
  const generateReport = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1] || !selectedCourse) {
      message.warning('Please select both date range and course');
      return;
    }

    setLoading(true);
    try {
      // Get start and end of selected date range
      const startDate = dateRange[0].startOf('day').toDate();
      const endDate = dateRange[1].endOf('day').toDate();
      
      // Query attendance for selected date range and course
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('courseId', '==', selectedCourse),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate)
      );
      
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceRecords = attendanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      
      // Group by date to calculate daily stats
      const dailyStats = attendanceRecords.reduce((acc, record) => {
        if (!record.timestamp) return acc;
        
        const date = record.timestamp.toLocaleDateString();
        if (!acc[date]) {
          acc[date] = {
            date,
            present: 0,
            absent: 0,
            total: 0
          };
        }
        
        if (record.status === 'present') {
          acc[date].present += 1;
        } else {
          acc[date].absent += 1;
        }
        
        acc[date].total += 1;
        
        return acc;
      }, {});
      
      // Calculate overall statistics
      const totalDays = Object.keys(dailyStats).length;
      const totalRecords = attendanceRecords.length;
      const presentRecords = attendanceRecords.filter(record => record.status === 'present').length;
      const averageAttendance = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;
      
      setAttendanceData(attendanceRecords);
      setStats({
        totalDays,
        totalRecords,
        averageAttendance: averageAttendance.toFixed(2)
      });
      
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // Group attendance data by student
  const getStudentAttendanceSummary = () => {
    const studentSummary = attendanceData.reduce((acc, record) => {
      const studentId = record.studentId;
      if (!acc[studentId]) {
        acc[studentId] = {
          studentId,
          studentName: record.studentName,
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          attendanceRate: 0
        };
      }
      
      acc[studentId].totalDays += 1;
      
      if (record.status === 'present') {
        acc[studentId].presentDays += 1;
      } else {
        acc[studentId].absentDays += 1;
      }
      
      acc[studentId].attendanceRate = (acc[studentId].presentDays / acc[studentId].totalDays) * 100;
      
      return acc;
    }, {});
    
    return Object.values(studentSummary);
  };

  // Table columns
  const columns = [
    {
      title: 'Student Name',
      dataIndex: 'studentName',
      key: 'studentName',
      sorter: (a, b) => a.studentName.localeCompare(b.studentName),
    },
    {
      title: 'Total Days',
      dataIndex: 'totalDays',
      key: 'totalDays',
      sorter: (a, b) => a.totalDays - b.totalDays,
    },
    {
      title: 'Present Days',
      dataIndex: 'presentDays',
      key: 'presentDays',
      sorter: (a, b) => a.presentDays - b.presentDays,
    },
    {
      title: 'Absent Days',
      dataIndex: 'absentDays',
      key: 'absentDays',
      sorter: (a, b) => a.absentDays - b.absentDays,
    },
    {
      title: 'Attendance Rate',
      dataIndex: 'attendanceRate',
      key: 'attendanceRate',
      render: (rate) => `${rate.toFixed(2)}%`,
      sorter: (a, b) => a.attendanceRate - b.attendanceRate,
    }
  ];

  return (
    <div className="weekly-report">
      <Card title="Weekly Attendance Report">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={10}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={handleDateRangeChange}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} md={8}>
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
              disabled={!dateRange || !dateRange[0] || !dateRange[1] || !selectedCourse}
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
                  title="Total Days" 
                  value={stats.totalDays} 
                  prefix={<CalendarOutlined />} 
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic 
                  title="Total Records" 
                  value={stats.totalRecords} 
                  prefix={<TeamOutlined />} 
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
              <SimpleAttendancePieChart data={attendanceData} title="Overall Attendance" />
            </Col>
            <Col xs={24} md={12}>
              <SimpleAttendanceTrendChart data={attendanceData} title="Attendance Trend" />
            </Col>
          </Row>
          
          <Card title="Student Attendance Summary" style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <CSVExport data={getStudentAttendanceSummary()} filename={`weekly_attendance_${dateRange?.[0]?.format('YYYY-MM-DD')}_to_${dateRange?.[1]?.format('YYYY-MM-DD')}.csv`} />
              <ExcelExport data={getStudentAttendanceSummary()} filename={`weekly_attendance_${dateRange?.[0]?.format('YYYY-MM-DD')}_to_${dateRange?.[1]?.format('YYYY-MM-DD')}.xlsx`} style={{ marginLeft: 8 }} />
            </div>
            <Table
              dataSource={getStudentAttendanceSummary()}
              columns={columns}
              rowKey="studentId"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </>
      ) : dateRange && selectedCourse ? (
        <Card style={{ marginTop: 16, textAlign: 'center' }}>
          <Empty description="No attendance data found for the selected date range and course" />
        </Card>
      ) : null}
    </div>
  );
}

export default WeeklyReport;