import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Alert,
  Space,
  Result,
  Typography,
  Spin,
  message,
  Row,
  Col,
  Tag,
  Descriptions,
  Modal,
  Select
} from 'antd';
import {
  ScanOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  LoadingOutlined,
  ExportOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useNFCScanner } from '../../hooks/useNFCScanner';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

function ExamAttendanceScanner() {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [student, setStudent] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [exams, setExams] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [accessType, setAccessType] = useState(null);
  const [error, setError] = useState(null);

  const { startScan, stopScan, scanning, lastScannedId, scanStatus } = useNFCScanner();

  // Fetch available exams
  useEffect(() => {
    fetchExams();
  }, []);

  // Handle NFC scan result
  useEffect(() => {
    if (lastScannedId && scanStatus === 'success') {
      handleNFCScan(lastScannedId);
    }
  }, [lastScannedId, scanStatus]);

  const fetchExams = async () => {
    try {
      const today = dayjs().startOf('day');
      const tomorrow = dayjs().endOf('day');
      const examsRef = collection(db, 'Exams');
      const examQuery = query(
        examsRef,
        where('examDate', '>=', today.toDate()),
        where('examDate', '<=', tomorrow.toDate())
      );
      
      const querySnapshot = await getDocs(examQuery);
      const examList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (examList.length === 0) {
        message.info('No exams scheduled for today');
      }
      
      setExams(examList);
    } catch (error) {
      console.error('Error fetching exams:', error);
      message.error('Failed to fetch exams');
    }
  };

  const handleNFCScan = async (nfcId) => {
    if (!selectedExam) {
      message.error('Please select an exam first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Find student by NFC ID
      const studentsRef = collection(db, 'students');
      const studentQuery = query(studentsRef, where('nfcTagId', '==', nfcId));
      const studentSnapshot = await getDocs(studentQuery);

      if (studentSnapshot.empty) {
        setError('No student found with this ID card.');
        return;
      }

      const studentData = {
        id: studentSnapshot.docs[0].id,
        ...studentSnapshot.docs[0].data()
      };

      // Verify student is registered for the exam
      const registrationRef = collection(db, 'examRegistrations');
      const regQuery = query(
        registrationRef,
        where('studentId', '==', studentData.id),
        where('examId', '==', selectedExam.id)
      );
      const regSnapshot = await getDocs(regQuery);

      if (regSnapshot.empty) {
        setError(`${studentData.name} is not registered for this exam.`);
        return;
      }

      // Check for existing attendance record
      const attendanceRef = collection(db, 'examAttendance');
      const attQuery = query(
        attendanceRef,
        where('studentId', '==', studentData.id),
        where('examId', '==', selectedExam.id)
      );
      const attSnapshot = await getDocs(attQuery);

      let attendanceRecord = attSnapshot.docs[0]?.data();
      let isCheckIn = !attendanceRecord || !attendanceRecord.checkInTime;

      if (attendanceRecord && attendanceRecord.checkOutTime) {
        setError(`${studentData.name} has already completed this exam.`);
        return;
      }

      setStudent(studentData);
      setAccessType(isCheckIn ? 'check-in' : 'check-out');
      setCurrentStep(1);

    } catch (error) {
      console.error('Error processing scan:', error);
      setError('Failed to process scan. Please try again.');
    } finally {
      setLoading(false);
      stopScan();
    }
  };

  const handleConfirmAttendance = async () => {
    setLoading(true);
    try {
      const attendanceRef = collection(db, 'examAttendance');
      const now = Timestamp.now();

      if (accessType === 'check-in') {
        await addDoc(attendanceRef, {
          studentId: student.id,
          studentName: student.name,
          examId: selectedExam.id,
          examTitle: selectedExam.courseName,
          checkInTime: now,
          status: 'in-progress'
        });
      } else {
        const attQuery = query(
          attendanceRef,
          where('studentId', '==', student.id),
          where('examId', '==', selectedExam.id)
        );
        const attSnapshot = await getDocs(attQuery);
        
        if (!attSnapshot.empty) {
          await updateDoc(doc(attendanceRef, attSnapshot.docs[0].id), {
            checkOutTime: now,
            status: 'completed'
          });
        }
      }

      setCurrentStep(2);
      setScanResult({
        status: 'success',
        message: `${student.name} has been ${accessType === 'check-in' ? 'checked in to' : 'checked out from'} the exam.`
      });

    } catch (error) {
      console.error('Error recording attendance:', error);
      setError('Failed to record attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportAttendance = async () => {
    try {
      const attendanceRef = collection(db, 'examAttendance');
      const attQuery = query(attendanceRef, where('examId', '==', selectedExam.id));
      const attSnapshot = await getDocs(attQuery);

      const records = attSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          'Student Name': data.studentName,
          'Matric Number': data.studentId,
          'Exam Title': data.examTitle,
          'Check-in Time': data.checkInTime?.toDate().toLocaleString() || 'N/A',
          'Check-out Time': data.checkOutTime?.toDate().toLocaleString() || 'N/A',
          'Status': data.status
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(records);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
      XLSX.writeFile(workbook, `${selectedExam.courseName}_Attendance.xlsx`);

    } catch (error) {
      console.error('Error exporting attendance:', error);
      message.error('Failed to export attendance records');
    }
  };

  const resetScanner = () => {
    setCurrentStep(0);
    setStudent(null);
    setAccessType(null);
    setScanResult(null);
    setError(null);
  };

  return (
    <Card title="Exam Attendance Scanner">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Row gutter={16}>
          <Col span={12}>
            <Select
              style={{ width: '100%' }}
              placeholder={exams.length > 0 ? "Select Exam" : "No exams scheduled for today"}
              onChange={(value) => {
                setSelectedExam(exams.find(exam => exam.id === value));
                resetScanner();
              }}
              disabled={scanning || loading || exams.length === 0}
            >
              {exams.map(exam => (
                <Option key={exam.id} value={exam.id}>
                  {exam.courseName} - {dayjs(exam.examDate.toDate()).format('HH:mm')}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={12}>
            <Space>
              <Button
                type="primary"
                icon={<ScanOutlined />}
                onClick={() => startScan()}
                disabled={!selectedExam || scanning || loading}
              >
                Start Scanning
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={exportAttendance}
                disabled={!selectedExam || loading}
              >
                Export Attendance
              </Button>
            </Space>
          </Col>
        </Row>

        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}

        <AnimatePresence mode="wait">
          {currentStep === 1 && student && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <Row gutter={24}>
                  <Col span={8}>
                    <div style={{ 
                      width: '100%',
                      maxWidth: 200,
                      margin: '0 auto',
                      textAlign: 'center'
                    }}>
                      {student.profileImage?.data ? (
                        <img
                          src={student.profileImage.data}
                          alt={student.name}
                          style={{
                            width: '100%',
                            borderRadius: '8px',
                            marginBottom: '16px'
                          }}
                        />
                      ) : (
                        <UserOutlined style={{ fontSize: 64 }} />
                      )}
                    </div>
                  </Col>
                  <Col span={16}>
                    <Descriptions title="Student Information" column={1}>
                      <Descriptions.Item label="Name">{student.name}</Descriptions.Item>
                      <Descriptions.Item label="Matric Number">{student.schoolId}</Descriptions.Item>
                      <Descriptions.Item label="Exam">{selectedExam.courseName}</Descriptions.Item>
                      <Descriptions.Item label="Action">
                        <Tag color={accessType === 'check-in' ? 'green' : 'red'}>
                          {accessType === 'check-in' ? 'Check In' : 'Check Out'}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>

                    <Space style={{ marginTop: 24 }}>
                      <Button onClick={resetScanner}>Cancel</Button>
                      <Button
                        type="primary"
                        onClick={handleConfirmAttendance}
                        loading={loading}
                      >
                        Confirm {accessType === 'check-in' ? 'Check In' : 'Check Out'}
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </motion.div>
          )}

          {currentStep === 2 && scanResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Result
                status={scanResult.status}
                title={scanResult.message}
                extra={[
                  <Button type="primary" key="done" onClick={resetScanner}>
                    Done
                  </Button>
                ]}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Space>
    </Card>
  );
}

export default ExamAttendanceScanner; 