import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  message, 
  Steps, 
  Space,
  Typography,
  Divider,
  Result 
} from 'antd';
import { motion } from 'framer-motion';
import { 
  UserOutlined, 
  IdcardOutlined, 
  ScanOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import { useNFCScanner } from '../hooks/useNFCScanner';
import { studentService } from '../utils/firebase/studentService';

const { Title, Text } = Typography;

const StudentEnrollmentPage = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  
  // Use state to directly track form values
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    phone: '',
    schoolId: '',
    nfcTagId: ''
  });
  
  const { nfcData, isConnected } = useNFCScanner();

  useEffect(() => {
    if (nfcData) {
      setStudentData(prev => ({ ...prev, nfcTagId: nfcData }));
      form.setFieldValue('nfcTagId', nfcData);
      setScanning(false);
      message.success('NFC tag scanned successfully!');
      setCurrentStep(2);
    }
  }, [nfcData, form]);

  const startNFCScan = async () => {
    if (!isConnected) {
      message.error('Scanner not connected');
      return;
    }
    setScanning(true);
    // The actual scan will be handled by the WebSocket connection
  };

  // Mock NFC scanning process for testing
  const simulateNFCScan = () => {
    setScanning(true);
    setTimeout(() => {
      const mockNfcId = 'NFC_' + Math.random().toString(36).substr(2, 9);
      setStudentData(prev => ({ ...prev, nfcTagId: mockNfcId }));
      form.setFieldValue('nfcTagId', mockNfcId);
      setScanning(false);
      message.success('NFC tag scanned successfully!');
      setCurrentStep(2);
    }, 2000);
  };

  const handleInputChange = (field, value) => {
    setStudentData(prev => ({ ...prev, [field]: value }));
  };

  const onFinish = async () => {
    try {
      // Validate that all required fields are filled
      const { name, email, phone, schoolId, nfcTagId } = studentData;
      if (!name || !email || !phone || !schoolId || !nfcTagId) {
        message.error('All fields are required');
        return;
      }

      setEnrolling(true);

      // Add timestamp
      const dataToSubmit = {
        ...studentData,
        createdAt: new Date()
      };

      console.log('Submitting student data:', studentData);
      
      const result = await studentService.enrollStudent(dataToSubmit);
      
      if (result.success) {
        message.success('Student enrolled successfully!');
        setIsCompleted(true);
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      message.error(error.message || 'Failed to enroll student');
    } finally {
      setEnrolling(false);
    }
  };

  const steps = [
    {
      title: 'Basic Info',
      icon: <UserOutlined />,
      content: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Form.Item 
            name="name" 
            rules={[{ required: true, message: 'Please enter student name' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Full Name" 
              size="large"
              value={studentData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </Form.Item>
          <Form.Item 
            name="email" 
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Email Address" 
              size="large"
              value={studentData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </Form.Item>
          <Form.Item 
            name="phone" 
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Phone Number" 
              size="large"
              value={studentData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </Form.Item>
          <Form.Item 
            name="schoolId" 
            rules={[{ required: true, message: 'Please enter school ID' }]}
          >
            <Input 
              prefix={<IdcardOutlined />} 
              placeholder="School ID" 
              size="large"
              value={studentData.schoolId}
              onChange={(e) => handleInputChange('schoolId', e.target.value)}
            />
          </Form.Item>
        </motion.div>
      ),
    },
    {
      title: 'NFC Scan',
      icon: <ScanOutlined />,
      content: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Space direction="vertical" align="center" style={{ width: '100%' }}>
            <Text>Please scan the student's NFC tag</Text>
            <Form.Item 
              name="nfcTagId"
              rules={[{ required: true, message: 'Please scan NFC tag' }]}
            >
              <Input 
                disabled 
                placeholder="NFC Tag ID" 
                size="large"
                value={studentData.nfcTagId} 
              />
            </Form.Item>
            <Button 
              type="primary" 
              icon={<ScanOutlined />} 
              loading={scanning}
              onClick={simulateNFCScan}
              size="large"
            >
              {scanning ? 'Scanning...' : 'Start Scan'}
            </Button>
          </Space>
        </motion.div>
      ),
    },
    {
      title: 'Confirm',
      icon: <CheckCircleOutlined />,
      content: (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Please review and confirm the enrollment details</Text>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Name:</Text> {studentData.name}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Email:</Text> {studentData.email}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>Phone:</Text> {studentData.phone}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>School ID:</Text> {studentData.schoolId}
            </div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>NFC Tag ID:</Text> {studentData.nfcTagId}
            </div>
            <Button 
              type="primary" 
              size="large" 
              onClick={onFinish}
              loading={enrolling}
              disabled={enrolling}
            >
              {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
            </Button>
          </Space>
        </motion.div>
      ),
    },
  ];

  if (isCompleted) {
    return (
      <Card style={{ maxWidth: 800, margin: '24px auto' }}>
        <Result
          status="success"
          title="Student Enrolled Successfully!"
          subTitle="The student has been registered in the system"
          extra={[
            <Button 
              type="primary" 
              key="new" 
              onClick={() => {
                form.resetFields();
                setStudentData({
                  name: '',
                  email: '',
                  phone: '',
                  schoolId: '',
                  nfcTagId: ''
                });
                setCurrentStep(0);
                setIsCompleted(false);
              }}
            >
              Enroll Another Student
            </Button>
          ]}
        />
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card style={{ maxWidth: 800, margin: '24px auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          Student Enrollment
        </Title>

        <Steps
          current={currentStep}
          items={steps.map(step => ({
            title: step.title,
            icon: step.icon,
          }))}
          style={{ marginBottom: 32 }}
        />

        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: 500, margin: '0 auto' }}
        >
          {steps[currentStep].content}
        </Form>

        <Divider />

        <Space style={{ width: '100%', justifyContent: 'center' }}>
          {currentStep > 0 && (
            <Button 
              style={{ margin: '0 8px' }} 
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Previous
            </Button>
          )}
          {currentStep < steps.length - 1 && currentStep !== 1 && (
            <Button 
              type="primary" 
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Next
            </Button>
          )}
        </Space>
      </Card>
    </motion.div>
  );
};

export default StudentEnrollmentPage;
