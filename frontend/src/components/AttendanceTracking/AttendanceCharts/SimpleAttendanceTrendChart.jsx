import React from 'react';
import { Card, Row, Col, Divider } from 'antd';

function SimpleAttendanceTrendChart({ data, title = 'Attendance Trend' }) {
  // Group by date
  const dateGroups = data.reduce((acc, record) => {
    if (!record.timestamp) return acc;
    
    const date = record.timestamp.toLocaleDateString();
    if (!acc[date]) {
      acc[date] = {
        date,
        present: 0,
        absent: 0,
        total: 0
      };
    }
    
    acc[date].total += 1;
    if (record.status === 'present') {
      acc[date].present += 1;
    } else {
      acc[date].absent += 1;
    }
    
    return acc;
  }, {});
  
  // Sort by date
  const sortedDates = Object.values(dateGroups).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Calculate max value for bar scaling
  const maxAttendance = Math.max(
    ...sortedDates.map(day => Math.max(day.present, day.absent))
  );

  return (
    <Card title={title || 'Attendance Trend'}>
      <div style={{ height: '300px', overflowX: 'auto', overflowY: 'hidden' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          height: '250px',
          minWidth: sortedDates.length * 80,
          paddingBottom: '20px'
        }}>
          {sortedDates.map((day, index) => {
            const presentHeight = maxAttendance > 0 ? (day.present / maxAttendance) * 200 : 0;
            const absentHeight = maxAttendance > 0 ? (day.absent / maxAttendance) * 200 : 0;
            const attendanceRate = day.total > 0 ? Math.round((day.present / day.total) * 100) : 0;
            
            return (
              <div key={index} style={{ textAlign: 'center', flex: '0 0 70px', margin: '0 5px' }}>
                <div style={{ height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ 
                    height: `${absentHeight}px`, 
                    background: '#f5222d',
                    marginBottom: '2px',
                    width: '30px',
                    alignSelf: 'center'
                  }} />
                  <div style={{ 
                    height: `${presentHeight}px`, 
                    background: '#52c41a',
                    width: '30px',
                    alignSelf: 'center'
                  }} />
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px' }}>{day.date}</div>
                <div style={{ fontSize: '10px' }}>{attendanceRate}%</div>
              </div>
            );
          })}
        </div>
      </div>
      
      <Divider style={{ margin: '10px 0' }} />
      
      <Row gutter={[8, 8]}>
        <Col span={12}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '12px', height: '12px', background: '#52c41a', marginRight: '8px' }}></div>
            <span>Present</span>
          </div>
        </Col>
        <Col span={12}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '12px', height: '12px', background: '#f5222d', marginRight: '8px' }}></div>
            <span>Absent</span>
          </div>
        </Col>
      </Row>
    </Card>
  );
}

export default SimpleAttendanceTrendChart;