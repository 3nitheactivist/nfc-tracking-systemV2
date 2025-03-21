import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Input, 
  Button, 
  DatePicker, 
  Space, 
  Card, 
  Select,
  Tag,
  Typography,
  Tooltip,
  Spin,
  Alert,
  Modal,
  Avatar
} from 'antd';
import { 
  SearchOutlined, 
  DownloadOutlined, 
  ReloadOutlined,
  InfoCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { libraryService } from '../../utils/firebase/libraryService';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';
import { message } from 'antd';
import { getFirestore } from 'firebase/firestore';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Extend dayjs with the relativeTime plugin
dayjs.extend(relativeTime);

function LibraryHistory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState([]);
  const [accessType, setAccessType] = useState('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0
    }
  });

  useEffect(() => {
    const fetchLibraryAccessRecords = async () => {
      setLoading(true);
      try {
        console.log("Fetching library access records");
        
        // Create the query - use the correct collection name
        const accessQuery = query(
          collection(db, 'LibraryAccessRecords'), // FIXED COLLECTION NAME
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(accessQuery);
        console.log(`Found ${querySnapshot.size} library access records`);
        
        const records = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const record = {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
          };
          records.push(record);
        });
        
        const enrichedRecords = await enrichWithStudentData(records);
        setData(enrichedRecords);
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: enrichedRecords.length
          }
        });
      } catch (error) {
        console.error('Error fetching library access records:', error);
        message.error('Failed to fetch library access records');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLibraryAccessRecords();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleAccessTypeChange = (value) => {
    setAccessType(value);
  };

  const handleTableChange = (pagination) => {
    setTableParams({
      pagination
    });
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const handleExport = () => {
    // Implement CSV export functionality
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `library_access_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const convertToCSV = (data) => {
    const headers = ['Student ID', 'Student Name', 'Access Type', 'Timestamp', 'Location', 'Duration', 'Study Purpose'];
    const rows = data.map(item => [
      item.studentId,
      item.studentName,
      item.accessType,
      formatTimestamp(item.timestamp, true),
      item.location,
      item.duration ? formatDuration(item.duration) : '',
      item.studyPurpose || ''
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  };

  const formatTimestamp = (timestamp, fullFormat = false) => {
    if (fullFormat) {
      return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
    }
    return dayjs(timestamp).format('MMM D, YYYY h:mm A');
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Filter data based on search, date range, and access type
  const filteredData = data.filter(item => {
    // Filter by search text
    const searchMatch = 
      item.studentId.toLowerCase().includes(searchText.toLowerCase()) ||
      item.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchText.toLowerCase()));
    
    // Filter by date range
    let dateMatch = true;
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      const itemDate = dayjs(item.timestamp);
      dateMatch = itemDate.isAfter(dateRange[0]) && itemDate.isBefore(dateRange[1]);
    }
    
    // Filter by access type
    let typeMatch = true;
    if (accessType !== 'all') {
      typeMatch = item.accessType === accessType;
    }
    
    return searchMatch && dateMatch && typeMatch;
  });

  const enrichWithStudentData = async (records) => {
    if (!records.length) return records;
    
    const studentIds = records.map(record => record.studentId).filter(Boolean);
    if (!studentIds.length) return records;
    
    try {
      const db = getFirestore();
      const studentsRef = collection(db, "students");
      const uniqueIds = [...new Set(studentIds)];
      
      const studentSnapshots = await Promise.all(
        uniqueIds.map(async (studentId) => {
          const studentQuery = query(studentsRef, where("__name__", "==", studentId));
          const snapshot = await getDocs(studentQuery);
          return snapshot.empty ? null : { id: studentId, ...snapshot.docs[0].data() };
        })
      );
      
      const studentDataMap = studentSnapshots.reduce((map, student) => {
        if (student) map[student.id] = student;
        return map;
      }, {});
      
      return records.map(record => ({
        ...record,
        profileImage: studentDataMap[record.studentId]?.profileImage || null
      }));
    } catch (error) {
      console.error("Error fetching student data:", error);
      return records;
    }
  };

  const columns = [
    {
      title: "Photo",
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
        <Space>
          <span>{text}</span>
          <Text type="secondary" style={{ fontSize: '12px' }}>({record.studentId})</Text>
        </Space>
      ),
    },
    {
      title: 'Access Type',
      dataIndex: 'accessType',
      key: 'accessType',
      render: (text) => (
        <Tag color={text === 'check-in' ? 'green' : text === 'check-out' ? 'red' : 'blue'}>
          {text === 'check-in' ? 'Check In' : text === 'check-out' ? 'Check Out' : text}
        </Tag>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (text) => formatTimestamp(text),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<InfoCircleOutlined />} 
          onClick={() => handleViewDetails(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Card>
          <Space style={{ marginBottom: 16 }}>
            <Input
              placeholder="Search by student or location"
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <RangePicker onChange={handleDateRangeChange} />
            <Select
              defaultValue="all"
              style={{ width: 120 }}
              onChange={handleAccessTypeChange}
            >
              <Option value="all">All Types</Option>
              <Option value="check-in">Check In</Option>
              <Option value="check-out">Check Out</Option>
            </Select>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                // Implement refresh functionality
              }}
            >
              Refresh
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            loading={loading}
            pagination={tableParams.pagination}
            onChange={handleTableChange}
            size="middle"
          />
        </Card>

        <Modal
          title="Access Record Details"
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              Close
            </Button>
          ]}
        >
          {selectedRecord && (
            <div>
              <p><strong>Student:</strong> {selectedRecord.studentName} ({selectedRecord.studentId})</p>
              <p><strong>Access Type:</strong> {selectedRecord.accessType === 'check-in' ? 'Check In' : 'Check Out'}</p>
              <p><strong>Timestamp:</strong> {formatTimestamp(selectedRecord.timestamp)}</p>
              <p><strong>Location:</strong> {selectedRecord.location}</p>
              {selectedRecord.accessType === 'check-out' && selectedRecord.duration && (
                <p><strong>Duration:</strong> {formatDuration(selectedRecord.duration)}</p>
              )}
              {selectedRecord.studyPurpose && (
                <p><strong>Study Purpose:</strong> {selectedRecord.studyPurpose}</p>
              )}
            </div>
          )}
        </Modal>
      </Space>
    </motion.div>
  );
}

export default LibraryHistory;