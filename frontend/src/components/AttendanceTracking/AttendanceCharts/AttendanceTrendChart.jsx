import React from 'react';
import { Card } from 'antd';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function AttendanceTrendChart({ data, title = 'Attendance Trend' }) {
  // Process data for chart
  const processData = () => {
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
      
      if (record.status === 'present') {
        acc[date].present += 1;
      } else {
        acc[date].absent += 1;
      }
      
      acc[date].total += 1;
      
      return acc;
    }, {});
    
    // Sort by date
    const sortedDates = Object.values(dateGroups).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    // Extract data for chart
    const dates = sortedDates.map(group => group.date);
    const presentCounts = sortedDates.map(group => group.present);
    const attendanceRates = sortedDates.map(group => 
      group.total > 0 ? (group.present / group.total) * 100 : 0
    );
    
    return {
      labels: dates,
      datasets: [
        {
          label: 'Present Students',
          data: presentCounts,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Attendance Rate (%)',
          data: attendanceRates,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.1,
          yAxisID: 'y1'
        }
      ]
    };
  };

  // Chart options
  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Number of Students'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Attendance Rate (%)'
        },
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  return (
    <Card title={title}>
      <Line data={processData()} options={options} />
    </Card>
  );
}

export default AttendanceTrendChart;
