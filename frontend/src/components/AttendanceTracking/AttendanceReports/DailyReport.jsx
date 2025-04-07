import React, { useState, useEffect } from 'react';
import { Card, Row, Col, DatePicker, Select, Button, Table, Spin, Empty, message, Statistic, Space } from 'antd';
import { CalendarOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../utils/firebase/firebase';
import SimpleAttendancePieChart from '../AttendanceCharts/SimpleAttendancePieChart';
import CSVExport from '../ExportTools/CSVExport';
import ExcelExport from '../ExportTools/ExcelExport';

const { Option } = Select;

function DailyReport() {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    rate: 0
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

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Handle course change
  const handleCourseChange = (value) => {
    setSelectedCourse(value);
  };

  // Generate report
  const generateReport = async () => {
    if (!selectedDate || !selectedCourse) {
      message.warning('Please select both date and course');
      return;
    }

    setLoading(true);
    try {
      // Get start and end of selected date
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      
      // Query attendance for selected date and course
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
      
      // Get all students for this course to calculate absences
      // This would require a separate collection or query to get enrolled students
      // For now, we'll just show the present students
      
      // Calculate statistics
      const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
      const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
      const totalCount = presentCount + absentCount;
      const attendanceRate = totalCount > 0 ? (presentCount / totalCount) * 100 : 0;
      
      setAttendanceData(attendanceRecords);
      setStats({
        total: totalCount,
        present: presentCount,
        absent: absentCount,
        rate: attendanceRate.toFixed(2)
      });
      
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
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
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => timestamp?.toLocaleTimeString() || 'N/A',
      sorter: (a, b) => a.timestamp - b.timestamp,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span style={{ color: status === 'present' ? 'green' : 'red' }}>
          {status === 'present' ? 'Present' : 'Absent'}
        </span>
      ),
      filters: [
        { text: 'Present', value: 'present' },
        { text: 'Absent', value: 'absent' },
      ],
      onFilter: (value, record) => record.status === value,
    }
  ];

  return (
    <div className="daily-report">
      <Card title="Daily Attendance Report">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <DatePicker
              style={{ width: '100%' }}
              onChange={handleDateChange}
              placeholder="Select Date"
              format="YYYY-MM-DD"
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
          <Col xs={24} md={8}>
            <Button 
              type="primary" 
              onClick={generateReport} 
              loading={loading}
              disabled={!selectedDate || !selectedCourse}
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
              <Col xs={24} md={6}>
                <Statistic 
                  title="Total Students" 
                  value={stats.total} 
                  prefix={<TeamOutlined />} 
                />
              </Col>
              <Col xs={24} md={6}>
                <Statistic 
                  title="Present" 
                  value={stats.present} 
                  prefix={<CheckCircleOutlined />} 
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col xs={24} md={6}>
                <Statistic 
                  title="Absent" 
                  value={stats.absent} 
                  prefix={<CloseCircleOutlined />} 
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col xs={24} md={6}>
                <Statistic 
                  title="Attendance Rate" 
                  value={stats.rate} 
                  suffix="%" 
                  precision={2}
                  valueStyle={{ color: stats.rate >= 70 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
            </Row>
          </Card>
          
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <Card title="Attendance Summary">
                <SimpleAttendancePieChart data={attendanceData} title="" />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Export Options" style={{ height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Space direction="vertical" style={{ textAlign: 'center' }}>
                    <p>Export the daily attendance report in your preferred format</p>
                    <Space>
                      <CSVExport data={attendanceData} filename={`daily_attendance_${selectedDate?.format('YYYY-MM-DD')}.csv`} />
                      <ExcelExport data={attendanceData} filename={`daily_attendance_${selectedDate?.format('YYYY-MM-DD')}.xlsx`} />
                    </Space>
                  </Space>
                </div>
              </Card>
            </Col>
          </Row>
          
          <Card title="Attendance Details" style={{ marginTop: 16 }}>
            <Table
              dataSource={attendanceData}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </>
      ) : selectedDate && selectedCourse ? (
        <Card style={{ marginTop: 16, textAlign: 'center' }}>
          <Empty description="No attendance data found for the selected date and course" />
        </Card>
      ) : null}
    </div>
  );
}

export default DailyReport;