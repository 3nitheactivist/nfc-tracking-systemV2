import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Typography, Spin, Empty, Select, Progress, Tag, Space, Button, Popconfirm, message } from 'antd';
import { HomeOutlined, TeamOutlined, UserOutlined, LoginOutlined, LogoutOutlined, DeleteOutlined } from '@ant-design/icons';
import { hostelService } from '../../utils/firebase/hostelService';

const { Text, Title } = Typography;
const { Option } = Select;

function HostelDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalHostels: 0,
    totalRooms: 0,
    totalCapacity: 0,
    totalOccupants: 0,
    occupancyRate: 0,
    hostelStats: {}
  });
  const [hostels, setHostels] = useState([]);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  
  useEffect(() => {
    // Load hostels and set up real-time subscriptions
    let unsubscribeStats = null;
    let unsubscribeHostels = null;
    
    const setupSubscriptions = async () => {
      try {
        setLoading(true);
        
        // Subscribe to hostels in real-time
        unsubscribeHostels = hostelService.subscribeToHostels((hostelsData) => {
          setHostels(hostelsData);
          
          // Set default selected hostel if available
          if (hostelsData.length > 0 && !selectedHostel) {
            setSelectedHostel(hostelsData[0].id);
          }
        });
        
        // Subscribe to hostel statistics in real-time
        unsubscribeStats = hostelService.subscribeToHostelStatistics((statsData) => {
          setStats(statsData);
          setLoading(false);
        });
        
      } catch (error) {
        console.error('Error setting up hostel dashboard subscriptions:', error);
        setLoading(false);
      }
    };
    
    setupSubscriptions();
    
    // Clean up subscriptions when component unmounts
    return () => {
      if (unsubscribeStats) unsubscribeStats();
      if (unsubscribeHostels) unsubscribeHostels();
    };
  }, []);
  
  useEffect(() => {
    // Subscribe to recent access events for the selected hostel
    if (!selectedHostel) return;
    
    const unsubscribe = hostelService.subscribeToHostelAccessEvents(selectedHostel, (events) => {
      setRecentEvents(events);
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedHostel]);
  
  // useEffect(() => {
  //   console.log('Stats received in HostelDashboard:', stats);
  // }, [stats]);
  
  const handleHostelChange = (hostelId) => {
    setSelectedHostel(hostelId);
  };
  
  const getSelectedHostelStats = () => {
    if (!selectedHostel || !stats.hostelStats[selectedHostel]) {
      return {
        name: 'N/A',
        totalRooms: 0,
        capacity: 0,
        occupants: 0,
        occupancyRate: 0,
        availableRooms: 0,
        fullRooms: 0
      };
    }
    
    return stats.hostelStats[selectedHostel];
  };
  
  const selectedStats = getSelectedHostelStats();
  
  const handleDeleteHostel = async () => {
    if (!selectedHostel) {
      message.warning('Please select a hostel to delete');
      return;
    }
    
    try {
      setLoading(true);
      await hostelService.deleteHostelWithRelatedData(selectedHostel);
      message.success('Hostel and all related data deleted successfully');
      setSelectedHostel(null);
    } catch (error) {
      console.error('Error deleting hostel:', error);
      message.error('Failed to delete hostel');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="hostel-dashboard-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4}>Hostel Occupancy Dashboard</Title>
              </Col>
              <Col>
                <Space>
                  <Select
                    placeholder="Select Hostel"
                    style={{ width: 200 }}
                    value={selectedHostel}
                    onChange={handleHostelChange}
                    loading={loading}
                  >
                    {hostels.map(hostel => (
                      <Option key={hostel.id} value={hostel.id}>{hostel.name}</Option>
                    ))}
                  </Select>
                  
                  {selectedHostel && (
                    <Popconfirm
                      title="Delete this hostel?"
                      description="This will delete all rooms, assignments, and access records for this hostel."
                      onConfirm={handleDeleteHostel}
                      okText="Yes, Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button 
                        danger 
                        icon={<DeleteOutlined />}
                        loading={loading}
                      >
                        Delete Hostel
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <Card title="Overall Statistics">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Total Hostels"
                      value={stats.totalHostels}
                      prefix={<HomeOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Total Rooms"
                      value={stats.totalRooms}
                      prefix={<HomeOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Total Capacity"
                      value={stats.totalCapacity}
                      prefix={<TeamOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Total Occupants"
                      value={stats.totalOccupants}
                      prefix={<UserOutlined />}
                    />
                  </Col>
                </Row>
                <div style={{ marginTop: 16 }}>
                  <Text>Overall Occupancy Rate</Text>
                  <Progress 
                    percent={Math.round(stats.totalCapacity > 0 ? (stats.totalOccupants / stats.totalCapacity) * 100 : 0)} 
                    status={(stats.totalCapacity > 0 ? (stats.totalOccupants / stats.totalCapacity) * 100 : 0) > 90 ? 'exception' : 'normal'}
                  />
                </div>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card title={`${selectedStats.name} Statistics`}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="Total Rooms"
                      value={selectedStats.totalRooms}
                      prefix={<HomeOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Available Rooms"
                      value={selectedStats.availableRooms}
                      prefix={<HomeOutlined style={{ color: '#52c41a' }} />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Total Capacity"
                      value={selectedStats.capacity}
                      prefix={<TeamOutlined />}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Current Occupants"
                      value={selectedStats.occupants}
                      prefix={<UserOutlined />}
                    />
                  </Col>
                </Row>
                <div style={{ marginTop: 16 }}>
                  <Text>{selectedStats.name} Occupancy Rate</Text>
                  <Progress 
                    percent={Math.round(selectedStats.capacity > 0 ? (selectedStats.occupants / selectedStats.capacity) * 100 : 0)} 
                    status={(selectedStats.capacity > 0 ? (selectedStats.occupants / selectedStats.capacity) * 100 : 0) > 90 ? 'exception' : 'normal'}
                  />
                </div>
              </Card>
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card title="Recent Access Events">
                {recentEvents.length > 0 ? (
                  <List
                    dataSource={recentEvents.slice(0, 10)}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          title={`${item.studentName || 'Unknown'} (Room: ${item.roomNumber || 'N/A'})`}
                          description={
                            <>
                              <Text
                                type={item.eventType === 'entry' ? 'success' : 'secondary'}
                              >
                                {item.eventType === 'entry' ? 'Entry' : 'Exit'}
                              </Text>
                              <Text> - {item.timestamp?.toLocaleString()}</Text>
                              {item.reason && (
                                <div>
                                  <Text type="secondary">Reason: {item.reason}</Text>
                                </div>
                              )}
                            </>
                          }
                        />
                        <div>
                          <Tag color={item.accessType === 'granted' ? 'green' : 'red'}>
                            {item.accessType === 'granted' ? 'Granted' : 'Denied'}
                          </Tag>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="No recent access events" />
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
}

export default HostelDashboard;