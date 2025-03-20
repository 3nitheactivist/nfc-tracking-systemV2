import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Alert, Space, Result, Typography, Row, Col, Spin, Badge, Select, List, message, Empty } from 'antd';
import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, LogoutOutlined, LoginOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { useNFCScanner } from '../../hooks/useNFCScanner';
import { useHostelAccess } from '../../hooks/useHostelAccess';
import { hostelService } from '../../utils/firebase/hostelService';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';

const { Title, Text } = Typography;
const { Option } = Select;

function HostelAccessScanner() {
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [hostelLoading, setHostelLoading] = useState(true);
  const [scanningLoop, setScanningLoop] = useState(false);
  const [recentEvents, setRecentEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const loopCountRef = useRef(0);
  
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
  
  // Subscribe to recent access events for the selected hostel
  useEffect(() => {
    if (!selectedHostel) return;
    
    setEventsLoading(true);
    console.log(`Subscribing to access events for hostel ID: ${selectedHostel}`);
    
    try {
      const hostelAccessRef = collection(db, 'hostelAccess');
      const hostelAccessQuery = query(
        hostelAccessRef,
        where('hostelId', '==', selectedHostel),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(hostelAccessQuery, (snapshot) => {
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`Received ${events.length} access events for hostel ${selectedHostel}`);
        
        if (events.length > 0) {
          console.log('Sample event:', events[0]);
        }
        
        setRecentEvents(events);
        setEventsLoading(false);
      }, (error) => {
        console.error('Error fetching hostel access events:', error);
        setEventsLoading(false);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error('Error subscribing to hostel access events:', error);
      setEventsLoading(false);
      return () => {};
    }
  }, [selectedHostel]);
  
  // When a new NFC ID is scanned, process it
  useEffect(() => {
    if (lastScannedId && nfcScanStatus === 'success' && selectedHostel) {
      handleNFCScan(lastScannedId, selectedHostel);
      // Reset loop detection
      loopCountRef.current = 0;
      setScanningLoop(false);
    }
  }, [lastScannedId, nfcScanStatus, selectedHostel, handleNFCScan]);
  
  // Detect scanning loops
  useEffect(() => {
    if (scanning) {
      loopCountRef.current += 1;
      
      // If we detect multiple consecutive scans, we're probably in a loop
      if (loopCountRef.current > 3) {
        setScanningLoop(true);
      }
    }
  }, [scanning]);
  
  // Start a new scan process
  const handleStartScan = () => {
    if (!selectedHostel) {
      message.warning('Please select a hostel first');
      return;
    }
    
    resetStudent();
    startScan();
  };
  
  // Handle refresh - completely reset the scanner
  const handleRefresh = () => {
    console.log("Refreshing scanner state");
    
    // Stop any active scans
    stopScan();
    
    // Reset student data
    resetStudent();
    
    // Reset our loop detection
    loopCountRef.current = 0;
    setScanningLoop(false);
    
    // Refresh the events list - Using direct Firestore query
    if (selectedHostel) {
      setEventsLoading(true);
      
      // Direct Firestore query to hostelAccess collection
      const hostelAccessRef = collection(db, 'hostelAccess');
      const hostelAccessQuery = query(
        hostelAccessRef,
        where('hostelId', '==', selectedHostel),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      getDocs(hostelAccessQuery)
        .then((snapshot) => {
          const events = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`Refreshed: Received ${events.length} access events for hostel`);
          setRecentEvents(events);
        })
        .catch((error) => {
          console.error('Error refreshing access events:', error);
        })
        .finally(() => {
          setEventsLoading(false);
        });
    }
    
    message.success("Scanner has been reset");
  };
  
  const handleHostelChange = (value) => {
    setSelectedHostel(value);
    resetStudent();
  };
  
  // Format event timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    // Handle Firestore timestamp objects
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleString();
    }
    
    // Handle Date objects or timestamps
    if (timestamp instanceof Date) {
      return timestamp.toLocaleString();
    }
    
    // Handle timestamp as seconds or milliseconds
    if (typeof timestamp === 'number') {
      return new Date(timestamp * (timestamp < 10000000000 ? 1000 : 1)).toLocaleString();
    }
    
    return 'Unknown time';
  };
  
  return (
    <div className="hostel-access-scanner-container">
      {/* Add the refresh alert when loop is detected */}
      {scanningLoop && (
        <Alert
          message="Scanner issues detected"
          description="The scanner appears to be stuck in a loop. Click the refresh button to reset."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh} 
              type="primary" 
              danger
            >
              Reset Scanner
            </Button>
          }
        />
      )}
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4}>Hostel Access Control</Title>
              </Col>
              <Col>
                <Space>
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
                  
                  {/* Add refresh button in header */}
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    title="Reset scanner if it's not working properly"
                  >
                    Reset
                  </Button>
                </Space>
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
                message="Scan a student's NFC ID card to track hostel access"
                type="info"
                showIcon
              />
              
              <div className="scan-button-container" style={{ textAlign: 'center', margin: '20px 0' }}>
                <Button
                  type="primary"
                  icon={<ScanOutlined />}
                  size="large"
                  onClick={handleStartScan}
                  loading={scanning}
                  disabled={scanning || !selectedHostel} // Only disable if actively scanning or no hostel selected
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
                  extra={[
                    <Button 
                      key="new-scan" 
                      type="primary" 
                      onClick={handleStartScan}
                      disabled={scanning}
                    >
                      New Scan
                    </Button>
                  ]}
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
                  <div style={{ 
                    marginBottom: 16, 
                    display: 'flex', 
                    justifyContent: 'center' 
                  }}>
                    <div style={{ 
                      width: 100, 
                      height: 100, 
                      borderRadius: '50%',
                      overflow: 'hidden',
                      background: '#f0f2f5',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '1px solid #d9d9d9'
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
                  </div>
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
                {eventsLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Spin />
                  </div>
                ) : recentEvents.length > 0 ? (
                  <List
                    size="small"
                    dataSource={recentEvents.slice(0, 5)}
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
                        <Text> - {formatTimestamp(event.timestamp)}</Text>
                        <Text> ({event.studentName || 'Unknown Student'})</Text>
                        <Text type="secondary"> Room: {event.roomNumber || 'N/A'}</Text>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No recent access events found" />
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