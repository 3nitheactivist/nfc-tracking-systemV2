import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Drawer,
  Descriptions,
  Badge,
  Tabs,
  Alert,
  Statistic,
  Row,
  Col,
  Progress,
  List,
  Empty
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  UserOutlined,
  FileExcelOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase/firebase';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ViewExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [activeTab, setActiveTab] = useState('1');
  const [absentStudents, setAbsentStudents] = useState([]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const examsRef = collection(db, 'Exams');
      const examsQuery = query(examsRef, orderBy('examDate', 'desc'));
      const querySnapshot = await getDocs(examsQuery);
      
      const today = dayjs().startOf('day');
      const examsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const examDate = dayjs(data.examDate.toDate());
        const isNew = examDate.isSame(today, 'day');
        
        return {
          id: doc.id,
          ...data,
          isNew
        };
      });
      
      setExams(examsList);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async (examId) => {
    try {
      const attendanceRef = collection(db, 'examAttendance');
      const attendanceQuery = query(attendanceRef, where('examId', '==', examId));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      const registrationRef = collection(db, 'examRegistrations');
      const regQuery = query(registrationRef, where('examId', '==', examId));
      const regSnapshot = await getDocs(regQuery);
      
      const registeredStudents = await Promise.all(
        regSnapshot.docs.map(async (regDoc) => {
          const studentRef = doc(db, 'students', regDoc.data().studentId);
          const studentSnap = await getDoc(studentRef);
          return {
            id: regDoc.data().studentId,
            ...studentSnap.data()
          };
        })
      );
      
      const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());
      
      const absentStudents = registeredStudents.filter(student => 
        !attendanceRecords.some(record => record.studentId === student.id)
      );
      
      const statistics = {
        totalRegistered: registeredStudents.length,
        checkedIn: attendanceRecords.filter(r => r.checkInTime).length,
        checkedOut: attendanceRecords.filter(r => r.checkOutTime).length,
        absent: absentStudents.length,
        incomplete: attendanceRecords.filter(r => r.checkInTime && !r.checkOutTime).length
      };
      
      return {
        records: attendanceRecords,
        statistics,
        absentStudents
      };
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return null;
    }
  };

  const handleViewAttendance = async (exam) => {
    setSelectedExam(exam);
    const data = await fetchAttendanceData(exam.id);
    setAttendanceData(data);
    setDrawerVisible(true);
  };

  const exportAttendance = (exam, data) => {
    try {
      const records = data.records.map(record => ({
        'Student Name': record.studentName,
        'Student ID': record.studentId,
        'Check-in Time': record.checkInTime?.toDate().toLocaleString() || 'N/A',
        'Check-out Time': record.checkOutTime?.toDate().toLocaleString() || 'N/A',
        'Status': record.status
      }));

      const worksheet = XLSX.utils.json_to_sheet(records);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
      XLSX.writeFile(workbook, `${exam.courseName}_Attendance.xlsx`);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const columns = [
    {
      title: 'Course Name',
      dataIndex: 'courseName',
      key: 'courseName',
      render: (text, record) => (
        <Space>
          {text}
          {record.isNew && <Badge status="processing" text="New" />}
        </Space>
      )
    },
    {
      title: 'Course Code',
      dataIndex: 'courseCode',
      key: 'courseCode',
    },
    {
      title: 'Date & Time',
      dataIndex: 'examDate',
      key: 'examDate',
      render: (date) => dayjs(date.toDate()).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Location',
      dataIndex: 'examLocation',
      key: 'examLocation',
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const examDate = dayjs(record.examDate.toDate());
        const now = dayjs();
        
        if (examDate.isAfter(now)) {
          return <Tag color="blue">Upcoming</Tag>;
        } else if (examDate.isSame(now, 'day')) {
          return <Tag color="green">Today</Tag>;
        } else {
          return <Tag color="default">Completed</Tag>;
        }
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<HistoryOutlined />}
          onClick={() => handleViewAttendance(record)}
        >
          View Attendance
        </Button>
      ),
    },
  ];

  const AttendanceStatistics = ({ data }) => (
    <Row gutter={16}>
      <Col span={8}>
        <Statistic 
          title="Total Registered" 
          value={data.statistics.totalRegistered}
          prefix={<UserOutlined />}
        />
      </Col>
      <Col span={8}>
        <Statistic 
          title="Present" 
          value={data.statistics.checkedIn}
          prefix={<CheckCircleOutlined />}
          valueStyle={{ color: '#3f8600' }}
        />
      </Col>
      <Col span={8}>
        <Statistic 
          title="Absent" 
          value={data.statistics.absent}
          prefix={<CloseCircleOutlined />}
          valueStyle={{ color: '#cf1322' }}
        />
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Title level={3} style={{ margin: 0 }}>Exam Records</Title>
          </Space>
          
          <Table 
            columns={columns} 
            dataSource={exams}
            rowKey="id"
            loading={loading}
          />
        </Space>
      </Card>

      <Drawer
        title={`Attendance Details - ${selectedExam?.courseName}`}
        placement="right"
        width={720}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Button 
            icon={<FileExcelOutlined />}
            onClick={() => exportAttendance(selectedExam, attendanceData)}
          >
            Export
          </Button>
        }
      >
        {attendanceData && (
          <>
            <AttendanceStatistics data={attendanceData} />
            
            <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: 24 }}>
              <TabPane tab="Overview" key="1">
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <Progress
                    percent={Math.round((attendanceData.statistics.checkedIn / attendanceData.statistics.totalRegistered) * 100)}
                    format={percent => `${percent}% Attendance`}
                  />
                  
                  <Alert
                    message={`${attendanceData.statistics.incomplete} students haven't checked out`}
                    type="warning"
                    showIcon
                  />

                  <Card title="Absent Students" size="small">
                    {attendanceData.absentStudents.length > 0 ? (
                      <List
                        size="small"
                        dataSource={attendanceData.absentStudents}
                        renderItem={student => (
                          <List.Item>
                            <List.Item.Meta
                              avatar={
                                <div style={{ 
                                  width: 32, 
                                  height: 32, 
                                  borderRadius: '50%',
                                  overflow: 'hidden',
                                  background: '#f0f2f5',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center'
                                }}>
                                  {student.profileImage?.data ? (
                                    <img 
                                      src={student.profileImage.data}
                                      alt={student.name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        e.target.parentNode.innerHTML = '<span class="anticon anticon-user" style="font-size: 16px; color: #1890ff;"></span>';
                                      }}
                                    />
                                  ) : (
                                    <UserOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                                  )}
                                </div>
                              }
                              title={student.name}
                              description={`ID: ${student.schoolId}`}
                            />
                            <Tag color="red">Absent</Tag>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Empty description="No absent students" />
                    )}
                  </Card>
                </Space>
              </TabPane>
              
              <TabPane tab="Detailed Records" key="2">
                <Table
                  dataSource={attendanceData.records}
                  columns={[
                    {
                      title: 'Student Name',
                      dataIndex: 'studentName',
                      key: 'studentName',
                    },
                    {
                      title: 'Status',
                      key: 'status',
                      render: (_, record) => {
                        if (!record.checkInTime) return <Tag color="red">Absent</Tag>;
                        if (!record.checkOutTime) return <Tag color="orange">Not Checked Out</Tag>;
                        return <Tag color="green">Completed</Tag>;
                      }
                    },
                    {
                      title: 'Check-in Time',
                      dataIndex: 'checkInTime',
                      key: 'checkInTime',
                      render: time => time ? dayjs(time.toDate()).format('HH:mm:ss') : 'N/A'
                    },
                    {
                      title: 'Check-out Time',
                      dataIndex: 'checkOutTime',
                      key: 'checkOutTime',
                      render: time => time ? dayjs(time.toDate()).format('HH:mm:ss') : 'N/A'
                    }
                  ]}
                  rowKey="studentId"
                />
              </TabPane>

              <TabPane tab={`Absent (${attendanceData.absentStudents.length})`} key="3">
                <List
                  dataSource={attendanceData.absentStudents}
                  renderItem={student => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
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
                            {student.profileImage?.data ? (
                              <img 
                                src={student.profileImage.data}
                                alt={student.name}
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
                        }
                        title={<Text strong>{student.name}</Text>}
                        description={
                          <Space direction="vertical" size="small">
                            <Text type="secondary">ID: {student.schoolId}</Text>
                            <Text type="secondary">Contact: {student.contact || 'N/A'}</Text>
                          </Space>
                        }
                      />
                      <Tag color="red">Absent</Tag>
                    </List.Item>
                  )}
                  bordered
                  style={{ backgroundColor: '#fff' }}
                />
              </TabPane>
            </Tabs>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default ViewExams; 