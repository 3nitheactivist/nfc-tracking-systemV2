import React, { useState, useEffect } from 'react';
import { 
  Table, Tag, Space, Button, DatePicker, Select, 
  message, Card, Typography, Modal, Tooltip 
} from 'antd';
import { 
  DownloadOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, EditOutlined 
} from '@ant-design/icons';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../utils/firebase/firebase';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

function PrescriptionList() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const prescriptionsRef = collection(db, 'medical_prescriptions');
    const q = query(prescriptionsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prescriptionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        key: doc.id
      }));
      setPrescriptions(prescriptionsList);
      setFilteredData(prescriptionsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFilter = () => {
    let filtered = [...prescriptions];

    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(item => {
        const prescriptionDate = dayjs(item.prescriptionDate.toDate());
        return prescriptionDate.isBetween(start, end, 'day', '[]');
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    setFilteredData(filtered);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(item => ({
      'Student Name': item.studentName,
      'Student ID': item.schoolId,
      'Prescription Date': dayjs(item.prescriptionDate.toDate()).format('YYYY-MM-DD'),
      'Medications': item.medications.map(med => 
        `${med.name} (${med.dosage})`
      ).join(', '),
      'Status': item.status,
      'Expiry Date': item.expiryDate,
      'Collection Date': item.collectionDate ? 
        dayjs(item.collectionDate.toDate()).format('YYYY-MM-DD HH:mm') : 'Not collected'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prescriptions');
    XLSX.writeFile(wb, 'medical_prescriptions.xlsx');
  };

  const handleStatusChange = async (prescriptionId, newStatus) => {
    try {
      const prescriptionRef = doc(db, 'medical_prescriptions', prescriptionId);
      await updateDoc(prescriptionRef, {
        status: newStatus,
        collectionDate: newStatus === 'collected' ? serverTimestamp() : null,
        updatedAt: serverTimestamp()
      });
      message.success('Prescription status updated successfully');
    } catch (error) {
      console.error('Error updating prescription status:', error);
      message.error('Failed to update prescription status');
    }
  };

  const showPrescriptionDetails = (record) => {
    setSelectedPrescription(record);
    setIsModalVisible(true);
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
      title: 'Prescription Date',
      dataIndex: 'prescriptionDate',
      key: 'prescriptionDate',
      render: (date) => date ? dayjs(date.toDate()).format('YYYY-MM-DD') : 'N/A'
    },
    {
      title: 'Medications',
      dataIndex: 'medications',
      key: 'medications',
      render: (medications) => (
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {medications.map((med, index) => (
            <li key={index}>{med.name}</li>
          ))}
        </ul>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let icon = null;

        switch (status) {
          case 'pending':
            color = 'processing';
            break;
          case 'collected':
            color = 'success';
            icon = <CheckCircleOutlined />;
            break;
          case 'expired':
            color = 'error';
            icon = <CloseCircleOutlined />;
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
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showPrescriptionDetails(record)}
          >
            Details
          </Button>
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleStatusChange(record.id, 'collected')}
            >
              Mark as Collected
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Title level={4}>Medical Prescriptions</Title>

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
            <Option value="pending">Pending</Option>
            <Option value="collected">Collected</Option>
            <Option value="expired">Expired</Option>
          </Select>

          <Button 
            type="primary" 
            icon={<DownloadOutlined />} 
            onClick={exportToExcel}
          >
            Export to Excel
          </Button>
        </Space>

        {/* Prescriptions Table */}
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />

        {/* Prescription Details Modal */}
        <Modal
          title="Prescription Details"
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setIsModalVisible(false)}>
              Close
            </Button>
          ]}
          width={700}
        >
          {selectedPrescription && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={5}>Student Information</Title>
              <Text>Name: {selectedPrescription.studentName}</Text>
              <Text>ID: {selectedPrescription.schoolId}</Text>

              <Title level={5} style={{ marginTop: 16 }}>Medications</Title>
              {selectedPrescription.medications.map((med, index) => (
                <Card size="small" key={index} style={{ marginBottom: 8 }}>
                  <Text strong>{med.name}</Text>
                  <br />
                  <Text>Dosage: {med.dosage}</Text>
                  <br />
                  <Text>Instructions: {med.instructions}</Text>
                </Card>
              ))}

              <Title level={5} style={{ marginTop: 16 }}>Additional Information</Title>
              <Text>Prescription Date: {dayjs(selectedPrescription.prescriptionDate.toDate()).format('YYYY-MM-DD')}</Text>
              <br />
              <Text>Expiry Date: {selectedPrescription.expiryDate}</Text>
              <br />
              <Text>Status: {selectedPrescription.status.toUpperCase()}</Text>
              {selectedPrescription.collectionDate && (
                <>
                  <br />
                  <Text>Collected On: {dayjs(selectedPrescription.collectionDate.toDate()).format('YYYY-MM-DD HH:mm')}</Text>
                </>
              )}
              {selectedPrescription.additionalInstructions && (
                <>
                  <Title level={5} style={{ marginTop: 16 }}>Additional Instructions</Title>
                  <Text>{selectedPrescription.additionalInstructions}</Text>
                </>
              )}
            </Space>
          )}
        </Modal>
      </Space>
    </Card>
  );
}

export default PrescriptionList; 