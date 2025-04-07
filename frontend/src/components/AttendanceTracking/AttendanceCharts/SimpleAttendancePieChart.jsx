import React from 'react';
import { Card, Row, Col, Progress } from 'antd';

function SimpleAttendancePieChart({ data, title = 'Attendance Overview' }) {
  // Count present and absent
  const presentCount = data.filter(record => record.status === 'present').length;
  const absentCount = data.filter(record => record.status === 'absent').length;
  const totalCount = presentCount + absentCount;
  
  // Calculate percentages
  const presentPercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  const absentPercentage = totalCount > 0 ? Math.round((absentCount / totalCount) * 100) : 0;

  return (
    <Card title={title || 'Attendance Overview'}>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Present" bordered={false} style={{ textAlign: 'center' }}>
            <Progress 
              type="circle" 
              percent={presentPercentage} 
              strokeColor="#52c41a"
              format={() => `${presentCount}`}
            />
            <div style={{ marginTop: 10 }}>{presentPercentage}%</div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Absent" bordered={false} style={{ textAlign: 'center' }}>
            <Progress 
              type="circle" 
              percent={absentPercentage} 
              strokeColor="#f5222d"
              format={() => `${absentCount}`}
            />
            <div style={{ marginTop: 10 }}>{absentPercentage}%</div>
          </Card>
        </Col>
      </Row>
    </Card>
  );
}

export default SimpleAttendancePieChart;
