import React from 'react';
import { Button } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

function CSVExport({ data, filename = 'export.csv' }) {
  // Handle CSV export
  const handleExport = () => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert data to CSV format
  const convertToCSV = (data) => {
    const headers = ['Date', 'Student', 'Course', 'Status'];
    const rows = data.map(item => [
      item.timestamp?.toLocaleString() || 'N/A',
      item.studentName || 'N/A',
      item.courseName || 'N/A',
      item.status === 'present' ? 'Present' : 'Absent'
    ]);
    
    // Combine headers and rows
    const csvArray = [headers, ...rows];
    
    // Convert each row to CSV string
    const csvContent = csvArray.map(row => row.join(',')).join('\n');
    
    return csvContent;
  };

  return (
    <Button 
      icon={<FileTextOutlined />} 
      onClick={handleExport}
    >
      Export CSV
    </Button>
  );
}

export default CSVExport;
