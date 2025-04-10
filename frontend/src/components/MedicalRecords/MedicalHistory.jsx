import React, { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Modal, message, Tag, Tooltip, Row, Col } from 'antd';
import { SearchOutlined, DeleteOutlined, EyeOutlined, ScanOutlined, UserOutlined, ExportOutlined } from '@ant-design/icons';
import { deleteDoc, doc, collection, query, where, getDocs, orderBy, getFirestore } from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';
import { useNFCScanner } from '../../hooks/useNFCScanner';
import { medicalService } from '../../utils/firebase/medicalService';
import { studentService } from '../../utils/firebase/studentService';
import * as XLSX from 'xlsx';

function MedicalHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [studentFilter, setStudentFilter] = useState(null);
  const [student, setStudent] = useState(null);
  const [manualNfcId, setManualNfcId] = useState('');
  const [processing, setProcessing] = useState(false);

  // Use the enhanced NFC scanner hook
  const { startScan, stopScan, scanning, lastScannedId, scanStatus, clearLastScannedId, setScanning } = useNFCScanner();

  // Set up data fetching
  useEffect(() => {
    fetchMedicalRecords();
  }, [studentFilter]);

  // Handle scanned IDs
  useEffect(() => {
    // Log values for debugging
    console.log("Medical history values:", { scanning, lastScannedId, scanStatus });

    // Only process when we have a successful scan
    if (scanStatus === 'success' && lastScannedId) {
      console.log("Medical history processing ID:", lastScannedId);
      
      // Stop scanning first
      stopScan();
      
      // Process the scanned ID
      handleStudentScan(lastScannedId);
    }
  }, [scanStatus, lastScannedId, stopScan]);

  // Add debugging for WebSocket connection
  useEffect(() => {
    console.log('Medical history - NFC scan status:', scanStatus);
    console.log('Medical history - Last scanned ID:', lastScannedId);
  }, [scanStatus, lastScannedId]);

  const fetchMedicalRecords = async () => {
    setLoading(true);
    try {
      console.log("Fetching medical records", studentFilter ? `for student ${studentFilter}` : "for all students");
      
      let recordsQuery;
      
      if (studentFilter) {
        // If we have a student filter, get only that student's records
        recordsQuery = query(
          collection(db, 'medicalRecords'),
          where('patientId', '==', studentFilter),
          orderBy('visitDate', 'desc')
        );
      } else {
        // Otherwise, get all records
        recordsQuery = query(
          collection(db, 'medicalRecords'),
          orderBy('visitDate', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(recordsQuery);
      console.log(`Found ${querySnapshot.size} medical records`);
      
      const fetchedRecords = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Convert timestamps to dates
        const visitDate = data.visitDate?.toDate ? data.visitDate.toDate() : new Date(data.visitDate);
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        
        fetchedRecords.push({
          id: doc.id,
          ...data,
          visitDate,
          createdAt
        });
      });
      
      const enrichedRecords = await enrichWithStudentData(fetchedRecords);
      setRecords(enrichedRecords);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      message.error('Failed to fetch medical records');
    } finally {
      setLoading(false);
    }
  };

  const enrichWithStudentData = async (records) => {
    if (!records.length) return records;
    
    const studentIds = records.map(record => record.patientId).filter(Boolean);
    if (!studentIds.length) return records;
    
    try {
      const db = getFirestore();
      const studentsRef = collection(db, "students");
      const uniqueIds = [...new Set(studentIds)];
      
      const studentSnapshots = await Promise.all(
        uniqueIds.map(async (studentId) => {
          const studentQuery = query(studentsRef, where("__name__", "==", studentId));
          const snapshot = await getDocs(studentQuery);
          return snapshot.empty ? null : { id: studentId, ...snapshot.docs[0].data() };
        })
      );
      
      const studentDataMap = studentSnapshots.reduce((map, student) => {
        if (student) map[student.id] = student;
        return map;
      }, {});
      
      return records.map(record => ({
        ...record,
        profileImage: studentDataMap[record.patientId]?.profileImage || null
      }));
    } catch (error) {
      console.error("Error fetching student data:", error);
      return records;
    }
  };

  const handleStudentScan = async (nfcId) => {
    setProcessing(true);
    
    try {
      console.log("Processing scan in history with ID:", nfcId);
      
      // Find student by NFC ID
      let foundStudent;
      try {
        foundStudent = await studentService.getStudentByNfcId(nfcId);
        console.log("Student lookup result in history:", foundStudent);
      } catch (err) {
        console.error('Error fetching student:', err);
        message.error('Failed to fetch student data');
        setProcessing(false);
        return;
      }
      
      if (!foundStudent) {
        console.log(`No student found with ID: ${nfcId}`);
        message.error(`No student found with ID: ${nfcId}`);
        setProcessing(false);
        return;
      }
      
      console.log("Student found in history:", foundStudent);
      
      // Check if student has medical access permission
      if (!foundStudent.permissions?.medical) {
        console.log(`${foundStudent.name} does not have medical access permissions`);
        message.warning(`${foundStudent.name} does not have medical access permissions`);
        setProcessing(false);
        return;
      }
      
      // Set the student and filter
      console.log("Setting student in history state:", foundStudent.name);
      setStudent(foundStudent);
      setStudentFilter(foundStudent.id);
      message.success(`Showing medical records for ${foundStudent.name}`);
    } catch (err) {
      console.error('Error processing scan:', err);
      message.error('Failed to process scan');
    } finally {
      setProcessing(false);
    }
  };

  const clearStudentFilter = () => {
    setStudentFilter(null);
    setStudent(null);
    clearLastScannedId();
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
          fetchMedicalRecords(); // Refresh the records
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

    handleStudentScan(manualNfcId.trim());
    setManualNfcId('');
  };

  // Start a new scan process
  const handleStartScan = () => {
    clearLastScannedId(); // Clear previous ID
    startScan();
  };

  // Export to Excel function
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Medical Records');
    XLSX.writeFile(workbook, 'Medical_Records.xlsx');
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
      title: "Photo",
      key: "photo",
      width: 60,
      render: (_, record) => (
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: '50%',
          overflow: 'hidden',
          background: '#f0f2f5',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {record.profileImage?.data ? (
            <img 
              src={record.profileImage.data}
              alt={record.patientName || record.patientId}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<span class="anticon anticon-user" style="font-size: 20px; color: #1890ff;"></span>';
              }}
            />
          ) : (
            <UserOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          )}
        </div>
      )
    },
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
              icon={<ExportOutlined />}
              onClick={exportToExcel}
              type="primary"
            >
              Export to Excel
            </Button>
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