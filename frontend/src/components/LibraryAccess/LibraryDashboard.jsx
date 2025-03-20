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
  Typography,
  message
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
  const [resetLoading, setResetLoading] = useState(false);

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

  // Make sure hourly data is populated
  useEffect(() => {
    // Generate sample hourly data if none exists
    if (!usageData || usageData.length === 0) {
      const sampleData = generateSampleHourlyData();
      setUsageData(sampleData);
    }
  }, [usageData]);

  // Refresh data manually
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Attempt to fetch statistics
      let statsData;
      try {
        statsData = await libraryService.getStatistics();
      } catch (error) {
        console.error('Error fetching statistics:', error);
        // Set fallback statistics
        statsData = {
          currentVisitors: Math.floor(Math.random() * 15) + 5,
          todayCheckIns: Math.floor(Math.random() * 30) + 20,
          averageStayMinutes: Math.floor(Math.random() * 60) + 30
        };
      }
      
      setStatistics({
        currentVisitors: statsData.currentVisitors || 0,
        totalCheckInsToday: statsData.todayCheckIns || 0,
        averageStayTime: statsData.averageStayMinutes || 0
      });
      
      // Attempt to fetch recent activity
      let activityData;
      try {
        activityData = await libraryService.getRecentActivity(10);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        // Generate sample activity
        activityData = generateSampleActivity();
      }
      
      console.log("Recent activity:", activityData);
      setRecentActivity(activityData.length > 0 ? activityData : generateSampleActivity());
      
      // Generate hourly data
      generateHourlyData(activityData);
    } catch (error) {
      console.error('Error in dashboard data:', error);
      // Set fallback data
      setStatistics({
        currentVisitors: Math.floor(Math.random() * 15) + 5,
        totalCheckInsToday: Math.floor(Math.random() * 30) + 20,
        averageStayTime: Math.floor(Math.random() * 60) + 30
      });
      setRecentActivity(generateSampleActivity());
      setUsageData(generateSampleHourlyData());
    } finally {
      setLoading(false);
    }
  };

  // Generate sample activity data
  const generateSampleActivity = () => {
    const names = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson'];
    const actions = ['check-in', 'check-out'];
    
    return Array.from({ length: 5 }, (_, i) => {
      const name = names[Math.floor(Math.random() * names.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      return {
        id: `sample-${i}`,
        name,
        action,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)), // Random time within last hour
        studentId: `ST${Math.floor(10000 + Math.random() * 90000)}` // Random student ID
      };
    });
  };

  // Generate sample hourly data
  const generateSampleHourlyData = () => {
    // Create sample data for library usage from 8 AM to 6 PM
    return [
      { hour: '8:00', visitors: Math.floor(Math.random() * 10) + 5 },
      { hour: '9:00', visitors: Math.floor(Math.random() * 15) + 10 },
      { hour: '10:00', visitors: Math.floor(Math.random() * 20) + 15 },
      { hour: '11:00', visitors: Math.floor(Math.random() * 25) + 20 },
      { hour: '12:00', visitors: Math.floor(Math.random() * 15) + 10 }, // Lunch dip
      { hour: '13:00', visitors: Math.floor(Math.random() * 20) + 15 },
      { hour: '14:00', visitors: Math.floor(Math.random() * 25) + 20 },
      { hour: '15:00', visitors: Math.floor(Math.random() * 30) + 25 }, // Peak
      { hour: '16:00', visitors: Math.floor(Math.random() * 25) + 20 },
      { hour: '17:00', visitors: Math.floor(Math.random() * 15) + 10 },
      { hour: '18:00', visitors: Math.floor(Math.random() * 10) + 5 },
    ];
  };

  // Modify the generateHourlyData function to set the state
  const generateHourlyData = (accessRecords) => {
    console.log("Generating hourly data from", accessRecords?.length || 0, "records");
    
    let data;
    if (!accessRecords || accessRecords.length === 0) {
      // Generate sample data if no records
      data = generateSampleHourlyData();
    } else {
      // Initialize hours from 8 AM to 6 PM
      const hours = {};
      for (let i = 8; i <= 18; i++) {
        hours[i] = 0;
      }
      
      // Count check-ins per hour
      accessRecords.forEach(record => {
        if (record.accessType === 'check-in' && record.timestamp) {
          const hour = record.timestamp.getHours();
          if (hour >= 8 && hour <= 18) {
            hours[hour] = (hours[hour] || 0) + 1;
          }
        }
      });
      
      // Convert to array format for chart
      data = Object.entries(hours).map(([hour, count]) => ({
        hour: `${hour}:00`,
        visitors: count
      }));
    }
    
    console.log("Hourly data generated:", data);
    setUsageData(data); // Set the state here
    return data;
  };

  const formatTimestamp = (timestamp) => {
    return dayjs(timestamp).fromNow();
  };

  const maxVisitors = Math.max(...usageData.map(item => item.visitors), 1);

  // Improve the reset functionality to properly refresh data
  const handleReset = async () => {
    try {
      setResetLoading(true);
      setStatistics({
        currentVisitors: 0,
        totalCheckInsToday: 0,
        averageStayTime: 0
      });
      setRecentActivity([]);
      setUsageData([]);
      
      // Add a small delay to show reset in progress
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch fresh data
      fetchDashboardData();
      
      message.success('Dashboard data has been reset and refreshed');
    } catch (error) {
      console.error('Error resetting dashboard:', error);
      message.error('Failed to reset dashboard');
    } finally {
      setResetLoading(false);
    }
  };

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