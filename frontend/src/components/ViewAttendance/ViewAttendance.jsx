import React, { useState, useEffect, useRef } from "react";
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
  message,
} from "antd";
import { motion } from "framer-motion";
import { ScanOutlined, HistoryOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  getDocs,
} from "firebase/firestore";
import useAuth from "../../utils/config/useAuth";
import moment from "moment";

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
  const [nfcSupported, setNfcSupported] = useState(true);
  const [examOptions, setExamOptions] = useState([]);
  const [filterExam, setFilterExam] = useState(null);
  const [filterDate, setFilterDate] = useState(null);

  // Create a ref to store the latest selected exam value
  const selectedExamRef = useRef(selectedExam);

  // Update the ref whenever selectedExam changes
  useEffect(() => {
    selectedExamRef.current = selectedExam;
  }, [selectedExam]);

  // Refs for WebSocket and scanning timeout
  const wsRef = useRef(null);
  const scanningTimeoutRef = useRef(null);
  const scanningStateRef = useRef(false);

  // Styles (as provided)
  const styles = {
    container: {
      padding: "20px",
      maxWidth: "1200px",
      margin: "0 auto",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      flexWrap: "wrap",
      gap: "10px",
    },
    scannerCard: {
      textAlign: "center",
      padding: "24px",
      marginBottom: "24px",
      borderRadius: "8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    },
    statusBadge: {
      marginBottom: "16px",
    },
    studentInfo: {
      marginTop: "16px",
      padding: "16px",
      backgroundColor: "#f5f5f5",
      borderRadius: "8px",
    },
    filterRow: {
      display: "flex",
      gap: "10px",
      marginBottom: "16px",
    },
  };

  // Back button handler
  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (currentUser) {
      console.log("Current user authenticated:", currentUser.uid);
    } else {
      console.log("No user authenticated");
    }
  }, [currentUser]);

  // Add this at the beginning of your component
  useEffect(() => {
    const checkAndRefreshAuth = async () => {
      if (currentUser) {
        try {
          // Force a token refresh
          await currentUser.getIdToken(true);
          console.log("Auth token refreshed");
        } catch (error) {
          console.error("Failed to refresh token:", error);
        }
      }
    };

    checkAndRefreshAuth();
  }, [currentUser]);

  // ------------------------------------------------------------------
  // 1) Fetch Exams from Firestore (for assignment and selection)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser) return;
    const examsRef = collection(db, "Exams");
    const q = query(examsRef, where("createdBy", "==", currentUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const today = moment().startOf("day");
        const options = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data();
            const examMoment = data.examDate
              ? moment(data.examDate.toDate()).startOf("day")
              : null;
            return {
              label: `${data.courseName} (${data.courseCode}) - ${
                examMoment ? examMoment.format("MMM DD, YYYY") : "No date"
              }`,
              value: docSnap.id,
              examDate: data.examDate,
            };
          })
          .filter((option) => {
            if (!option.examDate) return false;
            const examMoment = moment(option.examDate.toDate()).startOf("day");
            return examMoment.isSameOrAfter(today);
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
    const attendanceRef = collection(db, "AttendanceRecords");
    const q = query(attendanceRef, where("verifiedBy", "==", currentUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAttendanceRecords(records);
      },
      (error) => {
        console.error("Error fetching attendance records:", error);
      }
    );
    return () => unsubscribe();
  }, [db, currentUser]);

  // Comment out WebSocket integration
  /*useEffect(() => {
    wsRef.current = new WebSocket("ws://localhost:8080");

    wsRef.current.onopen = () => {
      console.log("WebSocket connection established.");
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.fingerprintID && scanningStateRef.current) {
          if (scanningTimeoutRef.current) {
            clearTimeout(scanningTimeoutRef.current);
            scanningTimeoutRef.current = null;
          }
          setIsScanning(false);
          scanningStateRef.current = false;
          // Use the ref value for exam selection
          handleNFCRead(data.fingerprintID);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message", err);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);*/

  // Mock scanning system
  useEffect(() => {
    if (isScanning) {
      console.log("Mock scanner activated");
      // Use a known NFC ID that matches a student in your database
      scanningTimeoutRef.current = setTimeout(() => {
        const mockNfcId = '22'; // Use the same ID as your test student
        console.log("Mock NFC scan:", mockNfcId);
        
        if (scanningStateRef.current) {
          handleNFCRead(mockNfcId);
        }
        
        setIsScanning(false);
        scanningStateRef.current = false;
      }, 2000);
    }

    return () => {
      if (scanningTimeoutRef.current) {
        clearTimeout(scanningTimeoutRef.current);
      }
    };
  }, [isScanning]);

  // Add this component inside your AttendanceVerification component
  const AuthDebugger = () => {
    if (!currentUser) {
      return (
        <Alert
          message="Authentication Warning"
          description="You are not currently authenticated. This will prevent attendance recording."
          type="warning"
          showIcon
          style={{ marginBottom: "20px" }}
        />
      );
    }

    return (
      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          background: "#f9f9f9",
          borderRadius: "5px",
        }}
      >
        <h4>Authentication Status</h4>
        <p>Logged in as: {currentUser.email || "Unknown"}</p>
        <p>UID: {currentUser.uid || "Missing"}</p>
        <Button
          size="small"
          onClick={() => {
            console.log("Current User Object:", currentUser);
            message.info("Auth details logged to console");
          }}
        >
          Log Auth Details
        </Button>
      </div>
    );
  };

  // ------------------------------------------------------------------
  // 4) Handle NFC Read (invoked when scanner data is received)
  // ------------------------------------------------------------------
  const handleNFCRead = async (tagId) => {
    if (!selectedExamRef.current) {
      Modal.warning({
        title: "No Exam Selected",
        content: "Please select an exam before scanning.",
      });
      return;
    }

    // Ensure user is authenticated
    if (!currentUser || !currentUser.uid) {
      Modal.error({
        title: "Authentication Error",
        content: "You must be logged in to record attendance.",
      });
      return;
    }

    try {
      console.log("Starting attendance verification with:", {
        tagId,
        examId: selectedExamRef.current,
        verifierUid: currentUser.uid
      });

      // Find student by NFC tag ID
      const studentsRef = collection(db, "Students");
      const studentQuery = query(studentsRef, where("nfcTagId", "==", tagId));
      const studentSnapshot = await getDocs(studentQuery);

      if (studentSnapshot.empty) {
        Modal.error({
          title: "Student Not Found",
          content: `No student found with NFC tag: ${tagId}`,
        });
        return;
      }

      const studentDoc = studentSnapshot.docs[0];
      const studentData = studentDoc.data();

      // Create new attendance record
      const newRecord = {
        examId: selectedExamRef.current,
        studentId: studentDoc.id,
        name: `${studentData.firstName} ${studentData.lastName}`.trim(),
        matricNumber: studentData.matricNumber || studentDoc.id,
        timestamp: new Date(),
        status: "present",
        verifiedBy: currentUser.uid,
        // Add these fields for better tracking
        nfcTagId: tagId,
        createdAt: new Date(),
      };

      console.log("Attempting to create attendance record:", newRecord);

      const docRef = await addDoc(collection(db, "AttendanceRecords"), newRecord);
      console.log("Successfully created attendance record with ID:", docRef.id);

      Modal.success({
        title: "Attendance Recorded",
        content: `Successfully recorded attendance for ${newRecord.name}`,
      });

    } catch (error) {
      console.error("Detailed error in attendance process:", {
        error: error.message,
        code: error.code,
        details: error
      });
      Modal.error({
        title: "Error",
        content: `Failed to record attendance: ${error.message}`,
      });
    }
  };

  // Toggle scanner with mock functionality
  const toggleScanner = () => {
    if (!isScanning) {
      setIsScanning(true);
      scanningStateRef.current = true;
      message.info("Mock scanner activated - simulating NFC scan...");
      
      // Set timeout for scanner
      scanningTimeoutRef.current = setTimeout(() => {
        setIsScanning(false);
        scanningStateRef.current = false;
        message.error("Scanning timed out. Please try again.");
        scanningTimeoutRef.current = null;
      }, 20000);
    } else {
      setIsScanning(false);
      scanningStateRef.current = false;
      if (scanningTimeoutRef.current) {
        clearTimeout(scanningTimeoutRef.current);
        scanningTimeoutRef.current = null;
      }
      message.info("Scanner deactivated");
    }
  };

  // ------------------------------------------------------------------
  // 6) Define table columns for attendance records
  // ------------------------------------------------------------------
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Matric Number",
      dataIndex: "matricNumber",
      key: "matricNumber",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Date Marked",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (text) => {
        const dateObj = text && text.toDate ? text.toDate() : new Date(text);
        return moment(dateObj).format("MMM DD, YYYY, h:mm a");
      },
    },
  ];

  // ------------------------------------------------------------------
  // 7) Attendance History Modal with Filter Inputs
  // ------------------------------------------------------------------
  const AttendanceHistory = () => {
    const examFilterOptions = examOptions.filter((option) =>
      attendanceRecords.some((record) => record.examId === option.value)
    );

    // Get available dates only when an exam is selected
    const availableDates = filterExam
      ? Array.from(
          new Set(
            attendanceRecords
              .filter((record) => record.examId === filterExam)
              .map((record) =>
                moment(
                  record.timestamp && record.timestamp.toDate
                    ? record.timestamp.toDate()
                    : record.timestamp
                ).format("MMM DD, YYYY")
              )
          )
        )
      : [];

    // Filter records based on selected exam and date
    let filteredRecords = [];
    if (filterExam) {
      filteredRecords = attendanceRecords.filter(
        (record) => record.examId === filterExam
      );
      if (filterDate) {
        filteredRecords = filteredRecords.filter((record) => {
          const recordDate = moment(
            record.timestamp && record.timestamp.toDate
              ? record.timestamp.toDate()
              : record.timestamp
          ).format("MMM DD, YYYY");
          return recordDate === filterDate;
        });
      }
    }

    return (
      <Modal
        title="Attendance History"
        open={showHistory}
        onCancel={() => {
          setShowHistory(false);
          setFilterExam(null);
          setFilterDate(null);
        }}
        width={800}
        footer={null}
      >
        <div style={styles.filterRow}>
          <Select
            style={{ flex: 1 }}
            placeholder="Select Course/Exam"
            value={filterExam}
            onChange={(value) => {
              setFilterExam(value);
              setFilterDate(null);
            }}
            allowClear
          >
            {examFilterOptions.map((exam) => (
              <Option key={exam.value} value={exam.value}>
                {exam.label}
              </Option>
            ))}
          </Select>
          {filterExam && (
            <Select
              style={{ flex: 1 }}
              placeholder="Select Date"
              value={filterDate}
              onChange={(value) => setFilterDate(value)}
              allowClear
            >
              {availableDates.map((date) => (
                <Option key={date} value={date}>
                  {date}
                </Option>
              ))}
            </Select>
          )}
        </div>

        {!filterExam ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Alert
              message="Please select a course to view attendance history"
              type="info"
              showIcon
            />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Alert
              message="No attendance records found for the selected criteria"
              type="warning"
              showIcon
            />
          </div>
        ) : (
          <Table 
            dataSource={filteredRecords} 
            columns={columns} 
            rowKey="id"
            pagination={{
              pageSize: 5,
              total: filteredRecords.length,
              showTotal: (total) => `Total ${total} records`,
            }}
          />
        )}
      </Modal>
    );
  };

  return (
    <Layout>
      <Content style={styles.container}>
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

          {!nfcSupported && (
            <Alert
              message="NFC Not Supported"
              description="Your device does not support NFC scanning. Please use a compatible device."
              type="error"
              showIcon
              style={{ marginBottom: "20px" }}
            />
          )}

          <AuthDebugger />

          <Card style={styles.scannerCard}>
            <Select
              style={{ width: "100%", marginBottom: "20px" }}
              placeholder="Select Exam"
              onChange={(value) => {
                setSelectedExam(value);
                selectedExamRef.current = value;
              }}
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
              text={isScanning ? "Mock Scanner Active" : "Scanner Inactive"}
              style={styles.statusBadge}
            />

            <div>
              <Button
                type="primary"
                icon={<ScanOutlined />}
                onClick={toggleScanner}
                disabled={!selectedExam}
              >
                {isScanning ? "Stop Scanning" : "Start Mock Scanning"}
              </Button>
            </div>

            {isScanning && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ marginTop: "20px" }}
              >
                <Spin tip="Simulating NFC scan..." />
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
                <p>Matric Number: {currentStudent.matricNumber}</p>
                <p>Time: {moment().format("MMM DD, YYYY, h:mm a")}</p>
              </motion.div>
            )}
          </Card>

          <Card title="Today's Attendance">
            {selectedExam ? (
              <Table
                dataSource={attendanceRecords.filter((record) => {
                  if (record.examId !== selectedExam) return false;
                  const recordDate = moment(
                    record.timestamp && record.timestamp.toDate
                      ? record.timestamp.toDate()
                      : record.timestamp
                  ).startOf("day");
                  const today = moment().startOf("day");
                  return recordDate.isSame(today);
                })}
                columns={columns}
                rowKey="id"
                locale={{
                  emptyText: "No attendance records for this exam today.",
                }}
              />
            ) : (
              <p>Please select an exam course to view today's attendance.</p>
            )}
          </Card>
        </motion.div>

        <AttendanceHistory />
      </Content>
    </Layout>
  );
};

export default AttendanceVerification;
