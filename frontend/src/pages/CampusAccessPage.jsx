import React from 'react';
import { Row, Col, Card, Tabs } from 'antd';
import CampusAccessScanner from '../components/CampusAccess/CampusAccessScanner';
import AccessHistory from '../components/CampusAccess/AccessHistory';
import CampusDashboard from '../components/CampusAccess/CampusDashboard';

const CampusAccessPage = () => {
  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Campus Access System">
            <Tabs defaultActiveKey="dashboard">
              <Tabs.TabPane tab="Dashboard" key="dashboard">
                <CampusDashboard />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Scanner" key="scanner">
                <CampusAccessScanner />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Access History" key="history">
                <AccessHistory />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CampusAccessPage;