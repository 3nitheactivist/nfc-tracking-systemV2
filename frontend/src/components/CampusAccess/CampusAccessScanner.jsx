// // import React, { useState, useEffect } from 'react';
// // import { Card, Button, Input, Alert, Space, Result, Typography, Row, Col, Spin, Badge } from 'antd';
// // import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons';
// // import { useNFCScanner } from '../../hooks/useNFCScanner';
// // import { useCampusAccess } from '../../hooks/useCampusAccess';

// // const { Title, Text } = Typography;

// // function CampusAccessScanner() {
// //   const [manualNfcId, setManualNfcId] = useState('');
  
// //   // NFC scanner integration
// //   const { startScan, stopScan, scanning, lastScannedId, scanStatus: nfcScanStatus } = useNFCScanner();
// //   const { 
// //     handleNFCScan, 
// //     student, 
// //     accessEvents, 
// //     scanStatus: studentScanStatus, 
// //     accessStatus,
// //     currentAction,
// //     resetStudent,
// //     recordExit,
// //     loading
// //   } = useCampusAccess();
  
// //   // When a new NFC ID is scanned, process it
// //   useEffect(() => {
// //     if (lastScannedId && nfcScanStatus === 'success') {
// //       handleNFCScan(lastScannedId);
// //     }
// //   }, [lastScannedId, nfcScanStatus, handleNFCScan]);
  
// //   // Start a new scan process
// //   const handleStartScan = () => {
// //     resetStudent();
// //     startScan();
// //   };
  
// //   // Handle manual NFC ID input
// //   const handleManualNfcSubmit = async () => {
// //     if (!manualNfcId.trim()) {
// //       return;
// //     }
    
// //     resetStudent();
// //     await handleNFCScan(manualNfcId.trim());
// //     setManualNfcId('');
// //   };
  
// //   // Handle student exit
// //   const handleRecordExit = async () => {
// //     await recordExit();
// //     setTimeout(() => {
// //       resetStudent();
// //     }, 3000);
// //   };
  
// //   return (
// //     <div className="campus-access-scanner">
// //       <Row gutter={[16, 16]}>
// //         <Col xs={24} md={12}>
// //           <Card title="Campus Access Scanner" className="scanner-card">
// //             {!student ? (
// //               <div style={{ textAlign: 'center', padding: '20px 0' }}>
// //                 <Space direction="vertical" size="large">
// //                   <Button 
// //                     type="primary" 
// //                     icon={<ScanOutlined />} 
// //                     onClick={handleStartScan}
// //                     loading={scanning}
// //                     size="large"
// //                   >
// //                     {scanning ? 'Scanning...' : 'Scan Student Card'}
// //                   </Button>
                  
// //                   <div>
// //                     <Text>OR</Text>
// //                   </div>
                  
// //                   <Input.Group compact>
// //                     <Input 
// //                       style={{ width: 'calc(100% - 80px)' }} 
// //                       placeholder="Enter NFC ID manually"
// //                       value={manualNfcId}
// //                       onChange={(e) => setManualNfcId(e.target.value)}
// //                       onPressEnter={handleManualNfcSubmit}
// //                     />
// //                     <Button 
// //                       type="primary" 
// //                       onClick={handleManualNfcSubmit}
// //                       loading={loading}
// //                     >
// //                       Go
// //                     </Button>
// //                   </Input.Group>
                  
// //                   {(scanning || studentScanStatus === 'scanning') && (
// //                     <div>
// //                       <Spin /> <span>Scanning...</span>
// //                     </div>
// //                   )}
// //                 </Space>
// //               </div>
// //             ) : (
// //               <Result
// //                 icon={accessStatus === 'granted' ? 
// //                   <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
// //                   <CloseCircleOutlined style={{ color: '#f5222d' }} />
// //                 }
// //                 title={accessStatus === 'granted' ? 'Access Granted' : 'Access Denied'}
// //                 subTitle={`Student: ${student.name} (ID: ${student.id})`}
// //                 extra={[
// //                   accessStatus === 'granted' && (
// //                     <Button 
// //                       key="exit" 
// //                       type="primary" 
// //                       danger
// //                       icon={<LogoutOutlined />}
// //                       onClick={handleRecordExit}
// //                     >
// //                       Record Exit
// //                     </Button>
// //                   ),
// //                   <Button key="new" onClick={resetStudent}>
// //                     New Scan
// //                   </Button>
// //                 ]}
// //               />
// //             )}
// //           </Card>
// //         </Col>
        
