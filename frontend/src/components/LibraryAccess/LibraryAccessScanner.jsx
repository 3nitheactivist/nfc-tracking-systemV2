import React, { useState, useEffect, useRef } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Result,
  Typography,
  Space,
  Tag,
  Descriptions,
  Steps,
  Divider,
  Alert,
  Spin,
  Input,
  Modal,
  Form,
  Select,
  message
} from 'antd';
import {
  ScanOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  BookOutlined,
  HistoryOutlined,
  LogoutOutlined,
  LoginOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNFCScanner } from '../../hooks/useNFCScanner';
import { studentService } from '../../utils/firebase/studentService';
import { libraryService } from '../../utils/firebase/libraryService';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;

const LibraryAccessScanner = () => {
  const [form] = Form.useForm();
  const [manualForm] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [studentData, setStudentData] = useState(null);
  const [accessType, setAccessType] = useState(null); // 'check-in' or 'check-out'
  const [processing, setProcessing] = useState(false);
  const [accessResult, setAccessResult] = useState(null);
  const [error, setError] = useState(null);
  const [manualNfcId, setManualNfcId] = useState('');
  const [manualInputVisible, setManualInputVisible] = useState(false);
  const [tagId, setTagId] = useState('');
  const [student, setStudent] = useState(null);
  const [location, setLocation] = useState('Main Library');
  const [reason, setReason] = useState('Study');
  const [success, setSuccess] = useState(null);
  const [inLibrary, setInLibrary] = useState(false);
  const [activeAccessRecord, setActiveAccessRecord] = useState(null);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const inputRef = useRef(null);

  const {
    scanning,
    startScan,
    stopScan,
    lastScannedId,
    scanStatus
  } = useNFCScanner();

  // Define handleNFCScan before useEffect
  const handleNFCScan = async (nfcId) => {
    console.log('Processing scan with ID:', nfcId);
    setProcessing(true);
    setError(null);

    try {
      // Find student by NFC ID
      const foundStudent = await studentService.getStudentByNfcId(nfcId);
      
      if (!foundStudent) {
        setError(`No student found with ID: ${nfcId}`);
        setProcessing(false);
        return;
      }

      if (!foundStudent.permissions?.library) {
        setError(`${foundStudent.name} does not have library access permissions`);
        setProcessing(false);
        return;
      }

      // Check if student is already in library
      const { inLibrary } = await libraryService.isStudentInLibrary(foundStudent.id);
      console.log(`Student ${foundStudent.name} in library: ${inLibrary}`);
      
      // Set data for verification step
      setStudentData(foundStudent);
      setAccessType(inLibrary ? 'check-out' : 'check-in');
      
      // Move to verification step
      setCurrentStep(1);
      
    } catch (error) {
      console.error('Error processing scan:', error);
      setError('Failed to process scan. Please try again.');
    } finally {
      setProcessing(false);
      stopScan();
    }
  };

  // Fetch all students for manual selection
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const studentsData = await studentService.getAllStudents();
        setStudents(studentsData);
      } catch (err) {
        console.error('Error fetching students:', err);
        message.error('Failed to load students');
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, []);

  // Focus input when scanning starts
  useEffect(() => {
    if (scanning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [scanning]);

  // Reset form when student changes
  useEffect(() => {
    form.resetFields();
    if (student) {
      checkIfStudentInLibrary(student.id);
    } else {
      setInLibrary(false);
      setActiveAccessRecord(null);
    }
  }, [student, form]);

  // Add debugging for WebSocket connection
  useEffect(() => {
    console.log('NFC scan status:', scanStatus);
    console.log('Last scanned ID:', lastScannedId);
  }, [scanStatus, lastScannedId, scanning]);

  // Add this effect to process the scanned ID
  useEffect(() => {
    if (lastScannedId && scanStatus === 'success') {
      console.log('Processing scanned ID in library:', lastScannedId);
      handleNFCScan(lastScannedId);
    }
  }, [lastScannedId, scanStatus]);

  const handleStartScan = () => {
    setStudent(null);
    setError(null);
    setProcessing(false);
    startScan();
  };

  const showManualInputModal = () => {
    setManualInputVisible(true);
  };

  const handleManualInputCancel = () => {
    setManualInputVisible(false);
  };

  const handleManualInputSubmit = () => {
    if (manualNfcId.trim()) {
      setProcessing(true);
      handleNFCScan(manualNfcId.trim());
      setManualInputVisible(false);
    }
  };

  const checkIfStudentInLibrary = async (studentId) => {
    try {
      const isInLibrary = await libraryService.isStudentInLibrary(studentId);
      setInLibrary(isInLibrary);
      
      setActiveAccessRecord(isInLibrary ? { studentId } : null);
    } catch (error) {
      console.error('Error checking library status:', error);
    }
  };

  const handleConfirmAccess = async () => {
    setProcessing(true);
    
    try {
      const accessData = {
        studentId: studentData.id,
        studentName: studentData.name,
        accessType: accessType,
        location: location,
        reason: reason,
        status: 'active'
      };
      
      const result = await libraryService.recordAccess(accessData);
      
      if (result.success) {
        setAccessResult(result);
        setCurrentStep(2);
        setSuccess(`${studentData.name} has been checked ${accessType === 'check-in' ? 'in' : 'out'} of the library`);
      } else {
        throw new Error('Failed to record access');
      }
    } catch (err) {
      console.error('Error recording library access:', err);
      setError('Failed to record library access. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const resetScanner = () => {
    setProcessing(false);
    setCurrentStep(0);
    setStudentData(null);
    setAccessType(null);
    setAccessResult(null);
    setError(null);
    setManualNfcId('');
    setTagId('');
    setStudent(null);
    setLocation('Main Library');
    setReason('Study');
    setSuccess(null);
    setInLibrary(false);
    setActiveAccessRecord(null);
    form.resetFields();
    manualForm.resetFields();
  };

  // Toggle between NFC and manual mode
  const toggleMode = () => {
    setManualMode(!manualMode);
    setStudentData(null);
    setAccessType(null);
    setAccessResult(null);
    setError(null);
    setManualNfcId('');
  };

  // Custom loading icon
  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Scan" description="Scan student ID" />
          <Step title="Verify" description="Verify student information" />
          <Step title="Complete" description="Access recorded" />
        </Steps>
        
        <Divider />
        
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
            action={
              <Button size="small" type="primary" onClick={resetScanner}>
                Try Again
              </Button>
            }
          />
        )}
        
        {/* Global processing indicator */}
        {processing && (
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(255, 255, 255, 0.7)', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            zIndex: 1000,
            borderRadius: '8px'
          }}>
            <Space direction="vertical" align="center">
              <Spin indicator={antIcon} size="large" />
              <Text strong>Processing request...</Text>
            </Space>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Space direction="vertical" size="large">
                  {scanning ? (
                    <>
                      <Spin indicator={antIcon} size="large" />
                      <Title level={3}>Scanning...</Title>
                      <Text type="secondary">Please place your student ID card on the scanner</Text>
                      <Button 
                        type="default" 
                        onClick={() => {
                          setProcessing(false);
                          try {
                            stopScan();
                          } catch (err) {
                            console.error('Error stopping scan:', err);
                          }
                        }}
                        style={{ marginTop: 16 }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <ScanOutlined style={{ fontSize: 64, color: '#1890ff' }} />
                      <Title level={3}>Ready to Scan</Title>
                      <Text type="secondary">Click the button below to start scanning or enter an NFC ID manually</Text>
                      <Space>
                        <Button 
                          type="primary" 
                          size="large" 
                          icon={<ScanOutlined />} 
                          onClick={handleStartScan}
                          style={{ marginTop: 16 }}
                          disabled={processing} // Disable when processing
                        >
                          Start Scanning
                        </Button>
                        <Button
                          type="default"
                          size="large"
                          onClick={showManualInputModal}
                          style={{ marginTop: 16 }}
                          disabled={processing} // Disable when processing
                        >
                          Enter NFC ID Manually
                        </Button>
                      </Space>
                    </>
                  )}
                </Space>
              </div>
            </motion.div>
          )}
          
          {currentStep === 1 && studentData && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Card title="Student Information" bordered={false}>
                    <Descriptions layout="vertical" column={1}>
                      <Descriptions.Item label="Name">{studentData.name}</Descriptions.Item>
                      <Descriptions.Item label="ID">{studentData.nfcTagId}</Descriptions.Item>
                      <Descriptions.Item label="Department">{studentData.department || 'Computer Science'}</Descriptions.Item>
                      <Descriptions.Item label="Year">{studentData.year || '4th Year'}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card 
                    title="Access Information" 
                    bordered={false}
                    extra={
                      <Tag color={accessType === 'check-in' ? 'green' : 'red'}>
                        {accessType === 'check-in' ? 'Check In' : 'Check Out'}
                      </Tag>
                    }
                  >
                    <Descriptions layout="vertical" column={1}>
                      <Descriptions.Item label="Location">Main Library</Descriptions.Item>
                      <Descriptions.Item label="Date & Time">{new Date().toLocaleString()}</Descriptions.Item>
                      <Descriptions.Item label="Access Type">
                        {accessType === 'check-in' ? 'Library Entry' : 'Library Exit'}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>
              
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Space>
                  <Button onClick={resetScanner} disabled={processing}>Cancel</Button>
                  <Button 
                    type="primary" 
                    onClick={handleConfirmAccess}
                    loading={processing}
                  >
                    Confirm {accessType === 'check-in' ? 'Entry' : 'Exit'}
                  </Button>
                </Space>
              </div>
            </motion.div>
          )}
          
          {currentStep === 2 && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Result
                status="success"
                title={`Library ${accessType === 'check-in' ? 'Entry' : 'Exit'} Successful`}
                subTitle={`${studentData?.name || 'Student'} has successfully ${accessType === 'check-in' ? 'entered' : 'exited'} the library.`}
                extra={[
                  <Button 
                    type="primary" 
                    key="done" 
                    onClick={resetScanner}
                  >
                    Done
                  </Button>
                ]}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Modal for manual NFC ID input */}
      <Modal
        title="Enter NFC ID Manually"
        open={manualInputVisible}
        onOk={handleManualInputSubmit}
        onCancel={handleManualInputCancel}
        confirmLoading={processing} // Show loading on confirm button
      >
        <Input
          placeholder="Enter NFC ID"
          value={manualNfcId}
          onChange={(e) => setManualNfcId(e.target.value)}
          style={{ marginBottom: 16 }}
          disabled={processing} // Disable when processing
        />
        <Text type="secondary">
          Enter the NFC ID of a student that is already enrolled in the database.
        </Text>
      </Modal>
    </motion.div>
  );
};

export default LibraryAccessScanner;