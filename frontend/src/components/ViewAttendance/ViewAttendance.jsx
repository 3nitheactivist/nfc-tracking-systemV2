// import React, { useState, useEffect } from 'react';
// import { Layout, Card, Table, Button, Select, Badge, Alert, Modal, Spin } from 'antd';
// import { useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import { ScanOutlined, HistoryOutlined } from '@ant-design/icons';
// import {
//   getFirestore,
//   collection,
//   query,
//   where,
//   onSnapshot,
//   addDoc,
//   doc,
//   getDocs
// } from 'firebase/firestore';
// import useAuth from '../../utils/config/useAuth';

// const { Content } = Layout;
// const { Option } = Select;

// const AttendanceVerification = () => {
//   const navigate = useNavigate();
//   const { currentUser } = useAuth();
//   const db = getFirestore();

//   // Local states
//   const [isScanning, setIsScanning] = useState(false);
//   const [selectedExam, setSelectedExam] = useState(null);
//   const [attendanceRecords, setAttendanceRecords] = useState([]);
//   const [currentStudent, setCurrentStudent] = useState(null);
//   const [showHistory, setShowHistory] = useState(false);
//   const [nfcSupported, setNfcSupported] = useState(false);
//   const [nfcReader, setNfcReader] = useState(null);

//   // Styles (using your provided design)
//   const styles = {
//     container: {
//       padding: '20px',
//       maxWidth: '1200px',
//       margin: '0 auto',
//     },
//     header: {
//       display: 'flex',
//       justifyContent: 'space-between',
//       alignItems: 'center',
//       marginBottom: '20px',
//       flexWrap: 'wrap',
//       gap: '10px',
//     },
//     scannerCard: {
//       textAlign: 'center',
//       padding: '24px',
//       marginBottom: '24px',
//       borderRadius: '8px',
//       boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//     },
//     statusBadge: {
//       marginBottom: '16px',
//     },
//     studentInfo: {
//       marginTop: '16px',
//       padding: '16px',
//       backgroundColor: '#f5f5f5',
//       borderRadius: '8px',
//     },
//   };

//   // Back button handler
//   const handleBack = () => {
//     navigate(-1);
//   };

//   // Check if NFC is supported
//   useEffect(() => {
//     if ('NDEFReader' in window) {
//       setNfcSupported(true);
//     }
//   }, []);

//   // Listen for attendance records unique to the user
//   useEffect(() => {
//     if (!currentUser) return;
//     const attendanceRef = collection(db, 'AttendanceRecords');
//     const q = query(attendanceRef, where("verifiedBy", "==", currentUser.uid));
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//       setAttendanceRecords(records);
//     }, (error) => {
//       console.error("Error fetching attendance records:", error);
//     });
//     return () => unsubscribe();
//   }, [db, currentUser]);

//   // Initialize NFC (for testing, using mock functionality)
//   const initializeNFC = async () => {
//     try {
//       // In a real scenario, you'd create a new NDEFReader instance.
//       // For testing, we'll simply simulate scanning.
//       setIsScanning(true);
//       // Simulate a delay before "reading"
//       setTimeout(() => {
//         // Call handleNFCRead with a mock tag ID
//         handleNFCRead("MOCK_NFC_12345");
//       }, 1500);
//     } catch (error) {
//       console.error("Error initializing NFC:", error);
//       Modal.error({
//         title: "NFC Error",
//         content: "Failed to initialize NFC scanner. Please ensure NFC is enabled on your device.",
//       });
//     }
//   };

//   // Handle a mock NFC read
//   const handleNFCRead = async (tagId) => {
//     if (!selectedExam) {
//       Modal.warning({
//         title: "No Exam Selected",
//         content: "Please select an exam before scanning.",
//       });
//       return;
//     }

//     // For testing, create a mock student record using the tag
//     const mockStudent = {
//       id: "student123",
//       name: "John Doe",
//       studentId: "STU001",
//       nfcTag: tagId,
//     };

