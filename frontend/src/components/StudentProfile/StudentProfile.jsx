import React, { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Tag, Row, Col, Table, Button, Alert } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined, CreditCardOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import moment from 'moment';

const { Title } = Typography;

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const db = getFirestore();
  const [studentData, setStudentData] = useState(null);
  const [examHistory, setExamHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const studentDoc = await getDoc(doc(db, 'Students', studentId));
        if (studentDoc.exists()) {
          setStudentData(studentDoc.data());
        } else {
          setError('Student not found');
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        setError('Failed to fetch student data');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [db, studentId]);

  // Fetch exam history with improved error handling and attendance status
  useEffect(() => {
    const fetchExamHistory = async () => {
      try {
        setLoading(true);
        const attendanceRef = collection(db, 'AttendanceRecords');
        const q = query(attendanceRef, where('studentId', '==', studentId));
        const querySnapshot = await getDocs(q);
        
        const historyData = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const record = docSnap.data();
            try {
              const examDoc = await getDoc(doc(db, 'Exams', record.examId));
              if (!examDoc.exists()) {
                // Skip records where exam no longer exists
                return null;
              }
              
              const examData = examDoc.data();
              const examDate = examData.examDate.toDate();
              const now = new Date();
              
              // Determine attendance status
              let status = record.status || 'Present';
              if (examDate < now && !record.timestamp) {
                status = 'Absent';
              }

              return {
                key: docSnap.id,
                examName: examData.courseName,
                courseCode: examData.courseCode,
                date: record.timestamp
                  ? moment(record.timestamp.toDate()).format('MMM DD, YYYY, h:mm a')
                  : moment(examDate).format('MMM DD, YYYY, h:mm a'),
                status: status,
              };
            } catch (examError) {
              console.warn(`Failed to fetch exam details for ${record.examId}:`, examError);
              return null;
            }
          })
        );
        
        // Filter out null values and sort by date
        const validHistoryData = historyData
          .filter(record => record !== null)
          .sort((a, b) => moment(b.date) - moment(a.date));
        
        setExamHistory(validHistoryData);
      } catch (error) {
        console.error('Error fetching exam history:', error);
        setError('Failed to fetch exam history');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchExamHistory();
    }
  }, [db, studentId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        <Button 
          type="primary"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          style={{ marginBottom: '16px' }}
        >
          Back
        </Button>
        <Alert message={error} type="error" />
      </div>
    );
  }

  const columns = [
    {
      title: 'Exam Name',
      dataIndex: 'examName',
      key: 'examName',
      render: (text, record) => `${text} (${record.courseCode})`,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status.toLowerCase() === 'present' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Button 
        type="primary"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ 
          marginBottom: '16px',
          backgroundColor: '#00923f',
          borderColor: '#00923f'
        }}
      >
        Back
      </Button>

      <Card style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Avatar 
            size={100} 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#00923f' }} 
          />
          <Title level={2} style={{ marginTop: '1rem' }}>
            {studentData.firstName} {studentData.lastName}
          </Title>
          <Tag color="green">{studentData.status?.toUpperCase() || 'ACTIVE'}</Tag>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card size="small" title="Contact Information">
              <p><MailOutlined /> {studentData.email}</p>
              <p><PhoneOutlined /> {studentData.phone}</p>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="Academic Information">
              <p><IdcardOutlined /> Matric: {studentData.matricNumber || 'N/A'}</p>
              <p>Department: {studentData.department}</p>
            </Card>
          </Col>
          <Col span={24}>
            <Card size="small" title="NFC Information">
              <p><CreditCardOutlined /> NFC ID: {studentData.nfcTagId}</p>
              <p>
                Enrollment Date:{" "}
                {studentData.enrollmentDate
                  ? new Date(studentData.enrollmentDate.seconds * 1000).toLocaleDateString()
                  : ''}
              </p>
            </Card>
          </Col>
        </Row>

        <Card title="Exam History" style={{ marginTop: '2rem' }}>
          <Table 
            columns={columns} 
            dataSource={examHistory} 
            pagination={{
              pageSize: 5,
              total: examHistory.length,
              showTotal: (total) => `Total ${total} records`,
            }}
          />
        </Card>
      </Card>
    </motion.div>
  );
};

export default StudentProfile;
