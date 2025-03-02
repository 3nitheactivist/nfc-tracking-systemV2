import React from 'react';
import { Row, Col, Card, Tabs } from 'antd';
import AttendanceScanner from '../components/AttendanceTracking/AttendanceScanner';
import AttendanceHistory from '../components/AttendanceTracking/AttendanceHistory';
import DailyReport from '../components/AttendanceTracking/AttendanceReports/DailyReport';
import WeeklyReport from '../components/AttendanceTracking/AttendanceReports/WeeklyReport';
import SessionalReport from '../components/AttendanceTracking/AttendanceReports/SessionalReport';

const AttendanceTrackingPage = () => {
  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Attendance Management">
            <Tabs defaultActiveKey="scanner">
              <Tabs.TabPane tab="Scanner" key="scanner">
                <AttendanceScanner />
              </Tabs.TabPane>
              <Tabs.TabPane tab="History" key="history">
                <AttendanceHistory />
              </Tabs.TabPane>
              <Tabs.TabPane tab="Reports" key="reports">
                <Tabs defaultActiveKey="daily">
                  <Tabs.TabPane tab="Daily" key="daily">
                    <DailyReport />
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Weekly" key="weekly">
                    <WeeklyReport />
                  </Tabs.TabPane>
                  <Tabs.TabPane tab="Sessional" key="sessional">
                    <SessionalReport />
                  </Tabs.TabPane>
                </Tabs>
              </Tabs.TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AttendanceTrackingPage;