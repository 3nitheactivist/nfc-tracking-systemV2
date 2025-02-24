import React, { useState, useEffect } from 'react';
import { Card, Avatar, Typography, Tag, Row, Col, Table, Button } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, IdcardOutlined, CreditCardOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const { Title } = Typography;

const StudentProfile = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const db = getFirestore();
  const [studentData, setStudentData] = useState(null);
  const [examHistory, setExamHistory] = useState([]);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const studentDoc = await getDoc(doc(db, 'Students', studentId));
        if (studentDoc.exists()) {
          setStudentData(studentDoc.data());
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };
    fetchStudentData();
  }, [db, studentId]);

  if (!studentData) {
    return <div>Loading...</div>;
  }

  const columns = [
    {
      title: 'Exam Name',
      dataIndex: 'examName',
      key: 'examName',
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
        <Tag color={status === 'Present' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
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
              <p>Enrollment Date: {studentData.enrollmentDate ? new Date(studentData.enrollmentDate.seconds * 1000).toLocaleDateString() : ''}</p>
            </Card>
          </Col>
        </Row>

        <Card title="Exam History" style={{ marginTop: '2rem' }}>
          <Table 
            columns={columns} 
            dataSource={examHistory} 
            pagination={false}
          />
        </Card>
      </Card>
    </motion.div>
  );
};

export default StudentProfile;