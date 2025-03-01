

// import React, { useState } from "react";
// import {
//   Form,
//   Input,
//   Button,
//   Card,
//   Divider,
//   message,
//   Tabs,
//   Typography,
//   Row,
//   Col,
// } from "antd";
// import { motion } from "framer-motion";
// import {
//   UserOutlined,
//   MailOutlined,
//   PhoneOutlined,
//   IdcardOutlined,
//   SaveOutlined,
//   ArrowLeftOutlined,
// } from "@ant-design/icons";
// import ViewStudents from "./ViewStudents/ViewStudents";
// import useAuth from "../../utils/config/useAuth";

// // Import Firestore functions
// import {
//   getFirestore,
//   collection,
//   addDoc,
//   query,
//   where,
//   getDocs,
// } from "firebase/firestore";
// import { useNavigate } from "react-router-dom";

// const { Title } = Typography;
// const { TabPane } = Tabs;

// const StudentEnrollment = () => {
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const [studentIdPresent, setStudentIdPresent] = useState(false);
//   const { currentUser } = useAuth();
//   const db = getFirestore();
  
//   if (!currentUser || !currentUser.uid) {
//     message.error("User not logged in!");
//     return;
//   }
//   console.log("Current user UID:", currentUser.uid);
  

//   // For testing: simulate an NFC scan that returns a mock student ID
//   const mockNFCScan = () => {
//     form.setFieldsValue({ studentId: "MOCK12345" });
//     setStudentIdPresent(true);
//   };

//   // Called when the form is submitted
//   const onFinish = async (values) => {
//     if (!currentUser) {
//       message.error("User not logged in!");
//       return;
//     }
//     setLoading(true);
//     try {
//       // Use the scanned studentId as the NFC tag ID
//       const scannedNFCId = values.studentId;

//       // Duplicate check: query for documents with the same nfcTagId
//       const duplicateQuery = query(
//         collection(db, "Students"),
//         where("nfcTagId", "==", scannedNFCId),
//         where("userId", "==", currentUser.uid)
//       );
      
//       const duplicateSnapshot = await getDocs(duplicateQuery);
//       console.log("Duplicate Query Snapshot Size:", duplicateSnapshot.size);

//       // Filter duplicates for this user only
//       const duplicateExists = duplicateSnapshot.docs.some(
//         (doc) => doc.data().userId === currentUser.uid
//       );
//       if (duplicateExists) {
//         message.error("Student already registered!");
//         setLoading(false);
//         return;
//       }

//       // Combine form values with additional data, storing the scanned NFC ID as nfcTagId
//       const studentData = {
//         ...values,
//         nfcTagId: scannedNFCId,
//         enrollmentDate: new Date(),
//         status: "active",
//         userId: currentUser.uid,
//       };


//       // Save studentData to the "Students" collection in Firestore
//       await addDoc(collection(db, "Students"), studentData);
      

//       console.log("Student Data:", studentData);
//       message.success("Student enrolled successfully!");
//       form.resetFields();
//       setStudentIdPresent(false);
//     } catch (error) {
//       message.error("Failed to enroll student: " + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Watch for changes to the Student ID field
//   const onValuesChange = (changedValues, allValues) => {
//     if (changedValues.studentId !== undefined) {
//       if (allValues.studentId && allValues.studentId.trim() !== "") {
//         setStudentIdPresent(true);
//       } else {
//         setStudentIdPresent(false);
//       }
//     }
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//     >
//       <Card
//         title={<Title level={3}>Student Enrollment</Title>}
//         style={{ maxWidth: "672px", margin: "0 auto" }}
//       >
//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={onFinish}
//           onValuesChange={onValuesChange}
//           initialValues={{ country: "Nigeria" }}
//         >
//           {/* Student ID field - must be the first and mandatory */}
//           <Form.Item
//             name="studentId"
//             label="Student ID"
//             rules={[{ required: true, message: "Please enter student ID" }]}
//           >
//             <Input prefix={<IdcardOutlined />} placeholder="Student ID" />
//           </Form.Item>
//           <Form.Item>
//             <Button onClick={mockNFCScan}>Mock NFC Scan</Button>
//           </Form.Item>

//           {/* Other form fields - disabled until Student ID is provided */}
//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item
//                 name="firstName"
//                 label="First Name"
//                 rules={[{ required: true, message: "Please enter first name" }]}
//               >
//                 <Input
//                   prefix={<UserOutlined />}
//                   placeholder="First Name"
//                   disabled={!studentIdPresent}
//                 />
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item
//                 name="lastName"
//                 label="Last Name"
//                 rules={[{ required: true, message: "Please enter last name" }]}
//               >
//                 <Input
//                   prefix={<UserOutlined />}
//                   placeholder="Last Name"
//                   disabled={!studentIdPresent}
//                 />
//               </Form.Item>
//             </Col>
//           </Row>

