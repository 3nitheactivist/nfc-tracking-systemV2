import React from 'react';
import { Card } from 'antd';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function AttendanceBarChart({ data, title = 'Attendance by Course' }) {
  // Process data for chart
  const processData = () => {
    // Group by course
    const courseGroups = data.reduce((acc, record) => {
      const courseId = record.courseId;
      if (!acc[courseId]) {
        acc[courseId] = {
          courseName: record.courseName,
          present: 0,
          absent: 0
        };
      }
      
      if (record.status === 'present') {
        acc[courseId].present += 1;
      } else {
        acc[courseId].absent += 1;
      }
      
      return acc;
    }, {});
    
    // Convert to arrays for chart
    const courseNames = Object.values(courseGroups).map(group => group.courseName);
    const presentCounts = Object.values(courseGroups).map(group => group.present);
    const absentCounts = Object.values(courseGroups).map(group => group.absent);
    
    return {
      labels: courseNames,
      datasets: [
        {
          label: 'Present',
          data: presentCounts,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Absent',
          data: absentCounts,
          backgroundColor: 'rgba(255, 99, 132, 0.6)',
          borderColor: 'rgba(255, 99, 132, 1)',
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
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Students'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Courses'
        }
      }
    }
  };

  return (
    <Card title={title}>
      <Bar data={processData()} options={options} />
    </Card>
  );
}

export default AttendanceBarChart;