// //         <Col xs={24} md={12}>
// //           <Card title="Recent Access Events" className="events-card">
// //             {student ? (
// //               <div>
// //                 <Title level={4}>{student.name}'s Recent Access</Title>
// //                 {accessEvents.length > 0 ? (
// //                   <ul className="event-list">
// //                     {accessEvents.slice(0, 5).map(event => (
// //                       <li key={event.id}>
// //                         <Text type={event.eventType === 'entry' ? 'success' : 'danger'}>
// //                           {event.eventType === 'entry' ? 'Entry' : 'Exit'}
// //                         </Text>
// //                         <Text> - {event.timestamp?.toLocaleString()}</Text>
// //                       </li>
// //                     ))}
// //                   </ul>
// //                 ) : (
// //                   <Alert message="No recent access events found" type="info" />
// //                 )}
// //               </div>
// //             ) : (
// //               <Alert message="Scan a student card to view their recent access events" type="info" />
// //             )}
// //           </Card>
// //         </Col>
// //       </Row>
// //     </div>
// //   );
// // }

// // export default CampusAccessScanner;

// import React, { useState, useEffect } from 'react';
// import { Card, Button, Input, Alert, Space, Result, Typography, Row, Col, Spin, Badge } from 'antd';
// import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons';
// import { useNFCScanner } from '../../hooks/useNFCScanner';
// import { useCampusAccess } from '../../hooks/useCampusAccess';

// const { Title, Text } = Typography;

// function CampusAccessScanner() {
//   const [manualNfcId, setManualNfcId] = useState('');
  
//   // NFC scanner integration
//   const { startScan, stopScan, scanning, lastScannedId, scanStatus: nfcScanStatus } = useNFCScanner();
//   const { 
//     handleNFCScan, 
//     student, 
//     accessEvents, 
//     scanStatus: studentScanStatus, 
//     accessStatus,
//     currentAction,
//     resetStudent,
//     recordExit,
//     loading
//   } = useCampusAccess();
  
//   // When a new NFC ID is scanned, process it
//   useEffect(() => {
//     if (lastScannedId && nfcScanStatus === 'success') {
//       handleNFCScan(lastScannedId);
//     }
//   }, [lastScannedId, nfcScanStatus, handleNFCScan]);
  
//   // Start a new scan process
//   const handleStartScan = () => {
//     resetStudent();
//     startScan();
//   };
  
//   // Handle manual NFC ID input
//   const handleManualNfcSubmit = async () => {
//     if (!manualNfcId.trim()) {
//       return;
//     }
    
//     resetStudent();
//     await handleNFCScan(manualNfcId.trim());
//     setManualNfcId('');
//   };
  
//   // Handle student exit
//   const handleRecordExit = async () => {
//     await recordExit();
//     setTimeout(() => {
//       resetStudent();
//     }, 3000);
//   };
  
//   return (
//     <div className="campus-access-scanner">
//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={12}>
//           <Card title="Campus Access Scanner" className="scanner-card">
//             {!student ? (
//               <div style={{ textAlign: 'center', padding: '20px 0' }}>
//                 <Space direction="vertical" size="large">
//                   <Button 
//                     type="primary" 
//                     icon={<ScanOutlined />} 
//                     onClick={handleStartScan}
//                     loading={scanning}
//                     size="large"
//                   >
//                     {scanning ? 'Scanning...' : 'Scan Student Card'}
//                   </Button>
                  
