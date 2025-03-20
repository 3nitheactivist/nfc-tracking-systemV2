import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Tag, DatePicker, Row, Col, Popconfirm, message, Pagination } from 'antd';
import { SearchOutlined, ScanOutlined, ExportOutlined, FilterOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { useNFCScanner } from '../../hooks/useNFCScanner';
import { useCampusAccess } from '../../hooks/useCampusAccess';
import { campusAccessService } from '../../utils/firebase/campusAccessService';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const { RangePicker } = DatePicker;

function AccessHistory() {
  const [accessEvents, setAccessEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [manualNfcId, setManualNfcId] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [studentFilter, setStudentFilter] = useState(null);
  
  // NFC scanner integration
  const { startScan, stopScan, scanning, lastScannedId, scanStatus: nfcScanStatus } = useNFCScanner();
  const { handleNFCScan, student, scanStatus: studentScanStatus, resetStudent } = useCampusAccess();
  
  useEffect(() => {
    // Set up real-time listener for access events
    const unsubscribe = subscribeToEvents();
    
    // Clean up the listener when component unmounts
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [studentFilter]);
  
  useEffect(() => {
    if (lastScannedId && nfcScanStatus === 'success') {
      handleStudentScan(lastScannedId);
    }
  }, [lastScannedId, nfcScanStatus]);
  
  const enrichWithStudentData = async (records) => {
    if (!records.length) return records;
    
    const studentIds = records.map(record => record.studentId).filter(Boolean);
    if (!studentIds.length) return records;
    
    try {
      const db = getFirestore();
      const studentsRef = collection(db, "students");
      
      // Get unique student IDs to avoid duplicate queries
      const uniqueIds = [...new Set(studentIds)];
      
      const studentSnapshots = await Promise.all(
        uniqueIds.map(async (studentId) => {
          if (!studentId) return null;
          const studentQuery = query(studentsRef, where("__name__", "==", studentId));
          const snapshot = await getDocs(studentQuery);
          return snapshot.empty ? null : { id: studentId, ...snapshot.docs[0].data() };
        })
      );
      
      const studentDataMap = studentSnapshots.reduce((map, student) => {
        if (student) map[student.id] = student;
        return map;
      }, {});
      
      return records.map(record => {
        const studentData = studentDataMap[record.studentId] || {};
        return {
          ...record,
          profileImage: studentData.profileImage || null
        };
      });
    } catch (error) {
      console.error("Error fetching student data:", error);
      return records;
    }
  };
  
  const subscribeToEvents = () => {
    setLoading(true);
    
    // If we have a student filter, subscribe to that student's events
    if (studentFilter) {
      return campusAccessService.subscribeToStudentAccessEvents(studentFilter, async (studentEvents) => {
        const enrichedEvents = await enrichWithStudentData(studentEvents);
        setAccessEvents(enrichedEvents);
        setLoading(false);
      });
    } 
    // Otherwise, subscribe to all events with a reasonable limit
    else {
      // Use a limit of 100 events to prevent performance issues
      return campusAccessService.subscribeToLimitedAccessEvents(100, async (allEvents) => {
        const enrichedEvents = await enrichWithStudentData(allEvents);
        setAccessEvents(enrichedEvents);
        setLoading(false);
      });
    }
  };
  
  const handleStudentScan = async (nfcId) => {
    const success = await handleNFCScan(nfcId);
    if (success && student) {
      setStudentFilter(student.id);
    }
  };
  
  const clearStudentFilter = () => {
    setStudentFilter(null);
    resetStudent();
  };
  
  const handleManualNfcSubmit = async () => {
    if (!manualNfcId.trim()) {
      return;
    }
    
    await handleStudentScan(manualNfcId.trim());
    setManualNfcId('');
  };
  
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };
  
  const handleDeleteEvent = async (eventId) => {
    try {
      await campusAccessService.deleteAccessEvent(eventId);
      message.success('Access event deleted successfully');
    } catch (error) {
      console.error('Error deleting access event:', error);
      message.error('Failed to delete access event');
    }
  };
  
  const exportToCsv = () => {
    if (accessEvents.length === 0) {
      message.info('No data to export');
      return;
    }
    
    // Filter events based on current filters
    const eventsToExport = filteredEvents;
    
    // Create CSV content
    const headers = ['Student ID', 'Student Name', 'Event Type', 'Access Type', 'Timestamp', 'Reason'];
    const csvContent = [
      headers.join(','),
      ...eventsToExport.map(event => [
        event.studentId || 'N/A',
        event.studentName || 'Unknown',
        event.eventType || 'N/A',
        event.accessType || 'N/A',
        event.timestamp ? event.timestamp.toLocaleString() : 'N/A',
        event.reason || ''
      ].join(','))
    ].join('\n');
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `campus_access_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Filter events based on search text and date range
  const filteredEvents = accessEvents.filter(event => {
    // Apply search filter
    const searchLower = searchText.toLowerCase();
    const matchesSearch = 
      !searchText || 
      (event.studentName && event.studentName.toLowerCase().includes(searchLower)) ||
      (event.studentId && event.studentId.toLowerCase().includes(searchLower));
    
    // Apply date range filter
    let matchesDateRange = true;
    if (dateRange && dateRange[0] && dateRange[1] && event.timestamp) {
      const eventDate = new Date(event.timestamp);
      const startDate = new Date(dateRange[0]);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateRange[1]);
      endDate.setHours(23, 59, 59, 999);
      
      matchesDateRange = eventDate >= startDate && eventDate <= endDate;
    }
    
    return matchesSearch && matchesDateRange;
  });
  
  const columns = [
    {
      title: "Photo",
      dataIndex: "profileImage",
      key: "photo",
      width: 60,
      render: (_, record) => (
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#f0f2f5',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {record.profileImage?.data ? (
            <img 
              src={record.profileImage.data}
              alt={record.studentName || record.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<span class="anticon anticon-user" style="font-size: 20px; color: #1890ff;"></span>';
              }}
            />
          ) : (
            <UserOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          )}
        </div>
      )
    },
    {
      title: 'Student',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (text, record) => (
        <span>
          {text || 'Unknown'} 
          {record.studentId && <div style={{ fontSize: '12px', color: '#888' }}>ID: {record.studentId}</div>}
        </span>
      ),
      sorter: (a, b) => (a.studentName || '').localeCompare(b.studentName || '')
    },
    {
      title: 'Event Type',
      dataIndex: 'eventType',
      key: 'eventType',
      render: (text) => (
        <Tag color={text === 'entry' ? 'green' : 'blue'}>
          {text === 'entry' ? 'Check-In' : 'Check-Out'}
        </Tag>
      ),
      filters: [
        { text: 'Check-In', value: 'entry' },
        { text: 'Check-Out', value: 'exit' }
      ],
      onFilter: (value, record) => record.eventType === value
    },
    {
      title: 'Access',
      dataIndex: 'accessType',
      key: 'accessType',
      render: (text) => (
        <Tag color={text === 'granted' ? 'green' : 'red'}>
          {text === 'granted' ? 'Granted' : 'Denied'}
        </Tag>
      ),
      filters: [
        { text: 'Granted', value: 'granted' },
        { text: 'Denied', value: 'denied' }
      ],
      onFilter: (value, record) => record.accessType === value
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => timestamp ? timestamp.toLocaleString() : 'N/A',
      sorter: (a, b) => {
        if (!a.timestamp) return -1;
        if (!b.timestamp) return 1;
        return a.timestamp - b.timestamp;
      },
      defaultSortOrder: null // This prevents default descending sort
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Delete this access record?"
          description="This action cannot be undone."
          onConfirm={() => handleDeleteEvent(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
          />
        </Popconfirm>
      )
    }
  ];
  
  return (
    <div className="access-history-container">
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} lg={8}>
          <Input
            placeholder="Search by student name or ID"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Col>
        
        <Col xs={24} lg={8}>
          <RangePicker 
            onChange={handleDateRangeChange}
            style={{ width: '100%' }}
          />
        </Col>
        
        <Col xs={24} lg={8}>
          <Space>
            {/* <Input.Group compact>
              <Input 
                style={{ width: 180 }} 
                placeholder="Enter NFC ID"
                value={manualNfcId}
                onChange={(e) => setManualNfcId(e.target.value)}
                onPressEnter={handleManualNfcSubmit}
              />
              <Button 
                type="primary" 
                onClick={handleManualNfcSubmit}
                loading={studentScanStatus === 'scanning'}
              >
                Go
              </Button>
            </Input.Group> */}
            
            <Button 
              icon={<ScanOutlined />}
              onClick={scanning ? stopScan : startScan}
              loading={scanning}
            >
              Scan
            </Button>
            
            <Button 
              icon={<ExportOutlined />}
              onClick={exportToCsv}
            >
              Export
            </Button>
          </Space>
        </Col>
        
        {studentFilter && (
          <Col xs={24}>
            <Tag color="blue" closable onClose={clearStudentFilter}>
              Filtered by Student: {student?.name}
            </Tag>
          </Col>
        )}
      </Row>
      
      <Table
        columns={columns}
        dataSource={filteredEvents}
        rowKey="id"
        loading={loading}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total) => `Total ${total} records`
        }}
      />
    </div>
  );
}

export default AccessHistory;