//           {/* Matric Number field added */}
//           <Form.Item
//             name="matricNumber"
//             label="Matric Number"
//             rules={[{ required: true, message: "Please enter matric number" }]}
//           >
//             <Input placeholder="Matric Number" disabled={!studentIdPresent} />
//           </Form.Item>

//           <Form.Item
//             name="email"
//             label="Email"
//             rules={[
//               { required: true, message: "Please enter email" },
//               { type: "email", message: "Please enter a valid email" },
//             ]}
//           >
//             <Input
//               prefix={<MailOutlined />}
//               placeholder="Email"
//               disabled={!studentIdPresent}
//             />
//           </Form.Item>

//           <Form.Item
//             name="phone"
//             label="Phone Number"
//             rules={[{ required: true, message: "Please enter phone number" }]}
//           >
//             <Input
//               prefix={<PhoneOutlined />}
//               placeholder="Phone Number"
//               disabled={!studentIdPresent}
//             />
//           </Form.Item>

//           <Form.Item
//             name="department"
//             label="Department"
//             rules={[{ required: true, message: "Please enter department" }]}
//           >
//             <Input placeholder="Department" disabled={!studentIdPresent} />
//           </Form.Item>

//           <Divider />

//           <Form.Item>
//             <Button
//               type="primary"
//               htmlType="submit"
//               icon={<SaveOutlined />}
//               loading={loading}
//               block
//               style={{  fontSize: "20px" }}
//               disabled={!studentIdPresent}
//             >
//               Enroll Student
//             </Button>
//           </Form.Item>
//         </Form>
//       </Card>
//     </motion.div>
//   );
// };

// // Main Student Management Component
// const EnrollStudent = () => {
//   const [activeTab, setActiveTab] = useState("enrollment");
//   const Navigate = useNavigate();

//   return (
//     <div style={{ padding: "1.5rem" }}>
//       <Button
//         type="primary"
//         icon={<ArrowLeftOutlined />}
//         onClick={() => Navigate(-1)}
//         style={{
//           marginBottom: "16px",
//           backgroundColor: "#00923f",
//           borderColor: "#00923f",
//         }}
//       >
//         Back
//       </Button>
//       <Tabs
//         activeKey={activeTab}
//         onChange={setActiveTab}
//         style={{ maxWidth: "48rem", marginLeft: "auto", marginRight: "auto" }}
//       >
//         <TabPane tab="Student Enrollment" key="enrollment" >
//           <StudentEnrollment />
//         </TabPane>
//         <TabPane tab="View Students" key="students">
//           <ViewStudents />
//         </TabPane>
//       </Tabs>
//     </div>
//   );
// };

// export default EnrollStudent;
import React, { useState, useEffect, useRef } from "react";
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
} from "antd";
import { motion } from "framer-motion";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import ViewStudents from "./ViewStudents/ViewStudents";
import useAuth from "../../utils/config/useAuth";

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

const { Title } = Typography;
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

  if (!currentUser || !currentUser.uid) {
    message.error("User not logged in!");
    return null;
  }
  console.log("Current user UID:", currentUser.uid);

  // Establish WebSocket connection once on mount
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");

    ws.onopen = () => {
      console.log("WebSocket connection established.");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.fingerprintID && scanning) {
          // When scanner data is received and scanning is active:
          form.setFieldsValue({ studentId: data.fingerprintID });
          setStudentIdPresent(true);
          message.success("ID received from scanner: " + data.fingerprintID);
          setScanning(false);
          if (scanTimeoutRef.current) {
            clearTimeout(scanTimeoutRef.current);
            scanTimeoutRef.current = null;
          }
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

    return () => {
      ws.close();
    };
  }, [form, scanning]);

  // Trigger scanning: start waiting for scanner data and a 20-second timeout.
  const handleScan = () => {
    setScanning(true);
    message.info("Waiting for scanner data...");
    // Set a timeout: if no data is received within 20 seconds, stop scanning.
    scanTimeoutRef.current = setTimeout(() => {
      setScanning(false);
      message.error("Scanning timed out. Please try again.");
      scanTimeoutRef.current = null;
    }, 20000); // 20 seconds
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
            <Button onClick={handleScan} loading={scanning}>
              {scanning ? "Scanning..." : "Scan ID"}
            </Button>
          </Form.Item>

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
