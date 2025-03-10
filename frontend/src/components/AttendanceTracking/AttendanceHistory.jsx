import React, { useState, useEffect } from 'react';
import { Table, Card, DatePicker, Select, Input, Button, Space, Row, Col, message, Tag } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  doc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';
import CSVExport from './ExportTools/CSVExport';
import ExcelExport from './ExportTools/ExcelExport';

const { Option } = Select;
const { RangePicker } = DatePicker;

function AttendanceHistory() {
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: null,
    courseId: null,
    studentId: null,
    searchText: '',
  });
  const [unsubscribe, setUnsubscribe] = useState(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load courses with real-time listener
        const coursesUnsubscribe = onSnapshot(
          collection(db, 'courses'),
          (snapshot) => {
            const coursesList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setCourses(coursesList);
          },
          (error) => {
            console.error('Error loading courses:', error);
            message.error('Failed to load courses');
          }
        );
        
        // Load students with real-time listener
        const studentsUnsubscribe = onSnapshot(
          collection(db, 'students'),
          (snapshot) => {
            const studentsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setStudents(studentsList);
          },
          (error) => {
            console.error('Error loading students:', error);
            message.error('Failed to load students');
          }
        );
        
        // Set up real-time attendance data
        setupAttendanceListener();
        
        // Clean up listeners on component unmount
        return () => {
          if (coursesUnsubscribe) coursesUnsubscribe();
          if (studentsUnsubscribe) studentsUnsubscribe();
          if (unsubscribe) unsubscribe();
        };
      } catch (error) {
        console.error('Error loading initial data:', error);
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
    
    // Clean up on component unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Set up real-time listener for attendance data
  const setupAttendanceListener = () => {
    // Clean up previous listener if exists
    if (unsubscribe) {
      unsubscribe();
    }
    
    setLoading(true);
    
    // Start with base query
    let attendanceQuery = collection(db, 'attendance');
    let constraints = [];
    
    // Apply date range filter
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = filters.dateRange[0].startOf('day').toDate();
      const endDate = filters.dateRange[1].endOf('day').toDate();
      constraints.push(where('timestamp', '>=', startDate));
      constraints.push(where('timestamp', '<=', endDate));
    } else {
      // Default to last 7 days if no date range specified
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      constraints.push(where('timestamp', '>=', startDate));
      constraints.push(where('timestamp', '<=', endDate));
    }
    
    // Apply course filter
    if (filters.courseId) {
      constraints.push(where('courseId', '==', filters.courseId));
    }
    
    // Apply student filter
    if (filters.studentId) {
      constraints.push(where('studentId', '==', filters.studentId));
    }
    
    // Create query with constraints
    const q = query(attendanceQuery, ...constraints, orderBy('timestamp', 'desc'));
    
    // Set up real-time listener
    const newUnsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          // Process results
          let results = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
          }));
          
          // Verify that each attendance record corresponds to an existing student
          const validatedResults = [];
          const studentCache = {}; // Cache student existence to avoid repeated lookups
          
          for (const record of results) {
            // Skip records without studentId
            if (!record.studentId) continue;
            
            // Check if we've already verified this student
            if (studentCache[record.studentId] === undefined) {
              try {
                const studentDoc = await getDoc(doc(db, 'students', record.studentId));
                studentCache[record.studentId] = studentDoc.exists();
              } catch (error) {
                console.error('Error checking student existence:', error);
                studentCache[record.studentId] = true; // Assume exists on error to avoid data loss
              }
            }
            
            // Add to validated results if student exists
            if (studentCache[record.studentId]) {
              validatedResults.push(record);
            }
          }
          
          // Apply text search filter (client-side)
          let filteredResults = validatedResults;
          if (filters.searchText) {
            const searchLower = filters.searchText.toLowerCase();
            filteredResults = validatedResults.filter(record => 
              record.studentName?.toLowerCase().includes(searchLower) ||
              record.courseName?.toLowerCase().includes(searchLower)
            );
          }
          
          setAttendanceData(filteredResults);
          setLoading(false);
        } catch (error) {
          console.error('Error processing attendance data:', error);
          message.error('Error processing attendance data');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error in attendance listener:', error);
        message.error('Failed to load attendance data');
        setLoading(false);
      }
    );
    
    // Save the unsubscribe function
    setUnsubscribe(() => newUnsubscribe);
  };

  // Handle filter changes
  const handleDateRangeChange = (dates) => {
    setFilters(prev => ({ ...prev, dateRange: dates }));
  };
  
  const handleCourseChange = (value) => {
    setFilters(prev => ({ ...prev, courseId: value }));
  };
  
  const handleStudentChange = (value) => {
    setFilters(prev => ({ ...prev, studentId: value }));
  };
  
  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, searchText: e.target.value }));
  };
  
  const handleApplyFilters = () => {
    setupAttendanceListener(); // Re-setup listener with new filters
  };
  
  const handleResetFilters = () => {
    setFilters({
      dateRange: null,
      courseId: null,
      studentId: null,
      searchText: '',
    });
    // Set up listener with reset filters
    setTimeout(setupAttendanceListener, 0);
  };

  // Table columns
  const columns = [
    {
      title: 'Date & Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => timestamp?.toLocaleString() || 'N/A',
      sorter: (a, b) => a.timestamp - b.timestamp,
    },
    {
      title: 'Student',
      dataIndex: 'studentName',
      key: 'studentName',
      sorter: (a, b) => a.studentName.localeCompare(b.studentName),
    },
    {
      title: 'Course',
      dataIndex: 'courseName',
      key: 'courseName',
      sorter: (a, b) => a.courseName.localeCompare(b.courseName),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'present' ? 'green' : 'red'}>
          {status === 'present' ? 'Present' : 'Absent'}
        </Tag>
      ),
      filters: [
        { text: 'Present', value: 'present' },
        { text: 'Absent', value: 'absent' },
      ],
      onFilter: (value, record) => record.status === value,
    },
  ];

  return (
    <div className="attendance-history">
      <Card title="Attendance History" className="filter-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <RangePicker 
              style={{ width: '100%' }} 
              onChange={handleDateRangeChange}
              value={filters.dateRange}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Select Course"
              style={{ width: '100%' }}
              allowClear
              value={filters.courseId}
              onChange={handleCourseChange}
            >
              {courses.map(course => (
                <Option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Select
              placeholder="Select Student"
              style={{ width: '100%' }}
              allowClear
              value={filters.studentId}
              onChange={handleStudentChange}
              showSearch
              optionFilterProp="children"
            >
              {students.map(student => (
                <Option key={student.id} value={student.id}>
                  {student.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Input
              placeholder="Search by name or course"
              value={filters.searchText}
              onChange={handleSearchChange}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24}>
            <Space>
              <Button 
                type="primary" 
                icon={<FilterOutlined />} 
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
              <CSVExport data={attendanceData} filename="attendance_history.csv" />
              <ExcelExport data={attendanceData} filename="attendance_history.xlsx" />
            </Space>
          </Col>
        </Row>
      </Card>
      
      <Card style={{ marginTop: 16 }}>
        <Table
          dataSource={attendanceData}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
}

export default AttendanceHistory;