import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Typography, Spin, Empty, Tabs } from 'antd';
import { UserOutlined, ClockCircleOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';
import { medicalService } from '../../utils/firebase/medicalService';
import AppointmentForm from './Appointments/AppointmentForm';
import AppointmentList from './Appointments/AppointmentList';

const { Text } = Typography;
const { TabPane } = Tabs;

function MedicalDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    recentRecords: 0,
    departmentCounts: {}
  });
  const [recentRecords, setRecentRecords] = useState([]);

  useEffect(() => {
    // Set up real-time listener for dashboard data
    const unsubscribeAll = onSnapshot(
      collection(db, 'medicalRecords'),
      (snapshot) => {
        const allRecords = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          visitDate: doc.data().visitDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        
        processDashboardData(allRecords);
      },
      (error) => {
        console.error('Error in real-time dashboard data:', error);
        setLoading(false);
      }
    );
    
    // Set up real-time listener for recent records
    const unsubscribeRecent = medicalService.subscribeToRecentMedicalRecords(5, (records) => {
      setRecentRecords(records);
    });
    
    // Clean up listeners when component unmounts
    return () => {
      unsubscribeAll();
      unsubscribeRecent();
    };
  }, []);

  const processDashboardData = (allRecords) => {
    try {
      // Get unique patient IDs
      const uniquePatients = new Set(allRecords.map(record => record.patientId));
      
      // Get records from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRecordsCount = allRecords.filter(
        record => record.createdAt && record.createdAt >= thirtyDaysAgo
      ).length;
      
      // Count by department
      const departments = {};
      allRecords.forEach(record => {
        const dept = record.department || 'Unassigned';
        departments[dept] = (departments[dept] || 0) + 1;
      });
      
      setStats({
        totalPatients: uniquePatients.size,
        recentRecords: recentRecordsCount,
        departmentCounts: departments
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error processing dashboard data:', error);
      setLoading(false);
    }
  };

  return (
    <Tabs defaultActiveKey="1">
      <TabPane tab="Medical Records" key="1">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Patients"
                    value={stats.totalPatients}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Records (Last 30 Days)"
                    value={stats.recentRecords}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="Total Records"
                    value={Object.values(stats.departmentCounts).reduce((a, b) => a + b, 0)}
                    prefix={<MedicineBoxOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card title="Recent Medical Records">
                  {recentRecords.length > 0 ? (
                    <List
                      dataSource={recentRecords}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            title={`${item.patientName} (ID: ${item.patientId})`}
                            description={
                              <>
                                <Text type="secondary">
                                  {item.visitDate?.toLocaleDateString()} | Dr. {item.doctorName}
                                </Text>
                                <br />
                                <Text strong>{item.diagnosis}</Text>
                              </>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="No recent records" />
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Records by Department">
                  {Object.keys(stats.departmentCounts).length > 0 ? (
                    <List
                      dataSource={Object.entries(stats.departmentCounts).sort((a, b) => b[1] - a[1])}
                      renderItem={([department, count]) => (
                        <List.Item>
                          <List.Item.Meta
                            title={department}
                            description={`${count} record${count !== 1 ? 's' : ''}`}
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="No department data" />
                  )}
                </Card>
              </Col>
            </Row>
          </>
        )}
      </TabPane>
      
      <TabPane tab="Appointments" key="2">
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: '0 0 400px' }}>
            <AppointmentForm />
          </div>
          <div style={{ flex: 1 }}>
            <AppointmentList />
          </div>
        </div>
      </TabPane>
      
      {/* Other tabs */}
    </Tabs>
  );
}

export default MedicalDashboard;