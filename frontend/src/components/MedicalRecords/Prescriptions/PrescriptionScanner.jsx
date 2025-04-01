import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Alert, Space, Result, Typography, 
  Spin, List, Tag, Modal 
} from 'antd';
import { 
  ScanOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  ReloadOutlined, MedicineBoxOutlined 
} from '@ant-design/icons';
import { useNFCScanner } from '../../../hooks/useNFCScanner';
import { 
  collection, query, where, getDocs, updateDoc, 
  doc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../utils/firebase/firebase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function PrescriptionScanner() {
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [student, setStudent] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // NFC scanner integration
  const { startScan, stopScan, scanning, lastScannedId, scanStatus } = useNFCScanner();

  // Reset states
  const resetStates = () => {
    setScanResult(null);
    setStudent(null);
    setPrescriptions([]);
    setSelectedPrescription(null);
  };

  // Handle NFC scan result
  useEffect(() => {
    if (lastScannedId && scanStatus === 'success') {
      handleNFCScan(lastScannedId);
    }
  }, [lastScannedId, scanStatus]);

  // Handle NFC scan
  const handleNFCScan = async (nfcId) => {
    try {
      setLoading(true);
      
      // Find student by NFC ID
      const studentsRef = collection(db, 'students');
      const studentQuery = query(studentsRef, where('nfcTagId', '==', nfcId));
      const studentSnapshot = await getDocs(studentQuery);
      
      if (studentSnapshot.empty) {
        setScanResult({
          status: 'error',
          title: 'Student Not Found',
          message: 'No student found with this ID card.'
        });
        return;
      }

      const studentData = {
        id: studentSnapshot.docs[0].id,
        ...studentSnapshot.docs[0].data()
      };
      setStudent(studentData);

      // Find pending prescriptions for the student
      const prescriptionsRef = collection(db, 'medical_prescriptions');
      const prescriptionQuery = query(
        prescriptionsRef,
        where('studentId', '==', studentData.id),
        where('status', '==', 'pending')
      );
      
      const prescriptionSnapshot = await getDocs(prescriptionQuery);
      
      if (prescriptionSnapshot.empty) {
        setScanResult({
          status: 'warning',
          title: 'No Pending Prescriptions',
          message: 'No pending prescriptions found for collection.'
        });
        return;
      }

      // Get all pending prescriptions
      const pendingPrescriptions = prescriptionSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPrescriptions(pendingPrescriptions);
      setScanResult({
        status: 'success',
        title: 'Prescriptions Found',
        message: `${pendingPrescriptions.length} pending prescription(s) found for ${studentData.name}.`
      });

    } catch (error) {
      console.error('Error processing NFC scan:', error);
      setScanResult({
        status: 'error',
        title: 'Scan Failed',
        message: 'An error occurred while processing your scan. Please try again.'
      });
    } finally {
      setLoading(false);
      stopScan();
    }
  };

  // Handle prescription collection
  const handleCollectPrescription = async (prescription) => {
    try {
      setLoading(true);
      
      // Update prescription status
      await updateDoc(doc(db, 'medical_prescriptions', prescription.id), {
        status: 'collected',
        collectionDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Remove collected prescription from the list
      setPrescriptions(prev => prev.filter(p => p.id !== prescription.id));
      
      setScanResult({
        status: 'success',
        title: 'Prescription Collected',
        message: 'The prescription has been marked as collected.'
      });

    } catch (error) {
      console.error('Error collecting prescription:', error);
      setScanResult({
        status: 'error',
        title: 'Collection Failed',
        message: 'Failed to mark prescription as collected. Please try again.'
      });
    } finally {
      setLoading(false);
      setIsModalVisible(false);
    }
  };

  // Handle new scan
  const handleNewScan = () => {
    resetStates();
    startScan();
  };

  // Show prescription details
  const showPrescriptionDetails = (prescription) => {
    setSelectedPrescription(prescription);
    setIsModalVisible(true);
  };

  return (
    <Card title="Prescription Collection Scanner">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Scanner Status */}
        <Alert
          message="Scan student ID card to check prescriptions"
          type="info"
          showIcon
        />

        {/* Scan Button */}
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <Space>
            <Button
              type="primary"
              icon={<ScanOutlined />}
              size="large"
              onClick={handleNewScan}
              loading={scanning}
              disabled={scanning}
            >
              {scanning ? 'Scanning...' : 'Start Scan'}
            </Button>
            
            <Button
              icon={<ReloadOutlined />}
              onClick={resetStates}
              disabled={scanning}
            >
              Reset
            </Button>
          </Space>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Processing...</div>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <Result
            status={scanResult.status}
            title={scanResult.title}
            subTitle={scanResult.message}
            icon={scanResult.status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          />
        )}

        {/* Student Details and Prescriptions */}
        {student && prescriptions.length > 0 && (
          <Card size="small" title="Pending Prescriptions">
            <List
              itemLayout="horizontal"
              dataSource={prescriptions}
              renderItem={prescription => (
                <List.Item
                  actions={[
                    <Button 
                      type="primary"
                      onClick={() => showPrescriptionDetails(prescription)}
                    >
                      Collect
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<MedicineBoxOutlined style={{ fontSize: 24 }} />}
                    title={`Prescription from ${dayjs(prescription.prescriptionDate.toDate()).format('YYYY-MM-DD')}`}
                    description={
                      <Space direction="vertical">
                        <Text>Medications: {prescription.medications.length}</Text>
                        <Text>Expires: {prescription.expiryDate}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Prescription Details Modal */}
        <Modal
          title="Confirm Prescription Collection"
          visible={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsModalVisible(false)}>
              Cancel
            </Button>,
            <Button
              key="collect"
              type="primary"
              onClick={() => handleCollectPrescription(selectedPrescription)}
              loading={loading}
            >
              Confirm Collection
            </Button>
          ]}
          width={700}
        >
          {selectedPrescription && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={5}>Medications</Title>
              {selectedPrescription.medications.map((med, index) => (
                <Card size="small" key={index} style={{ marginBottom: 8 }}>
                  <Text strong>{med.name}</Text>
                  <br />
                  <Text>Dosage: {med.dosage}</Text>
                  <br />
                  <Text>Instructions: {med.instructions}</Text>
                </Card>
              ))}

              {selectedPrescription.additionalInstructions && (
                <>
                  <Title level={5}>Additional Instructions</Title>
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

export default PrescriptionScanner; 