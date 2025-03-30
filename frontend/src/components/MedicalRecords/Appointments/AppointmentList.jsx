import React, { useState, useEffect } from 'react';
import { 
  Table, Tag, Space, Button, DatePicker, Select, 
  message, Card, Typography 
} from 'antd';
import { 
  DownloadOutlined, ReloadOutlined, 
  CheckCircleOutlined, CloseCircleOutlined 
} from '@ant-design/icons';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../../utils/firebase/firebase';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title } = Typography;

function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const appointmentsRef = collection(db, 'medical_appointments');
    const q = query(appointmentsRef, orderBy('appointmentDate', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        key: doc.id // for table
      }));
      setAppointments(appointmentsList);
      setFilteredData(appointmentsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFilter = () => {
    let filtered = [...appointments];

    // Date range filter
    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(item => {
        const appointmentDate = dayjs(item.appointmentDate);
        return appointmentDate.isBetween(start, end, 'day', '[]');
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredData(filtered);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'Student Name': item.studentName,
      'Student ID': item.schoolId,
      'Appointment Date': item.appointmentDate,
      'Appointment Time': item.appointmentTime,
      'Status': item.status,
      'Reason': item.reason,
      'Notes': item.notes
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments');
    XLSX.writeFile(wb, 'medical_appointments.xlsx');
  };

  const columns = [
    {
      title: 'Student',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <span>{text}</span>
          <Tag color="blue">{record.schoolId}</Tag>
        </Space>
      )
    },
    {
      title: 'Appointment',
      dataIndex: 'appointmentDate',
      key: 'appointmentDate',
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <span>{text}</span>
          <span>{record.appointmentTime}</span>
        </Space>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let icon = null;

        switch (status) {
          case 'scheduled':
            color = 'processing';
            break;
          case 'checked-in':
            color = 'success';
            icon = <CheckCircleOutlined />;
            break;
          case 'missed':
            color = 'error';
            icon = <CloseCircleOutlined />;
            break;
          case 'cancelled':
            color = 'warning';
            break;
          default:
            break;
        }

        return (
          <Tag color={color} icon={icon}>
            {status.toUpperCase()}
          </Tag>
        );
      }
    }
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Title level={4}>Medical Appointments</Title>

        {/* Filters */}
        <Space wrap>
          <RangePicker
            onChange={(dates) => {
              setDateRange(dates);
              handleFilter();
            }}
          />

          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={(value) => {
              setStatusFilter(value);
              handleFilter();
            }}
          >
            <Option value="all">All Status</Option>
            <Option value="scheduled">Scheduled</Option>
            <Option value="checked-in">Checked In</Option>
            <Option value="missed">Missed</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>

          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleFilter}
          >
            Refresh
          </Button>

          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={exportToExcel}
          >
            Export to Excel
          </Button>
        </Space>

        {/* Appointments Table */}
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      </Space>
    </Card>
  );
}

export default AppointmentList;