//     // Check uniqueness: make sure this student isn't already marked for this exam
//     const attendanceRef = collection(db, "AttendanceRecords");
//     const q = query(
//       attendanceRef,
//       where("examId", "==", selectedExam),
//       where("studentId", "==", mockStudent.id)
//     );
//     const snapshot = await getDocs(q);
//     if (!snapshot.empty) {
//       Modal.warning({
//         title: "Duplicate Entry",
//         content: `${mockStudent.name} has already been marked for this exam.`,
//       });
//       return;
//     }

//     // Create a new attendance record in Firestore
//     try {
//       const newRecord = {
//         examId: selectedExam,
//         studentId: mockStudent.id,
//         timestamp: new Date(),
//         status: "present",
//         verifiedBy: currentUser.uid,
//       };
//       await addDoc(collection(db, "AttendanceRecords"), newRecord);
//       setCurrentStudent(mockStudent);
//       Modal.success({
//         title: "Attendance Recorded",
//         content: `Successfully recorded attendance for ${mockStudent.name}.`,
//       });
//     } catch (error) {
//       console.error("Error recording attendance:", error);
//       Modal.error({
//         title: "Error",
//         content: "Failed to record attendance.",
//       });
//     }
//   };

//   const toggleScanner = () => {
//     if (!isScanning) {
//       initializeNFC();
//     } else {
//       setIsScanning(false);
//       setNfcReader(null);
//     }
//   };

//   // Define columns for the attendance history table
//   const columns = [
//     {
//       title: "Student ID",
//       dataIndex: "studentId",
//       key: "studentId",
//     },
//     {
//       title: "Time",
//       dataIndex: "timestamp",
//       key: "timestamp",
//       render: (text) => new Date(text).toLocaleTimeString(),
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       key: "status",
//     },
//   ];

//   // Modal for viewing attendance history
//   const AttendanceHistory = () => (
//     <Modal
//       title="Attendance History"
//       open={showHistory}
//       onCancel={() => setShowHistory(false)}
//       width={800}
//       footer={null}
//     >
//       <Table dataSource={attendanceRecords} columns={columns} rowKey="id" />
//     </Modal>
//   );

//   return (
//     <Layout>
//       <Content style={styles.container}>
//         {/* Back Button */}
//         <Button onClick={handleBack} style={{ marginBottom: "20px" }}>
//           Back
//         </Button>
//         <motion.div
//           initial={{ y: -20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ duration: 0.5 }}
//         >
//           <div style={styles.header}>
//             <h1>Attendance Verification</h1>
//             <Button
//               type="primary"
//               icon={<HistoryOutlined />}
//               onClick={() => setShowHistory(true)}
//             >
//               View History
//             </Button>
//           </div>

//           {!nfcSupported && (
//             <Alert
//               message="NFC Not Supported"
//               description="Your device does not support NFC scanning. Please use a compatible device."
//               type="error"
//               showIcon
//               style={{ marginBottom: "20px" }}
//             />
//           )}

//           <Card style={{ marginBottom: "24px" }}>
//             <Select
//               style={{ width: "100%", marginBottom: "20px" }}
//               placeholder="Select Exam"
//               onChange={setSelectedExam}
//             >
//               {/** Use real exam data when available. For now, using mock data: */}
//               {[
//                 { id: "1", name: "Mathematics Final", date: "2024-02-22 10:00" },
//                 { id: "2", name: "Physics Midterm", date: "2024-02-23 14:00" },
//               ].map((exam) => (
//                 <Option key={exam.id} value={exam.id}>
//                   {exam.name} - {exam.date}
//                 </Option>
//               ))}
//             </Select>

//             <Badge
//               status={isScanning ? "processing" : "default"}
//               text={isScanning ? "Scanner Active" : "Scanner Inactive"}
//               style={{ marginBottom: "16px" }}
//             />

//             <Button
//               type="primary"
//               icon={<ScanOutlined />}
//               onClick={toggleScanner}
//               disabled={!nfcSupported || !selectedExam}
//             >
//               {isScanning ? "Stop Scanning" : "Start Scanning"}
//             </Button>

//             {isScanning && (
//               <div style={{ marginTop: "20px" }}>
//                 <Spin tip="Waiting for NFC tag..." />
//               </div>
//             )}

