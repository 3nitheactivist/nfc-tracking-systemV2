import React from 'react';
import { Row, Col, Card, Tabs } from 'antd';
import MedicalRecordForm from '../components/MedicalRecords/MedicalRecordForm';
import MedicalHistory from '../components/MedicalRecords/MedicalHistory';
import MedicalDashboard from '../components/MedicalRecords/MedicalDashboard';

const MedicalRecordsPage = () => {
  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Medical Records System">
            <Tabs defaultActiveKey="dashboard">
              <Tabs.TabPane tab="Dashboard" key="dashboard">
                <MedicalDashboard />
              </Tabs.TabPane>
              <Tabs.TabPane tab="New Record" key="new">
                <MedicalRecordForm />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Medical History" key="history">
                <MedicalHistory />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MedicalRecordsPage;