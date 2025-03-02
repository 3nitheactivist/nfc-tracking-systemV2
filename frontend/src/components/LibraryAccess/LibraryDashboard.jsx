import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  List, 
  Avatar, 
  Tag, 
  Button, 
  Spin,
  Alert,
  Space,
  Typography
} from 'antd';
import { 
  BookOutlined, 
  UserOutlined, 
  FieldTimeOutlined, 
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { libraryService } from '../../utils/firebase/libraryService';

const { Title, Text } = Typography;

dayjs.extend(relativeTime);

function LibraryDashboard() {
  const [statistics, setStatistics] = useState({
    currentVisitors: 0,
    totalCheckInsToday: 0,
    booksIssued: 0,
    averageStayTime: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch real statistics from Firebase
      const statsData = await libraryService.getStatistics();
      
      // Fetch recent activity from Firebase
      const recentActivityData = await libraryService.getRecentActivity(5);
      
      // Process the activity data to match our component's expected format
      const processedActivity = recentActivityData.map(item => ({
        id: item.id,
        name: item.studentName || 'Unknown Student',
        action: item.accessType || 'check-in',
        timestamp: item.timestamp ? new Date(item.timestamp.seconds * 1000) : new Date(),
        avatarUrl: item.studentAvatar || ''
      }));
      
      // Generate hourly usage data based on access records
      // This would typically come from aggregated Firebase data
      // For now, we'll use a simplified approach
      const hourlyData = await generateHourlyData();

      setStatistics(statsData);
      setRecentActivity(processedActivity);
      setUsageData(hourlyData);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Generate hourly data based on access records
  const generateHourlyData = async () => {
    try {
      // In a real implementation, you would query Firebase for this data
      // For now, we'll use a simplified approach with the existing data
      const allAccessRecords = await libraryService.getAccessHistory();
      
      // Initialize hourly buckets (8AM to 6PM)
      const hours = ['8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'];
      const hourlyData = hours.map(hour => ({ hour, visitors: 0 }));
      
      // Count visitors per hour
      allAccessRecords.forEach(record => {
        if (record.timestamp && record.accessType === 'check-in') {
          const date = new Date(record.timestamp.seconds * 1000);
          const hour = date.getHours();
          
          // Map 24-hour format to our hourly buckets (8AM to 6PM)
          if (hour >= 8 && hour <= 18) {
            const index = hour - 8; // 8AM is index 0
            if (hourlyData[index]) {
              hourlyData[index].visitors += 1;
            }
          }
        }
      });
      
      return hourlyData;
    } catch (error) {
      console.error('Error generating hourly data:', error);
      // Return default data if there's an error
      return [
        { hour: '8AM', visitors: 0 },
        { hour: '9AM', visitors: 0 },
        { hour: '10AM', visitors: 0 },
        { hour: '11AM', visitors: 0 },
        { hour: '12PM', visitors: 0 },
        { hour: '1PM', visitors: 0 },
        { hour: '2PM', visitors: 0 },
        { hour: '3PM', visitors: 0 },
        { hour: '4PM', visitors: 0 },
        { hour: '5PM', visitors: 0 },
        { hour: '6PM', visitors: 0 },
      ];
    }
  };

  const formatTimestamp = (timestamp) => {
    return dayjs(timestamp).fromNow();
  };

  const maxVisitors = Math.max(...usageData.map(item => item.visitors), 1);

  if (loading && !statistics.currentVisitors) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Alert message={error} type="error" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 , marginLeft: 30 , marginTop: 10 }}>Library Dashboard</Title>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchDashboardData}
          style={{ margin: 0 , marginRight: 30 , marginTop: 10 }}
        >
          Refresh
        </Button>
      </Row>

      <Row gutter={[16, 16]} style={{  justifyContent: 'center' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Current Visitors"
              value={statistics.currentVisitors}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#00923f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Today's Check-ins"
              value={statistics.totalCheckInsToday}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        {/* <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Books Issued Today"
              value={statistics.booksIssued}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col> */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg. Stay Time (min)"
              value={statistics.averageStayTime}
              prefix={<FieldTimeOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Hourly Visitor Activity" style={{ height: '100%' }}>
            <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              {usageData.map((item, index) => (
                <div key={index} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ 
                    height: `${(item.visitors / maxVisitors) * 250}px`, 
                    background: '#1890ff', 
                    margin: '0 4px',
                    borderTopLeftRadius: '3px',
                    borderTopRightRadius: '3px',
                    transition: 'height 0.3s ease'
                  }} />
                  <div style={{ marginTop: '8px' }}>{item.hour}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{item.visitors}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Recent Activity" style={{ height: '100%' }}>
            <List
              itemLayout="horizontal"
              dataSource={recentActivity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar src={item.avatarUrl} icon={<UserOutlined />} />}
                    title={item.name}
                    description={
                      <Space>
                        <Tag color={item.action === 'check-in' ? 'green' : 'check-out' ? 'red' : 'blue'}>
                          {item.action === 'check-in' ? 'Checked In' : item.action === 'check-out' ? 'Checked Out' : item.action}
                        </Tag>
                        <Text type="secondary">{formatTimestamp(item.timestamp)}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Today's Peak Hours" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Morning Peak"
              value={findPeakHour(usageData, 0, 4)}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <Text type="secondary">{findPeakVisitors(usageData, 0, 4)} visitors</Text>
          </Col>
          <Col span={8}>
            <Statistic
              title="Afternoon Peak"
              value={findPeakHour(usageData, 4, 8)}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <Text type="secondary">{findPeakVisitors(usageData, 4, 8)} visitors</Text>
          </Col>
          <Col span={8}>
            <Statistic
              title="Lowest Traffic"
              value={findLowestHour(usageData)}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
            <Text type="secondary">{findLowestVisitors(usageData)} visitors</Text>
          </Col>
        </Row>
      </Card>
    </motion.div>
  );
}

// Helper functions to find peak and lowest hours
function findPeakHour(data, startIndex, endIndex) {
  if (!data || data.length === 0) return 'N/A';
  
  const subset = data.slice(startIndex, endIndex + 1);
  const maxVisitors = Math.max(...subset.map(item => item.visitors));
  const peakItem = subset.find(item => item.visitors === maxVisitors);
  
  return peakItem ? peakItem.hour : 'N/A';
}

function findPeakVisitors(data, startIndex, endIndex) {
  if (!data || data.length === 0) return 0;
  
  const subset = data.slice(startIndex, endIndex + 1);
  return Math.max(...subset.map(item => item.visitors));
}

function findLowestHour(data) {
  if (!data || data.length === 0) return 'N/A';
  
  const minVisitors = Math.min(...data.map(item => item.visitors));
  const lowestItem = data.find(item => item.visitors === minVisitors);
  
  return lowestItem ? lowestItem.hour : 'N/A';
}

function findLowestVisitors(data) {
  if (!data || data.length === 0) return 0;
  
  return Math.min(...data.map(item => item.visitors));
}

export default LibraryDashboard;