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

  // ------------------------------------------------------------------
  // 3) WebSocket Integration for Scanner Data
  // ------------------------------------------------------------------
  useEffect(() => {
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
  }, []);

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
  // const handleNFCRead = async (tagId) => {
  //   // Use the ref to get the current exam selection
  //   if (!selectedExamRef.current) {
  //     Modal.warning({
  //       title: "No Exam Selected",
  //       content: "Please select an exam before scanning.",
  //     });
  //     return;
  //   }

  //   const examOption = examOptions.find((opt) => opt.value === selectedExamRef.current);
  //   if (examOption && examOption.examDate) {
  //     const examDate = moment(examOption.examDate.toDate()).startOf("day");
  //     const today = moment().startOf("day");
  //     if (!examDate.isSame(today)) {
  //       Modal.warning({
  //         title: "Exam Not Scheduled Today",
  //         content: "The selected exam isn't scheduled for today.",
  //       });
  //       return;
  //     }
  //   }

  //   try {
  //     const studentsRef = collection(db, "Students");
  //     const studentQuery = query(studentsRef, where("nfcTagId", "==", tagId));
  //     const studentSnapshot = await getDocs(studentQuery);
  //     if (studentSnapshot.empty) {
  //       Modal.error({
  //         title: "Student Not Found",
  //         content: `No student found with NFC tag: ${tagId}.`,
  //       });
  //       return;
  //     }
  //     const studentDoc = studentSnapshot.docs[0];
  //     const studentData = studentDoc.data();
  //     const fullName = `${studentData.firstName || ""} ${studentData.lastName || ""}`.trim();
  //     if (!fullName) {
  //       Modal.error({
  //         title: "Incomplete Student Data",
  //         content: "The student record is missing firstName and/or lastName.",
  //       });
  //       return;
  //     }
  //     const studentRecord = {
  //       id: studentDoc.id,
  //       firstName: studentData.firstName,
  //       lastName: studentData.lastName,
  //       name: fullName,
  //       matricNumber: studentData.matricNumber || studentDoc.id,
  //       nfcTag: tagId,
  //     };

  //     const attendanceRef = collection(db, "AttendanceRecords");
  //     const q = query(
  //       attendanceRef,
  //       where("examId", "==", selectedExamRef.current),
  //       where("studentId", "==", studentRecord.id)
  //     );
  //     const attendanceSnap = await getDocs(q);
  //     if (!attendanceSnap.empty) {
  //       Modal.warning({
  //         title: "Duplicate Entry",
  //         content: `${studentRecord.name} has already been marked for this exam.`,
  //       });
  //       return;
  //     }

  //     const newRecord = {
  //       examId: selectedExamRef.current,
  //       studentId: studentRecord.id,
  //       name: studentRecord.name,
  //       matricNumber: studentRecord.matricNumber,
  //       timestamp: new Date(),
  //       status: "present",
  //       verifiedBy: currentUser.uid,
  //     };
  //     await addDoc(collection(db, "AttendanceRecords"), newRecord);
  //     setCurrentStudent(studentRecord);
  //     Modal.success({
  //       title: "Attendance Recorded",
  //       content: `Successfully recorded attendance for ${studentRecord.name}.`,
  //     });
  //   } catch (error) {
  //     console.error("Error recording attendance:", error);
  //     Modal.error({
  //       title: "Error",
  //       content: "Failed to record attendance.",
  //     });
  //   }
  // };
  // const handleNFCRead = async (tagId) => {
  //   if (!selectedExamRef.current) {
  //     Modal.warning({
  //       title: "No Exam Selected",
  //       content: "Please select an exam before scanning.",
  //     });
  //     return;
  //   }

  //   // Validate exam date
  //   const examOption = examOptions.find((opt) => opt.value === selectedExamRef.current);
  //   if (examOption && examOption.examDate) {
  //     const examDate = moment(examOption.examDate.toDate()).startOf("day");
  //     const today = moment().startOf("day");
  //     if (!examDate.isSame(today)) {
  //       Modal.warning({
  //         title: "Exam Not Scheduled Today",
  //         content: "The selected exam isn't scheduled for today.",
  //       });
  //       return;
  //     }
  //   }

  //   if (!currentUser || !currentUser.uid) {
  //     Modal.error({ title: "Error", content: "User not authenticated." });
  //     return;
  //   }

  //   try {
  //     const studentsRef = collection(db, "Students");
  //     const studentQuery = query(studentsRef, where("nfcTagId", "==", tagId));
  //     const studentSnapshot = await getDocs(studentQuery);
  //     if (studentSnapshot.empty) {
  //       Modal.error({
  //         title: "Student Not Found",
  //         content: `No student found with NFC tag: ${tagId}.`,
  //       });
  //       return;
  //     }
  //     const studentDoc = studentSnapshot.docs[0];
  //     const studentData = studentDoc.data();
  //     const fullName = `${studentData.firstName || ""} ${studentData.lastName || ""}`.trim();
  //     if (!fullName) {
  //       Modal.error({
  //         title: "Incomplete Student Data",
  //         content: "The student record is missing firstName and/or lastName.",
  //       });
  //       return;
  //     }
  //     const studentRecord = {
  //       id: studentDoc.id,
  //       firstName: studentData.firstName,
  //       lastName: studentData.lastName,
  //       name: fullName,
  //       matricNumber: studentData.matricNumber || studentDoc.id,
  //       nfcTag: tagId,
  //     };

  //     const attendanceRef = collection(db, "AttendanceRecords");
  //     const q = query(
  //       attendanceRef,
  //       where("examId", "==", selectedExamRef.current),
  //       where("studentId", "==", studentRecord.id)
  //     );
  //     const attendanceSnap = await getDocs(q);
  //     if (!attendanceSnap.empty) {
  //       Modal.warning({
  //         title: "Duplicate Entry",
  //         content: `${studentRecord.name} has already been marked for this exam.`,
  //       });
  //       return;
  //     }

  //     const newRecord = {
  //       examId: selectedExamRef.current,
  //       studentId: studentRecord.id,
  //       name: studentRecord.name,
  //       matricNumber: studentRecord.matricNumber,
  //       timestamp: new Date(),
  //       status: "present",
  //       verifiedBy: currentUser.uid, // ensure this is exactly the same as request.auth.uid
  //     };

  //     console.log("New Attendance Record:", newRecord);

  //     await addDoc(collection(db, "AttendanceRecords"), newRecord);
  //     setCurrentStudent(studentRecord);
  //     Modal.success({
  //       title: "Attendance Recorded",
  //       content: `Successfully recorded attendance for ${studentRecord.name}.`,
  //     });
  //   } catch (error) {
  //     console.error("Error recording attendance:", error);
  //     Modal.error({
  //       title: "Error",
  //       content: "Failed to record attendance.",
  //     });
  //   }
  // };
  const handleNFCRead = async (tagId) => {
    if (!selectedExamRef.current) {
      Modal.warning({
        title: "No Exam Selected",
        content: "Please select an exam before scanning.",
      });
      return;
    }

    // Debug authentication state
    console.log("Authentication state when scanning:", {
      isAuthenticated: !!currentUser,
      uid: currentUser?.uid,
      email: currentUser?.email,
    });

    // Validate exam date
    const examOption = examOptions.find(
      (opt) => opt.value === selectedExamRef.current
    );
    if (examOption && examOption.examDate) {
      const examDate = moment(examOption.examDate.toDate()).startOf("day");
      const today = moment().startOf("day");
      if (!examDate.isSame(today)) {
        Modal.warning({
          title: "Exam Not Scheduled Today",
          content: "The selected exam isn't scheduled for today.",
        });
        return;
      }
    }

    // Ensure user is authenticated before proceeding
    if (!currentUser || !currentUser.uid) {
      Modal.error({
        title: "Authentication Error",
        content: "You must be logged in to record attendance.",
      });
      return;
    }

    try {
      // Find student by NFC tag ID
      const studentsRef = collection(db, "Students");
      const studentQuery = query(studentsRef, where("nfcTagId", "==", tagId));
      const studentSnapshot = await getDocs(studentQuery);

      console.log(`Searching for student with NFC tag: ${tagId}`);
      console.log(`Found ${studentSnapshot.size} matching students`);

      if (studentSnapshot.empty) {
        Modal.error({
          title: "Student Not Found",
          content: `No student found with NFC tag: ${tagId}.`,
        });
        return;
      }

      const studentDoc = studentSnapshot.docs[0];
      const studentData = studentDoc.data();
      console.log("Found student data:", studentData);

      const fullName = `${studentData.firstName || ""} ${
        studentData.lastName || ""
      }`.trim();

      if (!fullName) {
        Modal.error({
          title: "Incomplete Student Data",
          content: "The student record is missing firstName and/or lastName.",
        });
        return;
      }

      const studentRecord = {
        id: studentDoc.id,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        name: fullName,
        matricNumber: studentData.matricNumber || studentDoc.id,
        nfcTag: tagId,
      };

      console.log("Prepared student record:", studentRecord);

      // Check for duplicate attendance record
      const attendanceRef = collection(db, "AttendanceRecords");
      const q = query(
        attendanceRef,
        where("examId", "==", selectedExamRef.current),
        where("studentId", "==", studentRecord.id)
      );

      const attendanceSnap = await getDocs(q);
      console.log(`Found ${attendanceSnap.size} existing attendance records`);

      if (!attendanceSnap.empty) {
        Modal.warning({
          title: "Duplicate Entry",
          content: `${studentRecord.name} has already been marked for this exam.`,
        });
        return;
      }

      // Store UID in a local variable to ensure consistency
      const verifierUid = currentUser.uid;
      console.log("Current User UID for verification:", verifierUid);

      // Create new attendance record with current user's UID
      const newRecord = {
        examId: selectedExamRef.current,
        studentId: studentRecord.id,
        name: studentRecord.name,
        matricNumber: studentRecord.matricNumber,
        timestamp: new Date(),
        status: "present",
        verifiedBy: verifierUid,
      };

      console.log("Creating attendance record:", JSON.stringify(newRecord));

      try {
        // Try adding the document to Firestore
        const docRef = await addDoc(
          collection(db, "AttendanceRecords"),
          newRecord
        );
        console.log("Document written with ID: ", docRef.id);

        // Update UI state
        setCurrentStudent(studentRecord);

        Modal.success({
          title: "Attendance Recorded",
          content: `Successfully recorded attendance for ${studentRecord.name}.`,
        });
      } catch (innerError) {
        console.error("Specific document creation error:", innerError);

        // Try with a simpler document to identify permission issues
        try {
          console.log("Trying with a minimal test document...");
          const testDoc = {
            test: true,
            verifiedBy: verifierUid,
            timestamp: new Date(),
          };
          await addDoc(collection(db, "AttendanceRecords"), testDoc);
          console.log("Test document created successfully");

          // If this works but the original didn't, it's a data format issue
          Modal.error({
            title: "Data Format Error",
            content:
              "There's an issue with the attendance record format. Please check the console for details.",
          });
        } catch (testError) {
          console.error("Test document creation failed:", testError);
          Modal.error({
            title: "Permission Error",
            content: `Authentication or permission issue: ${testError.message}`,
          });
        }
      }
    } catch (error) {
      console.error("Error in overall attendance process:", error);
      Modal.error({
        title: "Error",
        content: `Failed to record attendance: ${error.message}`,
      });
    }
  };
  // ------------------------------------------------------------------
  // 5) Toggle Scanner: Start scanning and set a 20-second timeout
  // ------------------------------------------------------------------
  const toggleScanner = () => {
    if (!isScanning) {
      setIsScanning(true);
      scanningStateRef.current = true;
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

    let filteredRecords = attendanceRecords;
    if (filterExam) {
      filteredRecords = filteredRecords.filter(
        (record) => record.examId === filterExam
      );
    }
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
            placeholder="Filter by Exam Course"
            value={filterExam}
            onChange={(value) => {
              setFilterExam(value);
              setFilterDate(null);
            }}
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
              placeholder="Filter by Date"
              value={filterDate}
              onChange={(value) => setFilterDate(value)}
            >
              {availableDates.map((date) => (
                <Option key={date} value={date}>
                  {date}
                </Option>
              ))}
            </Select>
          )}
        </div>
        <Table dataSource={filteredRecords} columns={columns} rowKey="id" />
      </Modal>
    );
  };

  return (
    <Layout>
      <Content
        style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}
      >
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
                // Update the ref with the new value
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
                <Spin tip="Waiting for scanner data..." />
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
