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
import { ScanOutlined, HistoryOutlined, UserOutlined } from "@ant-design/icons";
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
import useAuth from "../../../utils/config/useAuth";
import moment from "moment";

const { Content } = Layout;
const { Option } = Select;

const ExamAttendance = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const db = getFirestore();

  // Local states
  const [scanning, setScanning] = useState(false);
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
  useEffect(() => {
    selectedExamRef.current = selectedExam;
  }, [selectedExam]);

  // Ref for scan timeout
  const scanTimeoutRef = useRef(null);

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
  const enrichAttendanceWithStudentData = async (records) => {
    if (!records.length) return records;
    
    // Create a map of student IDs to look up
    const studentIds = records.map(record => record.studentId).filter(Boolean);
    if (!studentIds.length) return records;
    
    try {
      // Fetch student data for all studentIds
      const studentsRef = collection(db, "students");
      const studentSnapshots = await Promise.all(
        studentIds.map(async (studentId) => {
          if (!studentId) return null;
          const studentDoc = await getDocs(query(studentsRef, where("__name__", "==", studentId)));
          return studentDoc.empty ? null : { id: studentId, ...studentDoc.docs[0].data() };
        })
      );
      
      // Create a map of student data
      const studentDataMap = studentSnapshots.reduce((map, student) => {
        if (student) map[student.id] = student;
        return map;
      }, {});
      
      // Enrich attendance records with student data
      return records.map(record => {
        const studentData = studentDataMap[record.studentId] || {};
        return {
          ...record,
          profileImage: studentData.profileImage || null
        };
      });
    } catch (error) {
      console.error("Error fetching student data:", error);
      return records;
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const attendanceRef = collection(db, "AttendanceRecords");
    const q = query(attendanceRef, where("verifiedBy", "==", currentUser.uid));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const records = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Enrich with student profile data
        const enrichedRecords = await enrichAttendanceWithStudentData(records);
        setAttendanceRecords(enrichedRecords);
      },
      (error) => {
        console.error("Error fetching attendance records:", error);
      }
    );
    return () => unsubscribe();
  }, [db, currentUser]);

  // ------------------------------------------------------------------
  // WebSocket integration for NFC scanning (integrated like the enrollment code)
  // ------------------------------------------------------------------
  useEffect(() => {
    // Only create the connection when scanning is active
    if (!scanning) return;

    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("WebSocket connection established.");
      message.info("Waiting for NFC scan...");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.fingerprintID && scanning) {
          // NFC data received; cancel timeout and stop scanning
          setScanning(false);
          if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
            scanTimeoutRef.current = null;
          }
          // Process the scanned NFC tag
          handleNFCRead(data.fingerprintID);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    // Cleanup when scanning stops or component unmounts
    return () => {
      ws.close();
    };
  }, [scanning]);

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
        verifierUid: currentUser.uid,
      });

      // Find student by NFC tag ID (using the current project's collection)
      const studentsRef = collection(db, "students"); // Note: lowercase "students"
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

      // Verify if student has attendance permission
      if (!studentData.permissions?.attendance) {
        Modal.error({
          title: "Permission Denied",
          content: "This student does not have attendance permissions",
        });
        return;
      }

      // Create new attendance record using current project's field structure
      const newRecord = {
        examId: selectedExamRef.current,
        studentId: studentDoc.id,
        name: studentData.name || 'Unknown',
        matricNumber: studentData.schoolId || studentDoc.id, // Use schoolId instead of matricNumber
        timestamp: new Date(),
        status: "present",
        verifiedBy: currentUser.uid,
        // Additional tracking fields
        nfcTagId: tagId,
        createdAt: new Date(),
      };

      console.log("Attempting to create attendance record:", newRecord);

      await addDoc(collection(db, "AttendanceRecords"), newRecord);
      console.log("Successfully created attendance record.");

      Modal.success({
        title: "Attendance Recorded",
        content: `Successfully recorded attendance for ${newRecord.name}`,
      });
    } catch (error) {
      console.error("Detailed error in attendance process:", error);
      Modal.error({
        title: "Error",
        content: `Failed to record attendance: ${error.message}`,
      });
    }
  };

  // ------------------------------------------------------------------
  // Toggle scanner: start scanning and set a 20-second timeout
  // ------------------------------------------------------------------
  const handleScan = () => {
    if (!selectedExam) {
      Modal.warning({
        title: "No Exam Selected",
        content: "Please select an exam before scanning.",
      });
      return;
    }
    setScanning(true);
    message.info("Scanner activated. Waiting for NFC tag...");
    // Set a timeout: if no data is received within 20 seconds, stop scanning.
    scanTimeoutRef.current = setTimeout(() => {
      setScanning(false);
      message.error("Scanning timed out. Please try again.");
      scanTimeoutRef.current = null;
    }, 20000);
  };

  // ------------------------------------------------------------------
  // Define table columns for attendance records
  // ------------------------------------------------------------------
  const columns = [
    {
      title: "Photo",
      key: "photo",
      width: 60,
      render: (_, record) => {
        // Try to get the student profile image
        return (
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
                alt={record.name}
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
        );
      }
    },
    {
      title: "Student Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "School ID",
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
  // Attendance History Modal with Filter Inputs
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
        <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
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
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Alert
              message="Please select a course to view attendance history"
              type="info"
              showIcon
            />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
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

  // ------------------------------------------------------------------
  // Component UI
  // ------------------------------------------------------------------
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Layout>
      <Content style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <Button onClick={handleBack} style={{ marginBottom: "20px" }}>
          Back
        </Button>
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <h1>Attendance Verification</h1>
            <Button type="primary" icon={<HistoryOutlined />} onClick={() => setShowHistory(true)}>
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

          <Card style={{ textAlign: "center", padding: "24px", marginBottom: "24px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
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
              status={scanning ? "processing" : "default"}
              text={scanning ? "Scanner Active" : "Scanner Inactive"}
              style={{ marginBottom: "16px" }}
            />

            <div>
              <Button
                type="primary"
                icon={<ScanOutlined />}
                onClick={handleScan}
                disabled={!selectedExam || scanning}
              >
                {scanning ? "Scanning..." : "Scan NFC Tag"}
              </Button>
            </div>

            {scanning && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ marginTop: "20px" }}>
                <Spin tip="Waiting for NFC scan..." />
              </motion.div>
            )}

            {currentStudent && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: "16px", padding: "16px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
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
                locale={{ emptyText: "No attendance records for this exam today." }}
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

export default ExamAttendance;
