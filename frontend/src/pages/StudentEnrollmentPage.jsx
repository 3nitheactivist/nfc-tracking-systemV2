import React, { useState, useEffect, useRef } from 'react';
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
  Result,
  Badge,
  Spin,
  Upload
} from 'antd';
import { motion } from 'framer-motion';
import { 
  UserOutlined, 
  IdcardOutlined, 
  ScanOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { studentService } from '../utils/firebase/studentService';
import { useBluetooth } from '../components/BluetoothButton/BluetoothContext';
import { fileToBase64 } from '../utils/imageUtills';

const { Title, Text } = Typography;

const StudentEnrollmentPage = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const scanTimeoutRef = useRef(null);
  const wsRef = useRef(null);
  
  // Use state to directly track form values
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    phone: '',
    schoolId: '',
    nfcTagId: ''
  });
  
  // Get Bluetooth connection state from context
  const { isBluetoothConnected } = useBluetooth();

  // WebSocket connection for fingerprint scanning
  useEffect(() => {
    // Only create WebSocket connection when scanning is active
    if (!scanning) return;

    // Create WebSocket connection
    wsRef.current = new WebSocket("ws://localhost:8080");

    wsRef.current.onopen = () => {
      console.log("WebSocket connection established.");
      message.info("Waiting for fingerprint scan...");
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket data:", data);
        
        if (data.fingerprintID && scanning) {
          const tagId = data.fingerprintID;
          
          // Update form with received data
          setStudentData(prev => ({ ...prev, nfcTagId: tagId }));
          form.setFieldValue('nfcTagId', tagId);
          setScanning(false);
          
          // Clear scan timeout if it exists
          if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
            scanTimeoutRef.current = null;
          }
          
          message.success('ID scanned successfully!');
          setCurrentStep(2); // Move to confirmation step
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      message.error("Connection error. Please try again.");
      setScanning(false);
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    // Cleanup when scanning stops or component unmounts
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [scanning, form]);

  const startScan = () => {
    if (!isBluetoothConnected) {
      message.error("Bluetooth is not connected. Please connect using the Bluetooth button in the sidebar.");
      return;
    }
    
    setScanning(true);
    
    // Set a timeout: if no data is received within 20 seconds, stop scanning
    scanTimeoutRef.current = setTimeout(() => {
      setScanning(false);
      message.error("Scanning timed out. Please try again.");
      scanTimeoutRef.current = null;
      
      // Close WebSocket if it's still open
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }, 20000); // 20 seconds
  };

  // Mock scan function for testing (when Bluetooth isn't available)
  const simulateNFCScan = () => {
    setScanning(true);
    setTimeout(() => {
      const mockNfcId = 'NFC_' + Math.random().toString(36).substr(2, 9);
      setStudentData(prev => ({ ...prev, nfcTagId: mockNfcId }));
      form.setFieldValue('nfcTagId', mockNfcId);
      setScanning(false);
      message.success('ID scanned successfully!');
      setCurrentStep(2);
    }, 2000);
  };

  const handleInputChange = (field, value) => {
    setStudentData(prev => ({ ...prev, [field]: value }));
  };

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // First, add this direct ref for the file input
  const fileInputRef = useRef(null);

  // Replace the entire Upload component in the form with this:
  <Form.Item label="Student Photo">
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Preview area */}
      <div 
        style={{ 
          width: 104, 
          height: 104, 
          border: '1px dashed #d9d9d9', 
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 8,
          overflow: 'hidden',
          background: '#fafafa'
        }}
      >
        {imagePreview ? (
          <img 
            src={imagePreview} 
            alt="avatar" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <PlusOutlined style={{ fontSize: 24, color: '#999' }} />
            <div style={{ marginTop: 8, color: '#999' }}>Upload Photo</div>
          </div>
        )}
      </div>
      
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          console.log("File selected:", file);
          
          if (!file) return;
          
          // Check file size
          if (file.size > 2 * 1024 * 1024) {
            message.error('Image must be smaller than 2MB!');
            return;
          }
          
          // Save file to state
          setImageFile(file);
          console.log("Image file set in state:", file.name);
          
          // Create preview
          const reader = new FileReader();
          reader.onload = (event) => {
            setImagePreview(event.target.result);
            console.log("Preview generated successfully");
          };
          reader.readAsDataURL(file);
        }}
      />
      
      {/* Button to trigger file selection */}
      <Button 
        onClick={() => fileInputRef.current?.click()}
        icon={uploadLoading ? <LoadingOutlined /> : <PlusOutlined />}
      >
        {uploadLoading ? 'Uploading...' : 'Select Photo'}
      </Button>
    </div>
  </Form.Item>

  const onFinish = async () => {
    try {
      // Validate that all required fields are filled
      const { name, email, phone, schoolId, nfcTagId } = studentData;
      if (!name || !email || !phone || !schoolId || !nfcTagId) {
        message.error('All fields are required');
        return;
      }

      setEnrolling(true);
      console.log('Image file available for upload:', imageFile ? `Yes (${imageFile.name})` : 'No', imageFile);
      
      let profileImageData = null;
      
      // Convert image to base64 if available - simple and direct approach
      if (imageFile) {
        try {
          // Use the preview we already generated
          if (imagePreview) {
            profileImageData = { 
              data: imagePreview,
              uploaded: new Date()
            };
            console.log('Using existing image preview for enrollment');
          } else {
            console.log('No preview available, reading file again');
            // Read file again if preview isn't available
            const reader = new FileReader();
            const base64Promise = new Promise((resolve, reject) => {
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(imageFile);
            });
            
            const base64Image = await base64Promise;
            profileImageData = {
              data: base64Image,
              uploaded: new Date()
            };
          }
          console.log('Image data prepared successfully');
        } catch (imageError) {
          console.error('Error processing image:', imageError);
          message.warning('Could not process the image, but continuing with enrollment');
        }
      } else {
        console.log('No image file selected');
      }

      // Add timestamp, image data and default values
      const dataToSubmit = {
        ...studentData,
        createdAt: new Date(),
        profileImage: profileImageData,
        permissions: {
          library: true,
          medical: true,
          campus: true,
          hostel: true
        },
        status: 'active'
      };

      console.log('Submitting student data with image:', profileImageData ? 'Image included' : 'No image');
      
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
          <Form.Item label="Student Photo">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Preview area */}
              <div 
                style={{ 
                  width: 104, 
                  height: 104, 
                  border: '1px dashed #d9d9d9', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 8,
                  overflow: 'hidden',
                  background: '#fafafa'
                }}
              >
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="avatar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <PlusOutlined style={{ fontSize: 24, color: '#999' }} />
                    <div style={{ marginTop: 8, color: '#999' }}>Upload Photo</div>
                  </div>
                )}
              </div>
              
              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  console.log("File selected:", file);
                  
                  if (!file) return;
                  
                  // Check file size
                  if (file.size > 2 * 1024 * 1024) {
                    message.error('Image must be smaller than 2MB!');
                    return;
                  }
                  
                  // Save file to state
                  setImageFile(file);
                  console.log("Image file set in state:", file.name);
                  
                  // Create preview
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setImagePreview(event.target.result);
                    console.log("Preview generated successfully");
                  };
                  reader.readAsDataURL(file);
                }}
              />
              
              {/* Button to trigger file selection */}
              <Button 
                onClick={() => fileInputRef.current?.click()}
                icon={uploadLoading ? <LoadingOutlined /> : <PlusOutlined />}
              >
                {uploadLoading ? 'Uploading...' : 'Select Photo'}
              </Button>
            </div>
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
            {/* Bluetooth Connection Status */}
            <Badge 
              status={isBluetoothConnected ? "success" : "error"} 
              text={isBluetoothConnected ? "Bluetooth connected" : "Bluetooth not connected"} 
              style={{ marginBottom: 16 }}
            />
            
            <Text>Please scan the student's ID</Text>
            <Form.Item 
              name="nfcTagId"
              rules={[{ required: true, message: 'Please scan ID' }]}
            >
              <Input 
                disabled 
                placeholder="ID" 
                size="large"
                value={studentData.nfcTagId} 
              />
            </Form.Item>
            
            {/* Scan button */}
            <Button 
              type="primary" 
              icon={<ScanOutlined />} 
              loading={scanning}
              onClick={startScan}
              size="large"
              disabled={scanning || !isBluetoothConnected}
              style={{ marginBottom: 8 }}
            >
              {scanning ? 'Scanning...' : 'Scan ID'}
            </Button>
            
            {/* Show simulation button in dev environment */}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                type="default" 
                onClick={simulateNFCScan}
                disabled={scanning}
              >
                Simulate Scan (Dev only)
              </Button>
            )}
            
            {/* Show scanning animation */}
            {scanning && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ marginTop: 20, textAlign: "center" }}
              >
                <Spin 
                  indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} 
                  tip="Waiting for scanner..." 
                />
              </motion.div>
            )}
            
            {!isBluetoothConnected && (
              <Text type="danger" style={{ marginTop: 16 }}>
                Please connect Bluetooth using the button in the sidebar
              </Text>
            )}
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
                setImageFile(null);
                setImagePreview('');
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
