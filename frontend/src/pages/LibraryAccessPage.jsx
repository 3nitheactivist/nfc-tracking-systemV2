import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Tabs,
  Space,
  Typography,
  Badge
} from 'antd';
import { 
  DashboardOutlined, 
  ScanOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import LibraryAccessScanner from '../components/LibraryAccess/LibraryAccessScanner';
import LibraryHistory from '../components/LibraryAccess/LibraryHistory';
import LibraryDashboard from '../components/LibraryAccess/LibraryDashboard';

const { Title } = Typography;

const LibraryAccessPage = () => {
  const [activeKey, setActiveKey] = useState('dashboard');

  const items = [
    {
      key: 'dashboard',
      label: (
        <span>
          <DashboardOutlined style={{ marginRight: 4 }}/>
          Dashboard
        </span>
      ),
      children: <LibraryDashboard />,
    },
    {
      key: 'scanner',
      label: (
        <span>
          <ScanOutlined style={{ marginRight: 4 }} />
          Scanner
          <Badge dot style={{ marginLeft: 4 }} />
        </span>
      ),
      children: <LibraryAccessScanner />,
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined style={{ marginRight: 4 }} />
          Access History
        </span>
      ),
      children: <LibraryHistory />,
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="page-container"
    >
      <Row gutter={[0, 16]}>
        <Col span={24}>
          <Card 
            className="card-with-tabs"
            title={
              <Space>
                <Title level={3} style={{ margin: 0 }}>
                  Library Access Control
                </Title>
              </Space>
            }
            bodyStyle={{ padding: 0 }}
          >
            <Tabs 
              defaultActiveKey="dashboard" 
              activeKey={activeKey}
              onChange={setActiveKey}
              items={items}
              tabBarStyle={{ 
                padding: '0 24px',
                marginBottom: 0,
                borderBottom: '1px solid #f0f0f0'
              }}
              style={{ marginTop: '-7px' }}
              size="large"
              tabBarGutter={32}
            />
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default LibraryAccessPage;