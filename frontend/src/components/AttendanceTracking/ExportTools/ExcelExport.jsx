import React from 'react';
import { Button } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';

function ExcelExport({ data, filename = 'export.xlsx' }) {
  // Handle Excel-like CSV export (Excel can open CSV files)
  const handleExport = () => {
    // Format data for Excel-compatible CSV
    const csvContent = convertToCSV(data);
    
    // Create a BOM for Excel to recognize UTF-8
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    // Change extension to .csv as it's more universally compatible
    const excelFilename = filename.endsWith('.xlsx') 
      ? filename.replace('.xlsx', '.csv') 
      : `${filename}.csv`;
      
    link.setAttribute('download', excelFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert data to CSV format with Excel compatibility
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
    
    // Convert each row to CSV string with proper escaping for Excel
    const csvContent = csvArray.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote or newline
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');
    
    return csvContent;
  };

  return (
    <Button 
      icon={<FileExcelOutlined />} 
      onClick={handleExport}
    >
      Export Excel
    </Button>
  );
}

export default ExcelExport;
