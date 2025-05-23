import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Input, 
  Button, 
  Space, 
  Tooltip, 
  Tag, 
  Drawer, 
  Descriptions,
  message,
  Popconfirm,
  Tabs,
  Timeline,
  Collapse,
  Spin,
  Alert,
  Card
} from 'antd';
import { 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { studentService } from '../utils/firebase/studentService';
import dayjs from 'dayjs';
import { fetchStudentFullHistory } from '../utils/firebase/historyService';

const ViewEnrolledStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      console.log('Selected student for drawer:', selectedStudent);
      console.log('Profile image data available:', 
        selectedStudent.profileImage ? 
        `Yes, type: ${typeof selectedStudent.profileImage.data}, length: ${selectedStudent.profileImage.data?.length}` : 
        'No');
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const allStudents = await studentService.getAllStudents();
      setStudents(allStudents);
      setTableParams({
        ...tableParams,
        pagination: {
          ...tableParams.pagination,
          total: allStudents.length,
        },
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      message.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setTableParams({
      pagination,
    });
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const viewStudentDetails = (student) => {
    console.log('Viewing student details:', student);
    console.log('Student has profile image:', student.profileImage ? 'Yes' : 'No');
    setSelectedStudent(student);
    setDrawerVisible(true);
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      setLoading(true);
      await studentService.deleteStudentWithRelatedData(studentId);
      message.success('Student and all related data deleted successfully');
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      message.error('Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchText) return students;
    
    return students.filter(student => 
      student.name.toLowerCase().includes(searchText.toLowerCase()) ||
      student.email.toLowerCase().includes(searchText.toLowerCase()) ||
      student.schoolId.toLowerCase().includes(searchText.toLowerCase()) ||
      student.phone.includes(searchText)
    );
  };

  const refreshSelectedStudent = async () => {
    if (!selectedStudent?.id) return;
    
    try {
      console.log('Refreshing student data for ID:', selectedStudent.id);
      const refreshedStudent = await studentService.getStudentById(selectedStudent.id);
      if (refreshedStudent) {
        console.log('Refreshed student data:', refreshedStudent);
        setSelectedStudent(refreshedStudent);
      }
    } catch (error) {
      console.error('Error refreshing student:', error);
    }
  };

  const columns = [
    {
      title: 'Photo',
      key: 'photo',
      render: (_, record) => (
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#f0f2f5',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {record.profileImage?.data ? (
            <img 
              src={record.profileImage.data}
              alt={record.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<span class="anticon anticon-user" style="font-size: 20px; color: #1890ff;"></span>';
              }}
            />
          ) : (
            <UserOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          )}
        </div>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <a>{text}</a>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'School ID',
      dataIndex: 'schoolId',
      key: 'schoolId',
    },
    {
      title: 'Program',
      dataIndex: 'program',
      key: 'program',
    },
    {
      title: 'Enrollment Date',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      render: (date) => date ? dayjs(date.toDate()).format('MMM D, YYYY') : 'N/A',
      sorter: (a, b) => {
        if (!a.enrollmentDate || !b.enrollmentDate) return 0;
        return a.enrollmentDate.toDate() - b.enrollmentDate.toDate();
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status?.toUpperCase() || 'N/A'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Inactive', value: 'inactive' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => viewStudentDetails(record)} 
            />
          </Tooltip>
          {/* <Tooltip title="Edit">
            <Button icon={<EditOutlined />} />
          </Tooltip> */}
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete this student?"
              description="This will delete all related records for this student."
              onConfirm={() => handleDeleteStudent(record.id)}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger 
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search students..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Button 
            type="primary" 
            onClick={fetchStudents}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={filterStudents()}
          rowKey="id"
          loading={loading}
          pagination={tableParams.pagination}
          onChange={handleTableChange}
          size="middle"
          scroll={{ x: true }}
        />

        <Drawer
          title="Student Details"
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={500}
          extra={
            <Button 
              icon={<ReloadOutlined />}
              onClick={refreshSelectedStudent}
            >
              Refresh
            </Button>
          }
        >
          {selectedStudent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Tabs defaultActiveKey="info">
                <Tabs.TabPane tab="Info" key="info">
                  <Space
                    direction="vertical"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: 24
                    }}
                  >
                    <div
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: '#f0f2f5',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 16,
                        overflow: 'hidden'
                      }}
                    >
                      {console.log('Profile image data in drawer:', selectedStudent?.profileImage)}
                      
                      {selectedStudent?.profileImage?.data ? (
                        <img 
                          src={selectedStudent.profileImage.data}
                          alt={selectedStudent.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            console.error('Error loading image in drawer');
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = '<span class="anticon anticon-user" style="font-size: 48px; color: #1890ff;"></span>';
                          }}
                        />
                      ) : (
                        <UserOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                      )}
                    </div>
                    <h2>{selectedStudent.name}</h2>
                    <Tag color={selectedStudent.status === 'active' ? 'green' : 'red'}>
                      {selectedStudent.status?.toUpperCase() || 'N/A'}
                    </Tag>
                  </Space>
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="School">{selectedStudent.school}</Descriptions.Item>
                    <Descriptions.Item label="Department">{selectedStudent.department}</Descriptions.Item>
                    <Descriptions.Item label="Program">{selectedStudent.program}</Descriptions.Item>
                    <Descriptions.Item label="Level">{selectedStudent.level}</Descriptions.Item>
                    <Descriptions.Item label="Enrollment Date">{selectedStudent.enrollmentDate ? dayjs(selectedStudent.enrollmentDate.toDate()).format('MMMM D, YYYY') : 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="School ID">{selectedStudent.schoolId}</Descriptions.Item>
                    <Descriptions.Item label="NFC Tag ID">{selectedStudent.nfcTagId}</Descriptions.Item>
                    <Descriptions.Item label="Email">{selectedStudent.email}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{selectedStudent.phone}</Descriptions.Item>
                  </Descriptions>
                  <Descriptions bordered column={1} style={{ marginTop: 24 }}>
                    <Descriptions.Item label="Library Access">
                      <Tag color={selectedStudent.permissions?.library ? 'green' : 'red'}>
                        {selectedStudent.permissions?.library ? 'ENABLED' : 'DISABLED'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Medical Access">
                      <Tag color={selectedStudent.permissions?.medical ? 'green' : 'red'}>
                        {selectedStudent.permissions?.medical ? 'ENABLED' : 'DISABLED'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Campus Access">
                      <Tag color={selectedStudent.permissions?.campus ? 'green' : 'red'}>
                        {selectedStudent.permissions?.campus ? 'ENABLED' : 'DISABLED'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Hostel Access">
                      <Tag color={selectedStudent.permissions?.hostel ? 'green' : 'red'}>
                        {selectedStudent.permissions?.hostel ? 'ENABLED' : 'DISABLED'}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Tabs.TabPane>
                <Tabs.TabPane tab="History" key="history">
                  <StudentHistoryTimeline studentId={selectedStudent.id} />
                </Tabs.TabPane>
              </Tabs>
            </motion.div>
          )}
        </Drawer>
      </Space>
    </motion.div>
  );
};

function StudentHistoryTimeline({ studentId }) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [history, setHistory] = React.useState({});

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchStudentFullHistory(studentId)
      .then((grouped) => {
        if (mounted) setHistory(grouped);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch history');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [studentId]);

  if (loading) return <Spin tip="Loading student history..." />;
  if (error) return <Alert type="error" message={error} />;
  if (!history || Object.keys(history).length === 0) return <Alert type="info" message="No history found for this student." />;

  return (
    <Collapse accordion>
      {Object.entries(history).map(([module, records]) => (
        <Collapse.Panel header={<b>{module}</b>} key={module}>
          <Timeline mode="left">
            {records.map((rec, idx) => (
              <Timeline.Item key={rec.id || idx}>
                <Card size="small" style={{ marginBottom: 12, background: '#fafcff', border: '1px solid #e6f7ff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{formatHistoryDate(rec)}</span>
                    {renderStatusTag(rec)}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>{formatHistoryTitle(rec)}</div>
                  <div style={{ color: '#555', fontSize: 13 }}>{formatHistoryDetails(rec)}</div>
                </Card>
              </Timeline.Item>
            ))}
          </Timeline>
        </Collapse.Panel>
      ))}
    </Collapse>
  );
}

function renderStatusTag(rec) {
  let color = 'default', text = (rec.status || '').toUpperCase();
  switch ((rec.status || '').toLowerCase()) {
    case 'present':
    case 'completed':
      color = 'green'; text = 'COMPLETED'; break;
    case 'absent':
      color = 'red'; text = 'ABSENT'; break;
    case 'in-progress':
      color = 'orange'; text = 'IN PROGRESS'; break;
    case 'not checked out':
      color = 'orange'; text = 'NOT CHECKED OUT'; break;
    default:
      color = 'blue';
  }
  return <Tag color={color} style={{ fontWeight: 600 }}>{text}</Tag>;
}

function formatHistoryTitle(rec) {
  switch (rec.module) {
    case 'Exam Attendance':
      return `${rec.examTitle || 'Exam'}${rec.courseCode ? ' (' + rec.courseCode + ')' : ''}`;
    case 'Class Attendance':
      return `${rec.courseName || rec.courseCode || 'Class'}`;
    case 'Library':
      return `${rec.location || 'Library'} Access`;
    case 'Campus Access':
      return `${rec.eventType || rec.accessType || 'Access Event'}`;
    case 'Medical':
      return `${rec.diagnosis || rec.type || 'Medical Visit'}`;
    default:
      return rec.module;
  }
}

function formatHistoryDetails(rec) {
  switch (rec.module) {
    case 'Exam Attendance':
      return [
        rec.examLocation && `Location: ${rec.examLocation}`,
        rec.duration && `Duration: ${rec.duration} min`,
        rec.examiner && `Examiner: ${rec.examiner}`,
        rec.status && `Status: ${rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}`
      ].filter(Boolean).join(' | ');
    case 'Class Attendance':
      return `Status: ${rec.status || 'N/A'}`;
    case 'Library':
      return `Type: ${rec.accessType || 'N/A'}${rec.location ? ' | Location: ' + rec.location : ''}`;
    case 'Campus Access':
      return `Type: ${rec.eventType || rec.accessType || 'N/A'}${rec.reason ? ' | Reason: ' + rec.reason : ''}`;
    case 'Medical':
      return [
        rec.doctorName && `Doctor: ${rec.doctorName}`,
        rec.status && `Status: ${rec.status}`
      ].filter(Boolean).join(' | ');
    default:
      return JSON.stringify(rec);
  }
}

function formatHistoryDate(rec) {
  let date = rec.timestamp || rec.checkInTime || rec.createdAt || rec.visitDate || rec.date;
  if (!date) return '';
  try {
    // Firestore Timestamp object
    if (typeof date === 'object' && date.seconds !== undefined && date.nanoseconds !== undefined && typeof date.toDate === 'function') {
      date = date.toDate();
    }
    // If still not a Date, try to convert
    if (!(date instanceof Date)) date = new Date(date);
    return date.toLocaleString('en-NG', { timeZone: 'Africa/Lagos' });
  } catch {
    return String(date);
  }
}

export default ViewEnrolledStudentsPage; 