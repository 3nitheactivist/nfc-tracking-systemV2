import React, { useState, useEffect, useRef, useContext } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Divider,
  message,
  Tabs,
  Typography,
  Row,
  Col,
  Spin,
  Badge,
} from "antd";
import { motion } from "framer-motion";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  ScanOutlined,
} from "@ant-design/icons";
import ViewStudents from "./ViewStudents/ViewStudents";
import useAuth from "../../utils/config/useAuth";
// Import BluetoothContext for Bluetooth communication
import { BluetoothContext } from "../BluetoothButton/BluetoothContext";

// Import Firestore functions
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const StudentEnrollment = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [studentIdPresent, setStudentIdPresent] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scanTimeoutRef = useRef(null);
  const { currentUser } = useAuth();
  const db = getFirestore();
  const navigate = useNavigate();

  // Bluetooth context for communication
  const { 
    isConnected, 
    connectToDevice, 
    sendMessage, 
    receivedData, 
    device 
  } = useContext(BluetoothContext);

  if (!currentUser || !currentUser.uid) {
    message.error("User not logged in!");
    return null;
  }
  console.log("Current user UID:", currentUser.uid);

  // Handle Bluetooth received data
  useEffect(() => {
    if (receivedData && scanning) {
      try {
        // Try to parse the received data as JSON
        const data = typeof receivedData === 'string' 
          ? JSON.parse(receivedData) 
          : receivedData;
        
        // Check if data has a fingerprintID or nfcTagId field
        if ((data.fingerprintID || data.nfcTagId) && scanning) {
          const tagId = data.fingerprintID || data.nfcTagId;
          
          // When scanner data is received and scanning is active:
          form.setFieldsValue({ studentId: tagId });
          setStudentIdPresent(true);
          message.success("ID received from scanner: " + tagId);
          setScanning(false);
          if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
            scanTimeoutRef.current = null;
          }
        }
      } catch (err) {
        console.error("Error parsing Bluetooth message", err);
      }
    }
  }, [receivedData, scanning, form]);

  // Trigger scanning: start waiting for Bluetooth scanner data and set a timeout
  const handleScan = async () => {
    if (!isConnected) {
      try {
        // Try to connect to Bluetooth device if not connected
        await connectToDevice();
        message.success("Connected to Bluetooth device");
      } catch (error) {
        message.error("Failed to connect to Bluetooth device: " + error.message);
        return;
      }
    }

    // If the Bluetooth device is connected, start scanning
    if (isConnected) {
    setScanning(true);
    message.info("Waiting for scanner data...");
      
      // Send command to start scanning if your device supports it
      try {
        await sendMessage("SCAN");
      } catch (error) {
        console.error("Error sending scan command:", error);
      }
      
      // Set a timeout: if no data is received within 20 seconds, stop scanning
    scanTimeoutRef.current = setTimeout(() => {
      setScanning(false);
      message.error("Scanning timed out. Please try again.");
      scanTimeoutRef.current = null;
    }, 20000); // 20 seconds
    } else {
      message.error("Bluetooth device not connected. Please connect and try again.");
    }
  };

  // Called when the form is submitted
  const onFinish = async (values) => {
    if (!currentUser) {
      message.error("User not logged in!");
      return;
    }
    setLoading(true);
    try {
      const scannedID = values.studentId;

      // Duplicate check: query for documents with the same nfcTagId and matching userId
      const duplicateQuery = query(
        collection(db, "Students"),
        where("nfcTagId", "==", scannedID),
        where("userId", "==", currentUser.uid)
      );

      const duplicateSnapshot = await getDocs(duplicateQuery);
      console.log("Duplicate Query Snapshot Size:", duplicateSnapshot.size);

      const duplicateExists = duplicateSnapshot.docs.some(
        (doc) => doc.data().userId === currentUser.uid
      );
      if (duplicateExists) {
        message.error("Student already registered!");
        setLoading(false);
        return;
      }

      const studentData = {
        ...values,
        nfcTagId: scannedID,
        enrollmentDate: new Date(),
        status: "active",
        userId: currentUser.uid,
      };

      await addDoc(collection(db, "Students"), studentData);
      console.log("Student Data:", studentData);
      message.success("Student enrolled successfully!");
      form.resetFields();
      setStudentIdPresent(false);
    } catch (error) {
      message.error("Failed to enroll student: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update studentIdPresent state based on changes in the Student ID field
  const onValuesChange = (changedValues, allValues) => {
    if (changedValues.studentId !== undefined) {
      if (allValues.studentId && allValues.studentId.trim() !== "") {
        setStudentIdPresent(true);
      } else {
        setStudentIdPresent(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        title={<Title level={3}>Student Enrollment</Title>}
        style={{ maxWidth: "672px", margin: "0 auto" }}
        extra={
          <Badge 
            status={isConnected ? "success" : "error"} 
            text={isConnected ? `Connected to ${device?.name || 'Bluetooth device'}` : "Not connected"} 
          />
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onValuesChange={onValuesChange}
          initialValues={{ country: "Nigeria" }}
        >
          {/* Student ID field */}
          <Form.Item
            name="studentId"
            label="Student ID"
            rules={[{ required: true, message: "Please enter student ID" }]}
          >
            <Input
              prefix={<IdcardOutlined />}
              placeholder="Student ID"
              disabled={scanning} // Disable manual editing while scanning
            />
          </Form.Item>

          {/* Scan ID Button */}
          <Form.Item>
            <Button 
              type="primary"
              icon={<ScanOutlined />}
              onClick={handleScan} 
              loading={scanning}
              disabled={!isConnected && scanning}
              style={{ marginRight: 8 }}
            >
              {scanning ? "Scanning..." : "Scan ID"}
            </Button>
            
            {!isConnected && (
              <Text type="danger">Please connect to a Bluetooth device first</Text>
            )}
          </Form.Item>

          {scanning && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ marginTop: "20px", textAlign: "center" }}
            >
              <Spin tip="Waiting for scanner data..." />
            </motion.div>
          )}

          {/* Other form fields - enabled only if a Student ID is present */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[{ required: true, message: "Please enter first name" }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="First Name"
                  disabled={!studentIdPresent}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[{ required: true, message: "Please enter last name" }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Last Name"
                  disabled={!studentIdPresent}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="matricNumber"
            label="Matric Number"
            rules={[{ required: true, message: "Please enter matric number" }]}
          >
            <Input placeholder="Matric Number" disabled={!studentIdPresent} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
              disabled={!studentIdPresent}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Phone Number"
              disabled={!studentIdPresent}
            />
          </Form.Item>

          <Form.Item
            name="department"
            label="Department"
            rules={[{ required: true, message: "Please enter department" }]}
          >
            <Input placeholder="Department" disabled={!studentIdPresent} />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              block
              style={{ fontSize: "20px" }}
              disabled={!studentIdPresent}
            >
              Enroll Student
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </motion.div>
  );
};

// Main Student Management Component
const EnrollStudent = () => {
  const [activeTab, setActiveTab] = useState("enrollment");
  const Navigate = useNavigate();

  return (
    <div style={{ padding: "1.5rem" }}>
      <Button
        type="primary"
        icon={<ArrowLeftOutlined />}
        onClick={() => Navigate(-1)}
        style={{
          marginBottom: "16px",
          backgroundColor: "#00923f",
          borderColor: "#00923f",
        }}
      >
        Back
      </Button>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ maxWidth: "48rem", marginLeft: "auto", marginRight: "auto" }}
      >
        <TabPane tab="Student Enrollment" key="enrollment">
          <StudentEnrollment />
        </TabPane>
        <TabPane tab="View Students" key="students">
          <ViewStudents />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default EnrollStudent;
