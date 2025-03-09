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
import { db } from '../../utils/firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';

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

  // Set up real-time listeners
  useEffect(() => {
    setLoading(true);
    console.log('Setting up dashboard listeners');
    
    // Get current date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // MODIFIED: Query for current visitors (looking for check-ins without matching check-outs)
    const activeVisitorsQuery = query(
      collection(db, 'LibraryAccessRecords'),
      where('accessType', '==', 'check-in')
    );
    
    const activeVisitorsUnsubscribe = onSnapshot(
      activeVisitorsQuery,
      (snapshot) => {
        // Since we don't have a status field, we need to count check-ins
        // that don't have a corresponding check-out
        const checkIns = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          studentId: doc.data().studentId
        }));

        // We'll consider a student as "currently visiting" if they have a check-in
        // but no recent check-out with the same student ID
        const activeVisitorIds = new Set();
        checkIns.forEach(record => {
          activeVisitorIds.add(record.studentId);
        });

        console.log('Potential active visitors:', activeVisitorIds.size);
        
        // Query for check-outs to filter out completed visits
        const checkOutsQuery = query(
          collection(db, 'LibraryAccessRecords'),
          where('accessType', '==', 'check-out')
        );
        
        onSnapshot(checkOutsQuery, (checkOutSnapshot) => {
          const checkOuts = checkOutSnapshot.docs.map(doc => ({
            ...doc.data(),
            studentId: doc.data().studentId
          }));
          
          checkOuts.forEach(record => {
            const timestamp = record.timestamp?.toDate?.() || new Date(record.timestamp);
            const isToday = timestamp >= today;
            
            // If there's a check-out for today, remove the student from active visitors
            if (isToday) {
              activeVisitorIds.delete(record.studentId);
            }
          });
          
          console.log('Final active visitors:', activeVisitorIds.size);
          setStatistics(prev => ({
            ...prev,
            currentVisitors: activeVisitorIds.size
          }));
        });
      },
      (error) => {
        console.error('Error getting active visitors:', error);
      }
    );
    
    // MODIFIED: Query for today's check-ins
    const todayCheckInsQuery = query(
      collection(db, 'LibraryAccessRecords'),
      where('timestamp', '>=', Timestamp.fromDate(today)),
      where('accessType', '==', 'check-in')
    );
    
    const todayCheckInsUnsubscribe = onSnapshot(
      todayCheckInsQuery,
      (snapshot) => {
        console.log('Today\'s check-ins snapshot size:', snapshot.size);
        setStatistics(prev => ({
          ...prev,
          totalCheckInsToday: snapshot.size
        }));
      },
      (error) => {
        console.error('Error getting today\'s check-ins:', error);
      }
    );
    
    // MODIFIED: Calculate average stay time from check-out records with duration
    const avgStayTimeQuery = query(
      collection(db, 'LibraryAccessRecords'),
      where('accessType', '==', 'check-out'),
      where('duration', '>', 0)
    );
    
    const avgStayTimeUnsubscribe = onSnapshot(
      avgStayTimeQuery,
      (snapshot) => {
        console.log('Records with duration snapshot size:', snapshot.size);
        let totalDuration = 0;
        let count = 0;
        
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.duration && typeof data.duration === 'number') {
            totalDuration += data.duration;
            count++;
          }
        });
        
        const averageStayTime = count > 0 ? Math.round(totalDuration / count) : 0;
        console.log(`Average stay time: ${averageStayTime} minutes (from ${count} records)`);
        
        setStatistics(prev => ({
          ...prev,
          averageStayTime
        }));
      },
      (error) => {
        console.error('Error getting average stay time:', error);
      }
    );
    
    // Set up listener for recent activity
    const recentActivityQuery = query(
      collection(db, 'LibraryAccessRecords'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    
    const recentActivityUnsubscribe = onSnapshot(
      recentActivityQuery,
      (snapshot) => {
        console.log('Recent activity snapshot size:', snapshot.size);
        
        const activities = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Processing activity record:', doc.id, data);
          
          let timestamp;
          
          // Handle different timestamp formats
          if (data.timestamp) {
            if (typeof data.timestamp.toDate === 'function') {
              timestamp = data.timestamp.toDate();
            } else if (data.timestamp.seconds) {
              timestamp = new Date(data.timestamp.seconds * 1000);
            } else {
              timestamp = new Date(data.timestamp);
            }
          } else {
            timestamp = new Date();
          }
          
          return {
            id: doc.id,
            name: data.studentName || 'Unknown Student',
            action: data.accessType || 'check-in',
            timestamp,
            studentId: data.studentId
          };
        });
        
        console.log('Processed activities:', activities);
        setRecentActivity(activities.slice(0, 5)); // Take only the 5 most recent
        setLoading(false);
      },
      (error) => {
        console.error('Error getting recent activity:', error);
        setLoading(false);
      }
    );
    
    // Set up listener for hourly data
    generateHourlyData();
    
    // Cleanup listeners on component unmount
    return () => {
      activeVisitorsUnsubscribe();
      todayCheckInsUnsubscribe();
      avgStayTimeUnsubscribe();
      recentActivityUnsubscribe();
    };
  }, []);

  // Refresh data manually
  const fetchDashboardData = async () => {
    generateHourlyData();
  };

  // Generate hourly data based on access records
  const generateHourlyData = async () => {
    try {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Query for today's check-ins only
      const todayCheckInsQuery = query(
        collection(db, 'LibraryAccessRecords'),
        where('timestamp', '>=', Timestamp.fromDate(today)),
        where('accessType', '==', 'check-in')
      );
      
      // Set up real-time listener for hourly data
      const hourlyDataUnsubscribe = onSnapshot(
        todayCheckInsQuery,
        (snapshot) => {
          console.log('Hourly data snapshot size:', snapshot.size);
          
          // Initialize hourly buckets (8AM to 6PM)
          const hours = ['8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'];
          const hourlyData = hours.map(hour => ({ hour, visitors: 0 }));
          
          // Count visitors per hour
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.timestamp) {
              let date;
              if (typeof data.timestamp.toDate === 'function') {
                date = data.timestamp.toDate();
              } else if (data.timestamp.seconds) {
                date = new Date(data.timestamp.seconds * 1000);
              } else {
                date = new Date(data.timestamp);
              }
              
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
          
          console.log('Hourly data for chart:', hourlyData);
          setUsageData(hourlyData);
        },
        (error) => {
          console.error('Error generating hourly data:', error);
          // Use empty data on error
          const emptyData = [
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
          setUsageData(emptyData);
        }
      );
      
      // Return the unsubscribe function
      return hourlyDataUnsubscribe;
    } catch (error) {
      console.error('Error setting up hourly data listener:', error);
      // Use empty data on error
      const emptyData = [
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
      setUsageData(emptyData);
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
            {recentActivity.length > 0 ? (
            <List
              itemLayout="horizontal"
              dataSource={recentActivity}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ 
                            backgroundColor: getAvatarColor(item.name), 
                            color: '#fff' 
                          }}
                        >
                          {getInitials(item.name)}
                        </Avatar>
                      }
                    title={item.name}
                    description={
                      <Space>
                          <Tag color={
                            item.action === 'check-in' 
                              ? 'green' 
                              : item.action === 'check-out' 
                                ? 'red' 
                                : 'blue'
                          }>
                            {item.action === 'check-in' 
                              ? 'Checked In' 
                              : item.action === 'check-out' 
                                ? 'Checked Out' 
                                : item.action}
                        </Tag>
                        <Text type="secondary">{formatTimestamp(item.timestamp)}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Text type="secondary">No recent activity</Text>
              </div>
            )}
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

// Function to get initials from name
const getInitials = (name) => {
  if (!name) return '';
  
  // Split the name by spaces and get the first letter of each part
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2); // Limit to 2 characters
};

// Function to generate a consistent color based on name
const getAvatarColor = (name) => {
  if (!name) return '#1890ff'; // Default blue color
  
  // Generate a simple hash from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert hash to a color
  const colors = [
    '#1890ff', // Blue
    '#52c41a', // Green
    '#faad14', // Yellow
    '#f5222d', // Red
    '#722ed1', // Purple
    '#eb2f96', // Pink
    '#fa8c16', // Orange
    '#13c2c2', // Cyan
    '#2f54eb'  // Geekblue
  ];
  
  // Use the hash to select a color from the array
  return colors[Math.abs(hash) % colors.length];
};

export default LibraryDashboard;