import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../utils/firebase/firebase";
import {
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { IoFingerPrintOutline } from "react-icons/io5";
import { auth } from "../../utils/firebase/firebase";
import "../TakeAttendance/TakeAttendance.css";
import { Timestamp } from "firebase/firestore";

// Import Ant Design Table component and its CSS
import { Table } from "antd";

const TakeAttendance = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [fingerprintInput, setFingerprintInput] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scannerDialogOpen, setScannerDialogOpen] = useState(false);
  const currentUser = auth.currentUser;

  // Define a time window (in hours) for which attendance records are valid/visible
  const attendanceWindowHours = 2; // Adjust this as needed

  // --- Fetch courses for the current user ---
  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!currentUser) return;
      const coursesRef = collection(db, "courses");
      const q = query(coursesRef, where("userId", "==", currentUser.uid));
      try {
        const querySnapshot = await getDocs(q);
        const userCourses = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourses(userCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };
    fetchUserCourses();
  }, [currentUser]);

  // --- Listen for attendance records for the selected course in the recent time window ---
  useEffect(() => {
    if (!selectedCourseId) return;

    const attendanceRef = collection(db, "attendance");
    const startTime = Timestamp.fromDate(
      new Date(Date.now() - attendanceWindowHours * 3600000)
    );
    const currentTime = Timestamp.fromDate(new Date());

    const q = query(
      attendanceRef,
      where("courseID", "==", selectedCourseId),
      where("timeMarked", ">=", startTime),
      where("timeMarked", "<=", currentTime)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const records = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAttendanceRecords(records);
      } else {
        setAttendanceRecords([]);
      }
    });

    return () => unsubscribe();
  }, [selectedCourseId, attendanceWindowHours]);

  // Mock fingerprint scanning
  useEffect(() => {
    if (scannerDialogOpen) {
      // Simulate fingerprint scanning with a random ID after 2 seconds
      const timer = setTimeout(() => {
        const mockFingerprintID = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        console.log("Mock fingerprint scan:", mockFingerprintID);
        setFingerprintInput(mockFingerprintID);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [scannerDialogOpen]);

  // --- Handle fingerprint input and mark attendance with optimistic update ---
  const handleFingerprintInput = async () => {
    if (!fingerprintInput.trim()) {
      setError("Please enter a fingerprint ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Mock student data for testing
      const mockStudentData = {
        fingerprintID: fingerprintInput,
        name: `Test Student ${fingerprintInput}`,
        matricNumber: `MAT${fingerprintInput}`,
      };

      // Check if attendance is already marked for this student in the recent time window
      const startTime = Timestamp.fromDate(
        new Date(Date.now() - attendanceWindowHours * 3600000)
      );
      const attendanceRef = collection(db, "attendance");
      const attendanceQuery = query(
        attendanceRef,
        where("courseID", "==", selectedCourseId),
        where("fingerprintID", "==", fingerprintInput),
        where("timeMarked", ">=", startTime)
      );

      const attendanceSnap = await getDocs(attendanceQuery);
      if (!attendanceSnap.empty) {
        setError("Attendance already marked for this student.");
        setFingerprintInput("");
        setScannerDialogOpen(false);
        return;
      }

      // Add a new attendance record
      const docRef = await addDoc(attendanceRef, {
        courseID: selectedCourseId,
        fingerprintID: mockStudentData.fingerprintID,
        name: mockStudentData.name,
        matricNumber: mockStudentData.matricNumber,
        timeMarked: Timestamp.now(),
      });

      // Optimistically update the local attendance records
      const newRecord = {
        id: docRef.id,
        courseID: selectedCourseId,
        fingerprintID: mockStudentData.fingerprintID,
        name: mockStudentData.name,
        matricNumber: mockStudentData.matricNumber,
        timeMarked: Timestamp.now(),
      };
      setAttendanceRecords((prevRecords) => [newRecord, ...prevRecords]);

      setAttendanceStatus({
        success: true,
        message: `Attendance marked for ${mockStudentData.name}`,
        student: mockStudentData,
      });

      setFingerprintInput("");
      setScannerDialogOpen(false);
    } catch (error) {
      console.error("Error marking attendance:", error);
      setError("Failed to mark attendance. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Define columns for the Ant Design Table ---
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
      title: "Time Marked",
      dataIndex: "timeMarked",
      key: "timeMarked",
      render: (timestamp) => {
        if (timestamp && timestamp.toDate) {
          return timestamp.toDate().toLocaleString();
        }
        return "Invalid Date";
      },
    },
  ];

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Fingerprint Attendance</h1>
        <FormControl fullWidth variant="outlined" className="form-control">
          <InputLabel>Select Course</InputLabel>
          <Select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            label="Select Course"
          >
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.courseTitle} ({course.courseCode})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          startIcon={<IoFingerPrintOutline />}
          onClick={() => setScannerDialogOpen(true)}
          disabled={!selectedCourseId}
        >
          Take Attendance
        </Button>
      </div>

      {error && (
        <Alert
          severity="error"
          className="alert"
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {attendanceStatus?.success && (
        <Alert
          severity="success"
          className="alert"
          onClose={() => setAttendanceStatus(null)}
        >
          {attendanceStatus.message}
        </Alert>
      )}

      <Dialog
        open={scannerDialogOpen}
        onClose={() => setScannerDialogOpen(false)}
      >
        <DialogTitle>Mock Fingerprint Scanner</DialogTitle>
        <DialogContent>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <div>
                <p>Simulating fingerprint scan...</p>
                <TextField
                  margin="dense"
                  label="Fingerprint ID"
                  fullWidth
                  variant="outlined"
                  value={fingerprintInput}
                  onChange={(e) => setFingerprintInput(e.target.value)}
                />
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScannerDialogOpen(false)} color="secondary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Table dataSource={attendanceRecords} columns={columns} rowKey="id" />
    </div>
  );
};

export default TakeAttendance;
