import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, DatePicker, Button, Select, message, Row, Col, Card, Alert, Spin } from 'antd';
import { ScanOutlined, UserOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';
import { useNFCScanner } from '../../hooks/useNFCScanner';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import { medicalService } from '../../utils/firebase/medicalService';
import { studentService } from '../../utils/firebase/studentService';

const { TextArea } = Input;
const { Option } = Select;

function MedicalRecordForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [manualNfcId, setManualNfcId] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const {
    scanning,
    startScan,
    stopScan,
    lastScannedId,
    scanStatus
  } = useNFCScanner();
  
  const [student, setStudent] = useState(null);
  const [scanError, setScanError] = useState(null);
  
  const [inputMethod, setInputMethod] = useState('manual'); // 'manual' or 'scan'
  
  useEffect(() => {
    console.log('Scan status changed:', { scanStatus, lastScannedId, scanning });
    
    if (lastScannedId) {
      console.log('Processing scanned ID:', lastScannedId);
      handleNFCScan(lastScannedId);
    }
  }, [lastScannedId]);
  
  useEffect(() => {
    if (student) {
      form.setFieldsValue({
        patientName: student.name,
        patientId: student.id,
        patientGender: student.gender || 'male',
      });
    }
  }, [student, form]);

  useEffect(() => {
    console.log('Medical form - NFC scan status:', scanStatus);
    console.log('Medical form - Last scanned ID:', lastScannedId);
  }, [scanStatus, lastScannedId]);

  const handleNFCScan = async (nfcId) => {
    console.log('Starting handleNFCScan with ID:', nfcId);
    setProcessing(true);
    setScanError(null);

    try {
      const foundStudent = await studentService.getStudentByNfcId(nfcId);
      console.log('Database lookup result:', foundStudent);

      if (!foundStudent) {
        console.log('No student found');
        setScanError(`No student found with ID: ${nfcId}`);
        return;
      }

      if (!foundStudent.permissions?.medical) {
        console.log('No medical permissions');
        setScanError(`${foundStudent.name} does not have medical access permissions`);
        return;
      }

      console.log('Setting student:', foundStudent);
      setStudent(foundStudent);
      message.success(`Student ${foundStudent.name} found successfully!`);
      
    } catch (error) {
      console.error('Error in handleNFCScan:', error);
      setScanError('Failed to process student ID. Please try again.');
    } finally {
      setProcessing(false);
      stopScan(); // Ensure scanning is stopped
    }
  };

  const handleSubmit = async (values) => {
    if (!student) {
      message.error('Please scan student ID card first');
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

  const handleStartScan = () => {
    console.log('Starting scan process');
    setStudent(null);
    setScanError(null);
    startScan();
  };

  const resetStudent = () => {
    console.log("Resetting student state");
    setStudent(null);
    setScanError(null);
    form.resetFields();
    stopScan();
  };

  const handleManualInput = (value) => {
    if (value) {
      handleNFCScan(value);
    }
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
                      loading={scanning}
                      disabled={processing}
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
                        onPressEnter={() => handleManualInput(manualNfcId)}
                        disabled={processing}
                      />
                      <Button 
                        type="primary" 
                        onClick={() => handleManualInput(manualNfcId)}
                        loading={processing}
                      >
                        Submit
                      </Button>
                    </Input.Group>
                  </Col>
                </Row>
                
                {scanError && (
                  <Alert 
                    message={scanError} 
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
                  description={`ID: ${student.schoolId || student.id}`}
                  type="success"
                  showIcon
                  icon={<UserOutlined />}
                  action={
                    <Button 
                      danger 
                      icon={<CloseCircleOutlined />} 
                      onClick={resetStudent}
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
            visitDate: null
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
                  <Select.Option value="male">Male</Select.Option>
                  <Select.Option value="female">Female</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
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
            <Input.TextArea rows={4} placeholder="Enter treatment details or prescription" />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Additional Notes"
          >
            <Input.TextArea rows={4} placeholder="Additional notes" />
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