//             {currentStudent && (
//               <Card style={styles.studentInfo}>
//                 <h3>Last Scanned Student</h3>
//                 <p>Name: {currentStudent.name}</p>
//                 <p>Student ID: {currentStudent.studentId}</p>
//                 <p>Time: {new Date().toLocaleTimeString()}</p>
//               </Card>
//             )}
//           </Card>

//           <Card title="Today's Attendance">
//             <Table dataSource={attendanceRecords} columns={columns} rowKey="id" />
//           </Card>
//         </motion.div>

//         <AttendanceHistory />
//       </Content>
//     </Layout>
//   );
// };

// export default AttendanceVerification;
import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Table,
  Button,
  Select,
  Badge,
  Alert,
  Modal,
  Spin,
} from 'antd';
import { motion } from 'framer-motion';
import { ScanOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import useAuth from '../../utils/config/useAuth';
import moment from 'moment';

const { Content } = Layout;
const { Option } = Select;

const AttendanceVerification = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const db = getFirestore();

  // Local states
  const [isScanning, setIsScanning] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  // For testing, override NFC support to true
  const [nfcSupported, setNfcSupported] = useState(true);
  const [nfcReader, setNfcReader] = useState(null);
  const [examOptions, setExamOptions] = useState([]);

  // Styles (as provided)
  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '10px',
    },
    scannerCard: {
      textAlign: 'center',
      padding: '24px',
      marginBottom: '24px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
    statusBadge: {
      marginBottom: '16px',
    },
    studentInfo: {
      marginTop: '16px',
      padding: '16px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
    },
  };

  // Back button handler
  const handleBack = () => {
    navigate(-1);
  };

  // ------------------------------------------------------------------
  // 1) Fetch Exams from Firestore (for assignment and selection)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser) return;
    const examsRef = collection(db, 'Exams');
    const q = query(examsRef, where("createdBy", "==", currentUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const options = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            label: `${data.courseName} (${data.courseCode}) - ${data.examDate ? moment(data.examDate.toDate()).format("MMM DD, YYYY") : "No date"}`,
            value: docSnap.id,
            examDate: data.examDate, // stored as Timestamp
          };
        });
        setExamOptions(options);
      },
      (error) => {
        console.error("Error fetching exams:", error);
        message.error("Failed to fetch exams.");
      }
    );
    return () => unsubscribe();
  }, [db, currentUser]);

  // ------------------------------------------------------------------
  // 2) Fetch Attendance Records unique to the current user
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser) return;
    const attendanceRef = collection(db, 'AttendanceRecords');
    const q = query(attendanceRef, where("verifiedBy", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendanceRecords(records);
    }, (error) => {
      console.error("Error fetching attendance records:", error);
    });
    return () => unsubscribe();
  }, [db, currentUser]);

  // ------------------------------------------------------------------
  // 3) Initialize NFC (for testing, simulate a scan)
  // ------------------------------------------------------------------
  const initializeNFC = async () => {
    try {
      // For testing, simulate scanning after a delay
      setIsScanning(true);
      setTimeout(() => {
        handleNFCRead("MOCK_NFC_12345");
      }, 1500);
    } catch (error) {
      console.error("Error initializing NFC:", error);
      Modal.error({
        title: "NFC Error",
        content: "Failed to initialize NFC scanner. Please ensure NFC is enabled on your device.",
      });
    }
  };

  // ------------------------------------------------------------------
  // 4) Handle NFC Read – with conditional check on exam date
  // ------------------------------------------------------------------
  const handleNFCRead = async (tagId) => {
    if (!selectedExam) {
      Modal.warning({
        title: "No Exam Selected",
        content: "Please select an exam before scanning.",
      });
      return;
    }

    // Find the selected exam option from examOptions
    const examOption = examOptions.find((opt) => opt.value === selectedExam);
    if (examOption && examOption.examDate) {
      // Compare only date (ignore time)
      const examDate = moment(examOption.examDate.toDate()).startOf('day');
      const today = moment().startOf('day');
      if (!examDate.isSame(today)) {
        Modal.warning({
          title: "Exam Not Scheduled Today",
          content: "The selected exam isn't scheduled for today.",
        });
        return;
      }
    }

    // For testing, create a mock student record
    const mockStudent = {
      id: "student123",
      name: "John Doe",
      studentId: "STU001",
      nfcTag: tagId,
    };

    // Check if attendance already exists for this exam and student
    const attendanceRef = collection(db, "AttendanceRecords");
    const q = query(
      attendanceRef,
      where("examId", "==", selectedExam),
      where("studentId", "==", mockStudent.id)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      Modal.warning({
        title: "Duplicate Entry",
        content: `${mockStudent.name} has already been marked for this exam.`,
      });
      return;
    }

    // Record attendance in Firestore (ensure uniqueness)
    try {
      const newRecord = {
        examId: selectedExam,
        studentId: mockStudent.id,
        timestamp: new Date(),
        status: "present",
        verifiedBy: currentUser.uid,
      };
      await addDoc(collection(db, "AttendanceRecords"), newRecord);
      setCurrentStudent(mockStudent);
      Modal.success({
        title: "Attendance Recorded",
        content: `Successfully recorded attendance for ${mockStudent.name}.`,
      });
    } catch (error) {
      console.error("Error recording attendance:", error);
      Modal.error({
        title: "Error",
        content: "Failed to record attendance.",
      });
    }
  };

  const toggleScanner = () => {
    if (!isScanning) {
      initializeNFC();
    } else {
      setIsScanning(false);
      setNfcReader(null);
    }
  };

  // ------------------------------------------------------------------
  // 5) Define columns for the attendance history table
  // ------------------------------------------------------------------
  const columns = [
    {
      title: "Student ID",
      dataIndex: "studentId",
      key: "studentId",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (text) => new Date(text).toLocaleTimeString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
  ];

  // ------------------------------------------------------------------
  // 6) Attendance History Modal
  // ------------------------------------------------------------------
  const AttendanceHistory = () => (
    <Modal
      title="Attendance History"
      open={showHistory}
      onCancel={() => setShowHistory(false)}
      width={800}
      footer={null}
    >
      <Table dataSource={attendanceRecords} columns={columns} rowKey="id" />
    </Modal>
  );

  return (
    <Layout>
      <Content style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <Button onClick={handleBack} style={{ marginBottom: "20px" }}>
          Back
        </Button>
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div style={styles.header}>
            <h1>Attendance Verification</h1>
            <Button
              type="primary"
              icon={<HistoryOutlined />}
              onClick={() => setShowHistory(true)}
            >
              View History
            </Button>
          </div>

          {/* Optionally hide the NFC Not Supported alert for testing */}
          {!nfcSupported && (
            <Alert
              message="NFC Not Supported"
              description="Your device does not support NFC scanning. Please use a compatible device."
              type="error"
              showIcon
              style={{ marginBottom: "20px" }}
            />
          )}

          <Card style={styles.scannerCard}>
            <Select
              style={{ width: "100%", marginBottom: "20px" }}
              placeholder="Select Exam"
              onChange={(value) => setSelectedExam(value)}
              value={selectedExam}
            >
              {examOptions.map((exam) => (
                <Option key={exam.value} value={exam.value}>
                  {exam.label}
                </Option>
              ))}
            </Select>

            <Badge
              status={isScanning ? "processing" : "default"}
              text={isScanning ? "Scanner Active" : "Scanner Inactive"}
              style={{ marginBottom: "16px" }}
            />

            <div>
              <Button
                type="primary"
                icon={<ScanOutlined />}
                onClick={toggleScanner}
                disabled={!nfcSupported || !selectedExam}
              >
                {isScanning ? "Stop Scanning" : "Start Scanning"}
              </Button>
            </div>

            {isScanning && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ marginTop: "20px" }}
              >
                <Spin tip="Waiting for NFC tag..." />
              </motion.div>
            )}

            {currentStudent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={styles.studentInfo}
              >
                <h3>Last Scanned Student</h3>
                <p>Name: {currentStudent.name}</p>
                <p>Student ID: {currentStudent.studentId}</p>
                <p>Time: {new Date().toLocaleTimeString()}</p>
              </motion.div>
            )}
          </Card>

          <Card title="Today's Attendance">
            <Table dataSource={attendanceRecords} columns={columns} rowKey="id" />
          </Card>
        </motion.div>

        <AttendanceHistory />
      </Content>
    </Layout>
  );
};

export default AttendanceVerification;