//                   <div>
//                     <Text>OR</Text>
//                   </div>
                  
//                   <Input.Group compact>
//                     <Input 
//                       style={{ width: 'calc(100% - 80px)' }} 
//                       placeholder="Enter NFC ID manually"
//                       value={manualNfcId}
//                       onChange={(e) => setManualNfcId(e.target.value)}
//                       onPressEnter={handleManualNfcSubmit}
//                     />
//                     <Button 
//                       type="primary" 
//                       onClick={handleManualNfcSubmit}
//                       loading={loading}
//                     >
//                       Go
//                     </Button>
//                   </Input.Group>
                  
//                   {(scanning || studentScanStatus === 'scanning') && (
//                     <div>
//                       <Spin /> <span>Scanning...</span>
//                     </div>
//                   )}
//                 </Space>
//               </div>
//             ) : (
//               <Result
//                 icon={accessStatus === 'granted' ? 
//                   currentAction === 'entry' ? 
//                     <LoginOutlined style={{ color: '#52c41a' }} /> : 
//                     <LogoutOutlined style={{ color: '#1890ff' }} />
//                   : 
//                   <CloseCircleOutlined style={{ color: '#f5222d' }} />
//                 }
//                 title={
//                   accessStatus === 'granted' ? 
//                     `${currentAction === 'entry' ? 'Check-In' : 'Check-Out'} Successful` : 
//                     'Access Denied'
//                 }
//                 subTitle={`Student: ${student.name} (ID: ${student.id})`}
//                 extra={[
//                   <Button key="new" onClick={resetStudent}>
//                     New Scan
//                   </Button>
//                 ]}
//               />
//             )}
//           </Card>
//         </Col>
        
//         <Col xs={24} md={12}>
//           <Card title="Recent Access Events" className="events-card">
//             {student ? (
//               <div>
//                 <Title level={4}>{student.name}'s Recent Access</Title>
//                 {accessEvents.length > 0 ? (
//                   <ul className="event-list">
//                     {accessEvents.slice(0, 5).map(event => (
//                       <li key={event.id}>
//                         <Badge 
//                           status={event.eventType === 'entry' ? 'success' : 'processing'} 
//                           text={
//                             <Text type={event.eventType === 'entry' ? 'success' : 'secondary'}>
//                               {event.eventType === 'entry' ? 'Check-In' : 'Check-Out'}
//                             </Text>
//                           }
//                         />
//                         <Text> - {event.timestamp?.toLocaleString()}</Text>
//                       </li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <Alert message="No recent access events found" type="info" />
//                 )}
//               </div>
//             ) : (
//               <Alert message="Scan a student card to view their recent access events" type="info" />
//             )}
//           </Card>
//         </Col>
//       </Row>
//     </div>
//   );
// }

// export default CampusAccessScanner;
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Alert, Space, Result, Typography, Row, Col, Spin, Badge, Pagination, Empty, Tag } from 'antd';
import { ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, LogoutOutlined, LoginOutlined } from '@ant-design/icons';
import { useNFCScanner } from '../../hooks/useNFCScanner';
import { useCampusAccess } from '../../hooks/useCampusAccess';

const { Title, Text } = Typography;

function CampusAccessScanner() {
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
    }
  }, [lastScannedId, nfcScanStatus, handleNFCScan]);
  
  // Reset to first page when student changes
  useEffect(() => {
    setCurrentPage(1);
  }, [student]);
  
  // Start a new scan process
  const handleStartScan = () => {
    resetStudent();
    startScan();
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
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Campus Access Scanner" className="scanner-card">
            {!student ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Space direction="vertical" size="large">
                  <Button 
                    type="primary" 
                    icon={<ScanOutlined />} 
                    onClick={handleStartScan}
                    loading={scanning}
                    size="large"
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
                  <Button key="new" onClick={resetStudent}>
                    New Scan
                  </Button>
                ]}
              />
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