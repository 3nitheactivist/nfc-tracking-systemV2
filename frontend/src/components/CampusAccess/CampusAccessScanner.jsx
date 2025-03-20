import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input, Alert, Space, Result, Typography, Row, Col, Spin, Badge, Pagination, Empty, Tag } from 'antd';
import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, LogoutOutlined, LoginOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { useNFCScanner } from '../../hooks/useNFCScanner';
import { useCampusAccess } from '../../hooks/useCampusAccess';

const { Title, Text } = Typography;

function CampusAccessScanner() {
  // Add this state to track if we're in a loop
  const [scanningLoop, setScanningLoop] = useState(false);
  const loopCountRef = useRef(0);
  const [manualNfcId, setManualNfcId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // Show 5 events per page
  
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
    recordExit,
    loading
  } = useCampusAccess();
  
  // When a new NFC ID is scanned, process it
  useEffect(() => {
    if (lastScannedId && nfcScanStatus === 'success') {
      handleNFCScan(lastScannedId);
      // Reset the loop counter when a scan completes successfully
      loopCountRef.current = 0;
      setScanningLoop(false);
    }
  }, [lastScannedId, nfcScanStatus, handleNFCScan]);
  
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
  
  // Reset to first page when student changes
  useEffect(() => {
    setCurrentPage(1);
  }, [student]);
  
  // Start a new scan process
  const handleStartScan = () => {
    resetStudent();
    loopCountRef.current = 0;
    setScanningLoop(false);
    startScan();
  };
  
  // Add a hard refresh function
  const handleHardRefresh = () => {
    console.log("Hard refresh triggered");
    // First stop any active scans
    stopScan();
    
    // Reset student and state
    resetStudent();
    
    // Reset our loop detection
    loopCountRef.current = 0;
    setScanningLoop(false);
    
    // Reset the state of the component
    setManualNfcId('');
    setCurrentPage(1);
  };
  
  // Handle manual NFC ID input
  const handleManualNfcSubmit = async () => {
    if (!manualNfcId.trim()) {
      return;
    }
    
    resetStudent();
    await handleNFCScan(manualNfcId.trim());
    setManualNfcId('');
  };
  
  // Filter events for today only
  const todayEvents = accessEvents.filter(event => {
    if (!event.timestamp) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const eventDate = new Date(event.timestamp);
    eventDate.setHours(0, 0, 0, 0);
    
    return eventDate.getTime() === today.getTime();
  });
  
  // Calculate paginated events
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEvents = accessEvents.slice(startIndex, startIndex + pageSize);
  
  return (
    <div className="campus-access-scanner">
      {/* Add the refresh button at the top when a loop is detected */}
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
              onClick={handleHardRefresh} 
              type="primary" 
              danger
            >
              Reset Scanner
            </Button>
          }
        />
      )}
      
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card 
            title="Campus Access Scanner" 
            className="scanner-card"
            extra={
              <Button
                icon={<ReloadOutlined />}
                onClick={handleHardRefresh}
                type="text"
                title="Reset scanner if it's not working properly"
              />
            }
          >
            {!student ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Space direction="vertical" size="large">
                  <Button 
                    type="primary" 
                    icon={<ScanOutlined />} 
                    onClick={handleStartScan}
                    loading={scanning}
                    size="large"
                    disabled={scanningLoop} // Disable if we're in a loop
                  >
                    {scanning ? 'Scanning...' : 'Scan Student Card'}
                  </Button>
                  
                  <div>
                    <Text>OR</Text>
                  </div>
                  
                  <Input.Group compact>
                    <Input 
                      style={{ width: 'calc(100% - 80px)' }} 
                      placeholder="Enter NFC ID manually"
                      value={manualNfcId}
                      onChange={(e) => setManualNfcId(e.target.value)}
                      onPressEnter={handleManualNfcSubmit}
                    />
                    <Button 
                      type="primary" 
                      onClick={handleManualNfcSubmit}
                      loading={loading}
                    >
                      Go
                    </Button>
                  </Input.Group>
                  
                  {(scanning || studentScanStatus === 'scanning') && (
                    <div>
                      <Spin /> <span>Scanning...</span>
                    </div>
                  )}
                </Space>
              </div>
            ) : (
              <div className="student-result">
                <div className="student-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: 60, 
                    height: 60, 
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
                          e.target.parentNode.innerHTML = '<span class="anticon anticon-user" style="font-size: 30px; color: #1890ff;"></span>';
                        }}
                      />
                    ) : (
                      <UserOutlined style={{ fontSize: 30, color: '#1890ff' }} />
                    )}
                  </div>
                  <div>
                    <h3>{student.name}</h3>
                    <p>ID: {student.id}</p>
                  </div>
                </div>
              <Result
                icon={accessStatus === 'granted' ? 
                  currentAction === 'entry' ? 
                    <LoginOutlined style={{ color: '#52c41a' }} /> : 
                    <LogoutOutlined style={{ color: '#1890ff' }} />
                  : 
                  <CloseCircleOutlined style={{ color: '#f5222d' }} />
                }
                title={
                  accessStatus === 'granted' ? 
                    `${currentAction === 'entry' ? 'Check-In' : 'Check-Out'} Successful` : 
                    'Access Denied'
                }
                subTitle={`Student: ${student.name} (ID: ${student.id})`}
                extra={[
                    <Button key="new" onClick={handleHardRefresh}>
                    New Scan
                  </Button>
                ]}
              />
              </div>
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Recent Access Events</span>
                {student && todayEvents.length > 0 && (
                  <Tag color="blue">{todayEvents.length} events today</Tag>
                )}
              </div>
            } 
            className="events-card"
          >
            {student ? (
              <div>
                <Title level={4}>{student.name}'s Recent Access</Title>
                {accessEvents.length > 0 ? (
                  <>
                    <ul className="event-list">
                      {paginatedEvents.map(event => (
                        <li key={event.id}>
                          <Badge 
                            status={event.eventType === 'entry' ? 'success' : 'processing'} 
                            text={
                              <Text type={event.eventType === 'entry' ? 'success' : 'secondary'}>
                                {event.eventType === 'entry' ? 'Check-In' : 'Check-Out'}
                              </Text>
                            }
                          />
                          <Text> - {event.timestamp?.toLocaleString()}</Text>
                        </li>
                      ))}
                    </ul>
                    
                    {accessEvents.length > pageSize && (
                      <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <Pagination 
                          current={currentPage}
                          onChange={setCurrentPage}
                          total={accessEvents.length}
                          pageSize={pageSize}
                          size="small"
                          showSizeChanger={false}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <Empty description="No recent access events found" />
                )}
              </div>
            ) : (
              <Alert message="Scan a student card to view their recent access events" type="info" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default CampusAccessScanner;