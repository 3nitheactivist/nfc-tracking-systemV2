import React from 'react';
import { Card, Row, Col, Progress } from 'antd';

function SimpleAttendanceBarChart({ data, title = 'Attendance by Course' }) {
  // Group by course
  const courseGroups = data.reduce((acc, record) => {
    const courseId = record.courseId;
    if (!acc[courseId]) {
      acc[courseId] = {
        courseName: record.courseName || 'Unknown Course',
        present: 0,
        absent: 0,
        total: 0
      };
    }
    
    acc[courseId].total += 1;
    if (record.status === 'present') {
      acc[courseId].present += 1;
    } else {
      acc[courseId].absent += 1;
    }
    
    return acc;
  }, {});
  
  // Sort courses
  const sortedCourses = Object.values(courseGroups).sort((a, b) => 
    b.total - a.total
  );

  return (
    <Card title={title || 'Attendance by Course'}>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {sortedCourses.map((course, index) => {
          const presentPercentage = course.total > 0 ? Math.round((course.present / course.total) * 100) : 0;
          return (
            <div key={index} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>{course.courseName}</span>
                <span>{presentPercentage}% Present ({course.present}/{course.total})</span>
              </div>
              <Progress 
                percent={presentPercentage}
                strokeColor={presentPercentage >= 70 ? '#52c41a' : '#f5222d'}
                size="small"
              />
            </div>
          );
        })}
        {sortedCourses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            No course data available
          </div>
        )}
      </div>
    </Card>
  );
}

export default SimpleAttendanceBarChart;
