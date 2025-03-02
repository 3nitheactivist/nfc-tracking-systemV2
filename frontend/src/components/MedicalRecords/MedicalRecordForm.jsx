import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Select, message, Row, Col, Card, Alert, Spin } from 'antd';
import { ScanOutlined, UserOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';
import { useNFCScanner } from '../../hooks/useNFCScanner';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import { medicalService } from '../../utils/firebase/medicalService';

const { TextArea } = Input;
const { Option } = Select;

function MedicalRecordForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [manualNfcId, setManualNfcId] = useState('');
  
  // NFC scanner integration
  const { startScan, stopScan, scanning, lastScannedId, scanStatus: nfcScanStatus } = useNFCScanner();
  const { handleNFCScan, student, scanStatus: studentScanStatus, resetStudent } = useMedicalRecords();
  
  // When a new NFC ID is scanned, process it
  useEffect(() => {
    if (lastScannedId && nfcScanStatus === 'success') {
      handleNFCScan(lastScannedId);
    }
  }, [lastScannedId, nfcScanStatus, handleNFCScan]);
  
  // When a student is loaded, pre-fill the form
  useEffect(() => {
    if (student) {
      form.setFieldsValue({
        patientName: student.name,
        patientId: student.id,
        patientGender: student.gender || 'male',
      });
    }
  }, [student, form]);

  const handleSubmit = async (values) => {
    if (!student) {
      message.error('Please scan student NFC card first');
      return;
    }
    
    try {
      setLoading(true);
      const record = {
        ...values,
        visitDate: values.visitDate.toDate(),
        createdAt: serverTimestamp(),
      };

      // Use the medical service to add the record
      await medicalService.addMedicalRecord(record);
      message.success('Medical record added successfully!');
      form.resetFields();
      
      // Keep the patient information for potential additional records
      form.setFieldsValue({
        patientName: student.name,
        patientId: student.id,
        patientGender: student.gender || 'male',
      });
    } catch (error) {
      console.error('Error adding record:', error);
      message.error('Failed to add medical record');
    } finally {
      setLoading(false);
    }
  };

  // Start a new scan process
  const handleStartScan = () => {
    resetStudent();
    form.resetFields();
    startScan();
  };

  // Cancel the current student session
  const handleCancelStudent = () => {
    resetStudent();
    form.resetFields();
    stopScan();
  };

  // Handle manual NFC ID input
  const handleManualNfcSubmit = async () => {
    if (!manualNfcId.trim()) {
      message.error('Please enter a valid NFC ID');
      return;
    }

    // Try different formats of the NFC ID
    const formattedId = formatNfcId(manualNfcId.trim());
    await handleNFCScan(formattedId);
  };

  // Format NFC ID to try different variations
  const formatNfcId = (id) => {
    // Remove any prefixes and underscores to get the base ID
    const baseId = id.replace(/^(nfc[_-]?)/i, '').toUpperCase();
    
    // Return the original input - the hook will try different formats
    return baseId;
  };

  return (
    <div className="medical-form-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Student Identification" className="scanner-card">
            {!student ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Button 
                      type="primary" 
                      icon={<ScanOutlined />} 
                      onClick={handleStartScan}
                      loading={scanning || studentScanStatus === 'scanning'}
                      size="large"
                    >
                      {scanning ? 'Scanning...' : 'Scan Student Card'}
                    </Button>
                  </Col>
                  
                  <Col span={24} style={{ marginTop: 16 }}>
                    <Input.Group compact>
                      <Input 
                        style={{ width: 'calc(100% - 120px)' }} 
                        placeholder="Or enter NFC ID manually"
                        value={manualNfcId}
                        onChange={(e) => setManualNfcId(e.target.value)}
                        onPressEnter={handleManualNfcSubmit}
                      />
                      <Button 
                        type="primary" 
                        onClick={handleManualNfcSubmit}
                        loading={studentScanStatus === 'scanning'}
                      >
                        Submit
                      </Button>
                    </Input.Group>
                  </Col>
                </Row>
                
                {nfcScanStatus === 'scanning' && (
                  <div style={{ marginTop: 16 }}>
                    <Spin /> <span style={{ marginLeft: 8 }}>Scanning NFC card...</span>
                  </div>
                )}
                
                {studentScanStatus === 'error' && (
                  <Alert 
                    message="Student not found or doesn't have medical access" 
                    type="error" 
                    showIcon 
                    style={{ marginTop: 16 }} 
                  />
                )}
              </div>
            ) : (
              <div>
                <Alert
                  message={`Student: ${student.name}`}
                  description={`ID: ${student.id} | Course: ${student.course || 'N/A'}`}
                  type="success"
                  showIcon
                  icon={<UserOutlined />}
                  action={
                    <Button 
                      danger 
                      icon={<CloseCircleOutlined />} 
                      onClick={handleCancelStudent}
                    >
                      Cancel
                    </Button>
                  }
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {student && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ 
            patientGender: 'male',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="patientName"
                label="Patient Name"
                rules={[{ required: true, message: 'Please enter patient name' }]}
              >
                <Input placeholder="Full name" disabled />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="patientId"
                label="Patient ID"
                rules={[{ required: true, message: 'Please enter patient ID' }]}
              >
                <Input placeholder="Patient ID" disabled />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="patientGender"
                label="Gender"
                rules={[{ required: true }]}
              >
                <Select disabled>
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="visitDate"
                label="Visit Date"
                rules={[{ required: true, message: 'Please select visit date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="doctorName"
                label="Doctor Name"
                rules={[{ required: true, message: 'Please enter doctor name' }]}
              >
                <Input placeholder="Doctor Name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="department"
                label="Department"
              >
                <Input placeholder="Department" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="diagnosis"
            label="Diagnosis"
            rules={[{ required: true, message: 'Please enter diagnosis' }]}
          >
            <Input placeholder="Diagnosis" />
          </Form.Item>

          <Form.Item
            name="treatment"
            label="Treatment/Prescription"
          >
            <TextArea rows={4} placeholder="Enter treatment details or prescription" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Additional Notes"
          >
            <TextArea rows={4} placeholder="Additional notes" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit Record
            </Button>
          </Form.Item>
        </Form>
      )}
    </div>
  );
}

export default MedicalRecordForm;