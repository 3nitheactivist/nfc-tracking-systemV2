import { Table } from 'antd';
import { useState } from 'react';

const DataTable = ({ 
  data, 
  columns, 
  loading, 
  pagination = true,
  exportable = false 
}) => {
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
    },
  });

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      sorter,
    });
  };

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      onChange={handleTableChange}
      pagination={pagination ? tableParams.pagination : false}
    />
  );
};

export default DataTable; 