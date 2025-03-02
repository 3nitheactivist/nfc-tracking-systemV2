import React from 'react';
import { Row, Col, Card, Tabs } from 'antd';
import HostelAssignment from '../components/HostelManagement/HostelAssignment';
import HostelAccessScanner from '../components/HostelManagement/HostelAccessScanner';
import HostelDashboard from '../components/HostelManagement/HostelDashboard';

const HostelManagementPage = () => {
  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Hostel Management System">
            <Tabs defaultActiveKey="dashboard">
              <Tabs.TabPane tab="Dashboard" key="dashboard">
                <HostelDashboard />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Room Assignment" key="assignment">
                <HostelAssignment />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Access Control" key="access">
                <HostelAccessScanner />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HostelManagementPage;