import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Modal, message, Tag, Tooltip, Row, Col } from 'antd';
import { SearchOutlined, DeleteOutlined, EyeOutlined, ScanOutlined } from '@ant-design/icons';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';
import { useNFCScanner } from '../../hooks/useNFCScanner';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import { medicalService } from '../../utils/firebase/medicalService';

function MedicalHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [studentFilter, setStudentFilter] = useState(null);
  const { startScan, stopScan, scanning, lastScannedId, scanStatus: nfcScanStatus } = useNFCScanner();
  const { handleNFCScan, student, scanStatus: studentScanStatus, resetStudent } = useMedicalRecords();
  const [manualNfcId, setManualNfcId] = useState('');

  useEffect(() => {
    // Set up real-time listener for all records
    const unsubscribe = subscribeToRecords();
    
    // Clean up the listener when component unmounts
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [studentFilter]);

  useEffect(() => {
    if (lastScannedId && nfcScanStatus === 'success') {
      handleStudentScan(lastScannedId);
    }
  }, [lastScannedId, nfcScanStatus]);

  const subscribeToRecords = () => {
    setLoading(true);
    
    // If we have a student filter, subscribe to that student's records
    if (studentFilter) {
      return medicalService.subscribeToStudentMedicalRecords(studentFilter, (studentRecords) => {
        setRecords(studentRecords);
        setLoading(false);
      });
    } 
    // Otherwise, subscribe to all records
    else {
      return medicalService.subscribeToAllMedicalRecords((allRecords) => {
        setRecords(allRecords);
        setLoading(false);
      });
    }
  };

  const handleStudentScan = async (nfcId) => {
    const success = await handleNFCScan(nfcId);
    if (success && student) {
      setStudentFilter(student.id);
    }
  };

  const clearStudentFilter = () => {
    setStudentFilter(null);
    resetStudent();
  };

  const handleDelete = async (recordId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this record?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await deleteDoc(doc(db, 'medicalRecords', recordId));
          message.success('Record deleted successfully');
          // No need to manually refresh - the real-time listener will update the UI
        } catch (error) {
          console.error('Error deleting record:', error);
          message.error('Failed to delete record');
        }
      }
    });
  };

  const showRecordDetails = (record) => {
    setSelectedRecord(record);
    setViewModalVisible(true);
  };

  // Handle manual NFC ID input
  const handleManualNfcSubmit = async () => {
    if (!manualNfcId.trim()) {
      message.error('Please enter a valid NFC ID');
      return;
    }

    // Try different formats of the NFC ID
    const formattedId = formatNfcId(manualNfcId.trim());
    await handleStudentScan(formattedId);
  };

  // Format NFC ID to try different variations
  const formatNfcId = (id) => {
    // Remove any prefixes and underscores to get the base ID
    const baseId = id.replace(/^(nfc[_-]?)/i, '').toUpperCase();
    
    // Return the original input - the hook will try different formats
    return baseId;
  };

  const filteredRecords = records.filter(record => {
    const searchLower = searchText.toLowerCase();
    return (
      record.patientName?.toLowerCase().includes(searchLower) ||
      record.patientId?.toLowerCase().includes(searchLower) ||
      record.diagnosis?.toLowerCase().includes(searchLower) ||
      record.doctorName?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: 'Patient Name',
      dataIndex: 'patientName',
      key: 'patientName',
      sorter: (a, b) => a.patientName.localeCompare(b.patientName),
    },
    {
      title: 'Patient ID',
      dataIndex: 'patientId',
      key: 'patientId',
    },
    {
      title: 'Visit Date',
      dataIndex: 'visitDate',
      key: 'visitDate',
      render: date => date?.toLocaleDateString(),
      sorter: (a, b) => a.visitDate - b.visitDate,
    },
    {
      title: 'Doctor',
      dataIndex: 'doctorName',
      key: 'doctorName',
    },
    {
      title: 'Diagnosis',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      ellipsis: {
        showTitle: false,
      },
      render: diagnosis => (
        <Tooltip placement="topLeft" title={diagnosis}>
          {diagnosis}
        </Tooltip>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: department => department ? <Tag color="blue">{department}</Tag> : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => showRecordDetails(record)}
            type="primary"
            size="small"
          />
          <Button 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
            type="primary"
            danger
            size="small"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="medical-history-container">
      <div style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Input
              placeholder="Search records by patient name, ID, diagnosis or doctor"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 400 }}
            />
          </Col>
          <Col>
            <Button 
              icon={<ScanOutlined />}
              onClick={scanning ? stopScan : startScan}
              loading={scanning || studentScanStatus === 'scanning'}
            >
              {scanning ? 'Cancel Scan' : 'Scan Student Card'}
            </Button>
          </Col>
          <Col>
            <Input.Group compact>
              <Input 
                style={{ width: 200 }} 
                placeholder="Enter NFC ID manually"
                value={manualNfcId}
                onChange={(e) => setManualNfcId(e.target.value)}
                onPressEnter={handleManualNfcSubmit}
              />
              <Button 
                type="primary" 
                onClick={handleManualNfcSubmit}
                loading={studentScanStatus === 'scanning'}
              >
                Go
              </Button>
            </Input.Group>
          </Col>
          {studentFilter && (
            <Col>
              <Tag color="blue" closable onClose={clearStudentFilter}>
                Filtered by Student: {student?.name}
              </Tag>
            </Col>
          )}
        </Row>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredRecords}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="Medical Record Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedRecord && (
          <div>
            <h3>{selectedRecord.patientName} (ID: {selectedRecord.patientId})</h3>
            <p><strong>Gender:</strong> {selectedRecord.patientGender}</p>
            <p><strong>Visit Date:</strong> {selectedRecord.visitDate?.toLocaleDateString()}</p>
            <p><strong>Doctor:</strong> {selectedRecord.doctorName}</p>
            <p><strong>Department:</strong> {selectedRecord.department || 'N/A'}</p>
            <p><strong>Diagnosis:</strong> {selectedRecord.diagnosis}</p>
            
            <h4>Treatment/Prescription</h4>
            <p>{selectedRecord.treatment || 'No treatment recorded'}</p>
            
            <h4>Additional Notes</h4>
            <p>{selectedRecord.notes || 'No additional notes'}</p>
            
            {selectedRecord.createdAt && (
              <p><small>Record created on: {selectedRecord.createdAt.toLocaleString()}</small></p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default MedicalHistory;