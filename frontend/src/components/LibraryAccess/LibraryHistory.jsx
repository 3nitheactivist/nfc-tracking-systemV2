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
    fetchAccessHistory();
  }, []);

  const fetchAccessHistory = async () => {
    setLoading(true);
    try {
      const history = await libraryService.getAccessHistory();
      
      // Process the data to match our component's expected format
      const processedData = history.map(record => ({
        id: record.id,
        studentId: record.studentId || 'Unknown',
        studentName: record.studentName || 'Unknown Student',
        accessType: record.accessType || 'check-in',
        timestamp: record.timestamp ? new Date(record.timestamp.seconds * 1000) : new Date(),
        location: record.location || 'Main Library',
        duration: record.duration || null,
        studyPurpose: record.studyPurpose || null
      }));
      
      setData(processedData);
      setTableParams({
        ...tableParams,
        pagination: {
          ...tableParams.pagination,
          total: processedData.length
        }
      });
    } catch (error) {
      console.error('Error fetching access history:', error);
    } finally {
      setLoading(false);
    }
  };

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
    const csvContent = convertToCSV(filteredData);
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

  const columns = [
    {
      title: 'Student',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
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
              onClick={fetchAccessHistory}
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