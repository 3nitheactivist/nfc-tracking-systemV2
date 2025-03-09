import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Alert, Space, Result, Typography, Row, Col, Spin, Badge, Select, List, message } from 'antd';
import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons';
import { useNFCScanner } from '../../hooks/useNFCScanner';
import { useHostelAccess } from '../../hooks/useHostelAccess';
import { hostelService } from '../../utils/firebase/hostelService';

const { Title, Text } = Typography;
const { Option } = Select;

function HostelAccessScanner() {
  const [manualNfcId, setManualNfcId] = useState('');
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [hostelLoading, setHostelLoading] = useState(true);
  
  // NFC scanner integration
  const { startScan, stopScan, scanning, lastScannedId, scanStatus: nfcScanStatus } = useNFCScanner();
  const { 
    handleNFCScan, 
    student, 
    accessEvents, 
    scanStatus: studentScanStatus, 
    accessStatus,
    currentAction,
    resetStudent,
    loading
  } = useHostelAccess();
  
  useEffect(() => {
    // Load hostels
    const loadHostels = async () => {
      try {
        setHostelLoading(true);
        const hostelsData = await hostelService.getHostels();
        setHostels(hostelsData);
        
        // Set first hostel as selected if available
        if (hostelsData.length > 0 && !selectedHostel) {
          setSelectedHostel(hostelsData[0].id);
        }
        
        setHostelLoading(false);
      } catch (error) {
        console.error('Error loading hostels:', error);
        setHostelLoading(false);
      }
    };
    
    loadHostels();
  }, []);
  
  // When a new NFC ID is scanned, process it
  useEffect(() => {
    if (lastScannedId && nfcScanStatus === 'success' && selectedHostel) {
      handleNFCScan(lastScannedId, selectedHostel);
    }
  }, [lastScannedId, nfcScanStatus, selectedHostel, handleNFCScan]);
  
  // Start a new scan process
  const handleStartScan = () => {
    if (!selectedHostel) {
      message.warning('Please select a hostel first');
      return;
    }
    
    resetStudent();
    startScan();
  };
  
  // Handle manual NFC ID input
  const handleManualNfcSubmit = async () => {
    if (!manualNfcId.trim()) {
      return;
    }
    
    if (!selectedHostel) {
      message.warning('Please select a hostel first');
      return;
    }
    
    resetStudent();
    await handleNFCScan(manualNfcId.trim(), selectedHostel);
    setManualNfcId('');
  };
  
  const handleHostelChange = (value) => {
    setSelectedHostel(value);
    resetStudent();
  };
  
  return (
    <div className="hostel-access-scanner-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4}>Hostel Access Control</Title>
              </Col>
              <Col>
                <Select
                  placeholder="Select Hostel"
                  style={{ width: 200 }}
                  value={selectedHostel}
                  onChange={handleHostelChange}
                  loading={hostelLoading}
                >
                  {hostels.map(hostel => (
                    <Option key={hostel.id} value={hostel.id}>{hostel.name}</Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Scan Student ID Card" className="scanner-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="Scan a student's NFC ID card or enter the ID manually"
                type="info"
                showIcon
              />
              
              <div className="manual-input">
                <Input.Search
                  placeholder="Enter NFC ID manually"
                  value={manualNfcId}
                  onChange={(e) => setManualNfcId(e.target.value)}
                  onSearch={handleManualNfcSubmit}
                  enterButton="Submit"
                  loading={loading}
                />
              </div>
              
              <div className="scan-button-container" style={{ textAlign: 'center', margin: '20px 0' }}>
                <Button
                  type="primary"
                  icon={<ScanOutlined />}
                  size="large"
                  onClick={handleStartScan}
                  loading={scanning}
                  disabled={!selectedHostel}
                >
                  {scanning ? 'Scanning...' : 'Scan NFC Card'}
                </Button>
              </div>
              
              {studentScanStatus === 'scanning' && (
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                  <Spin size="large" />
                  <div style={{ marginTop: 16 }}>Processing...</div>
                </div>
              )}
              
              {accessStatus && (
                <Result
                  status={accessStatus === 'granted' ? 'success' : 'error'}
                  title={accessStatus === 'granted' ? 'Access Granted' : 'Access Denied'}
                  subTitle={
                    accessStatus === 'granted'
                      ? `${student?.name} has been ${currentAction === 'entry' ? 'checked in' : 'checked out'}`
                      : 'Student does not have permission to access this hostel'
                  }
                  icon={
                    accessStatus === 'granted' 
                      ? (currentAction === 'entry' ? <LoginOutlined /> : <LogoutOutlined />)
                      : <CloseCircleOutlined />
                  }
                />
              )}
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            title="Student Information" 
            className="student-info-card"
          >
            {student ? (
              <div>
                <div className="student-details">
                  <Title level={4}>{student.name}</Title>
                  <Text>Student ID: {student.schoolId || student.studentId || 'N/A'}</Text>
                  <div style={{ margin: '16px 0' }}>
                    {student.hostelAssignment ? (
                      <div>
                        <Badge status="success" text="Assigned to Hostel" />
                        <div style={{ marginTop: 8 }}>
                          <Text strong>Room: </Text>
                          <Text>{student.hostelAssignment.roomNumber}</Text>
                        </div>
                      </div>
                    ) : (
                      <Badge status="error" text="Not Assigned to Any Hostel" />
                    )}
                  </div>
                </div>
                
                <Title level={5} style={{ marginTop: 16 }}>Recent Access History</Title>
                {accessEvents.length > 0 ? (
                  <List
                    size="small"
                    dataSource={accessEvents.slice(0, 5)}
                    renderItem={event => (
                      <List.Item>
                        <Badge 
                          status={event.eventType === 'entry' ? 'success' : 'processing'} 
                          text={
                            <Text type={event.eventType === 'entry' ? 'success' : 'secondary'}>
                              {event.eventType === 'entry' ? 'Check-In' : 'Check-Out'}
                            </Text>
                          }
                        />
                        <Text> - {event.timestamp?.toLocaleString()}</Text>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Alert message="No recent access events found" type="info" />
                )}
              </div>
            ) : (
              <Alert message="Scan a student card to view their information" type="info" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default HostelAccessScanner;