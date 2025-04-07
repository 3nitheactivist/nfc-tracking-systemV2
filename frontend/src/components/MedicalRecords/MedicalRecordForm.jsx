import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, Select, message, Row, Col, Card, Alert } from 'antd';
import { ScanOutlined, UserOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNFCScanner } from '../../hooks/useNFCScanner';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

function MedicalRecordForm() {
  const [form] = Form.useForm();
  const [manualNfcId, setManualNfcId] = useState('');
  const [processing, setProcessing] = useState(false);
  
  const {
    scanning,
    startScan,
    stopScan,
    lastScannedId,
    scanStatus
  } = useNFCScanner();
  
  const {
    student,
    loading,
    scanStatus: medicalScanStatus,
    handleNFCScan,
    resetStudent,
    addMedicalRecord
  } = useMedicalRecords();
  
  const [scanError, setScanError] = useState(null);
  
  useEffect(() => {
    if (lastScannedId) {
      handleNFCScan(lastScannedId);
    }
  }, [lastScannedId, handleNFCScan]);
  
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
      message.error('Please scan student ID card first');
      return;
    }
    
    try {
      await addMedicalRecord({
        ...values,
        visitDate: values.visitDate.toDate(),
        patientName: student.name,
        patientId: student.id,
        patientGender: student.gender || 'male',
      });
      message.success('Medical record added successfully');
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
    }
  };

  const handleStartScan = () => {
    setScanError(null);
    startScan();
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
        <div className="student-info-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ 
              width: 80, 
              height: 80, 
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
                    e.target.parentNode.innerHTML = '<span class="anticon anticon-user" style="font-size: 40px; color: #1890ff;"></span>';
                  }}
                />
              ) : (
                <UserOutlined style={{ fontSize: 40, color: '#1890ff' }} />
              )}
            </div>
            <div>
              <h2>{student.name}</h2>
              <p>ID: {student.schoolId}</p>
            </div>
          </div>
          
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ 
              patientGender: 'male',
              visitDate: dayjs()
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
        </div>
      )}
    </div>
  );
}

export default MedicalRecordForm;