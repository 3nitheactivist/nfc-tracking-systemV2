import React from 'react';
import { Card } from 'antd';
import { Pie } from 'react-chartjs-2';
// We no longer need to import Chart or register components here
// since it's handled globally in chartjs-register.js

function AttendancePieChart({ data, title = 'Attendance Overview' }) {
  // Process data for chart
  const processData = () => {
    // Count present and absent
    const presentCount = data.filter(record => record.status === 'present').length;
    const absentCount = data.filter(record => record.status === 'absent').length;
    
    return {
      labels: ['Present', 'Absent'],
      datasets: [
        {
          data: [presentCount, absentCount],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <Card title={title}>
      <Pie data={processData()} options={options} />
    </Card>
  );
}

export default AttendancePieChart;
