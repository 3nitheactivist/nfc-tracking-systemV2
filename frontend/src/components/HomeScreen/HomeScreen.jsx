// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import {
//   Card,
//   Row,
//   Col,
//   Typography,
//   Badge,
//   Timeline,
//   List,
//   Avatar,
//   Alert,
//   Button,
// } from "antd";
// import { IoMdCalendar, IoMdNotifications } from "react-icons/io";
// import { FaUserGraduate, FaClipboardList } from "react-icons/fa6";
// import { MdDocumentScanner } from "react-icons/md";

// import { BsTable } from "react-icons/bs";
// import useAuth from "../../utils/config/useAuth";

// const { Title, Text } = Typography;

// const HomeScreen = () => {
//   const navigate = useNavigate();
//   const { currentUser } = useAuth();

//   // Sample data - replace with actual Firebase data
//   const upcomingExams = [
//     { title: "Mathematics Final", date: "2025-03-01", room: "Room 101" },
//     { title: "Physics Midterm", date: "2025-03-05", room: "Room 203" },
//     { title: "Chemistry Lab", date: "2025-03-10", room: "Lab A" },
//   ];

//   const recentEnrollments = [
//     { name: "John Doe", id: "2025001", date: "2025-02-20" },
//     { name: "Jane Smith", id: "2025002", date: "2025-02-19" },
//     { name: "Bob Wilson", id: "2025003", date: "2025-02-18" },
//   ];

//   const notifications = [
//     {
//       type: "warning",
//       message: "Invalid NFC tag detected for student ID 2025001",
//     },
//     { type: "info", message: "New exam schedule uploaded for Physics class" },
//     { type: "success", message: "Successfully enrolled 5 new students" },
//   ];

//   const cardVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { opacity: 1, y: 0 },
//   };

//   return (
//     <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
//       <motion.div
//         initial="hidden"
//         animate="visible"
//         variants={{
//           visible: { transition: { staggerChildren: 0.1 } },
//         }}
//       >
//         {/* <header className="transparent-container">
//           {" "}
//           <div className="nav-data">
//             {" "}
//             <div className="rando-text">he</div>
//             <img src={logo} alt="School Logo" className="logo-main" />
//             <div className="menu-bar">
//               <RiMenu3Line onClick={toggleSidebar} className="menu-icon" />
//             </div>
//           </div>
//         </header> */}
//         <Row gutter={[16, 16]}>
//           {/* Quick Actions */}
//           <Col xs={24} lg={6}>
//             <motion.div variants={cardVariants}>
//               <Card title="Quick Actions" className="h-full">
//                 <div className="space-y-2">
//                   <Button
//                     type="primary"
//                     icon={<MdDocumentScanner />}
//                     block
//                     onClick={() => navigate("/scanNFC")}
//                     className="bg-green-600"
//                   >
//                     Scan NFC
//                   </Button>
//                   <Button
//                     icon={<IoMdCalendar />}
//                     block
//                     onClick={() => navigate("/viewExams")}
//                   >
//                     View Exams
//                   </Button>
//                   <Button
//                     icon={<FaUserGraduate />}
//                     block
//                     onClick={() => navigate("/enrollStudents")}
//                   >
//                     Enroll Students
//                   </Button>
//                   <Button
//                     icon={<BsTable />}
//                     block
//                     onClick={() => navigate("/viewExamAttendance")}
//                   >
//                     View Attendance
//                   </Button>
//                 </div>
//               </Card>
//             </motion.div>
//           </Col>

//           {/* Upcoming Exams */}
//           <Col xs={24} lg={10}>
//             <motion.div variants={cardVariants}>
//               <Card
//                 title="Upcoming Exams"
//                 extra={<a href="/viewExams">View All</a>}
//               >
//                 <Timeline
//                   items={upcomingExams.map((exam) => ({
//                     color: "green",
//                     children: (
//                       <div>
//                         <Text strong>{exam.title}</Text>
//                         <br />
//                         <Text type="secondary">
//                           {new Date(exam.date).toLocaleDateString()} -{" "}
//                           {exam.room}
//                         </Text>
//                       </div>
//                     ),
//                   }))}
//                 />
//               </Card>
//             </motion.div>
//           </Col>

//           {/* Recent Enrollments */}
//           <Col xs={24} lg={8}>
//             <motion.div variants={cardVariants}>
//               <Card
//                 title="Recent Enrollments"
//                 extra={<Badge count={recentEnrollments.length} />}
//               >
//                 <List
//                   itemLayout="horizontal"
//                   dataSource={recentEnrollments}
//                   renderItem={(item) => (
//                     <List.Item>
//                       <List.Item.Meta
//                         avatar={
//                           <Avatar style={{ backgroundColor: "#00923f" }}>
//                             {item.name[0]}
//                           </Avatar>
//                         }
//                         title={item.name}
//                         description={`ID: ${item.id} - Enrolled: ${new Date(
//                           item.date
//                         ).toLocaleDateString()}`}
//                       />
//                     </List.Item>
//                   )}
//                 />
//               </Card>
//             </motion.div>
//           </Col>

//           {/* Notifications */}
//           <Col xs={24}>
//             <motion.div variants={cardVariants}>
//               <Card
//                 title={
//                   <span>
//                     <IoMdNotifications style={{ marginRight: 8 }} />
//                     Notifications
//                   </span>
//                 }
//               >
//                 <div className="space-y-4">
//                   {notifications.map((notification, index) => (
//                     <Alert
//                       key={index}
//                       message={notification.message}
//                       type={notification.type}
//                       showIcon
//                     />
//                   ))}
//                 </div>
//               </Card>
//             </motion.div>
//           </Col>
//         </Row>
//       </motion.div>
//     </div>
//   );
// };

// export default HomeScreen;
// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import {
//   Card,
//   Row,
//   Col,
//   Typography,
//   Badge,
//   Timeline,
//   List,
//   Avatar,
//   Button,
// } from "antd";
// import { IoMdCalendar } from "react-icons/io";
// import { FaUserGraduate } from "react-icons/fa6";
// import { MdDocumentScanner } from "react-icons/md";
// import { BsTable } from "react-icons/bs";
// import useAuth from "../../utils/config/useAuth";

// // Import Firestore functions from Firebase
// import { getFirestore, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

// const { Title, Text } = Typography;

// const HomeScreen = () => {
//   const navigate = useNavigate();
//   const { currentUser } = useAuth();
//   const db = getFirestore();

//   // State for upcoming exams from the "Exams" collection
//   const [upcomingExams, setUpcomingExams] = useState([]);
//   // State for recent student enrollments from the "Students" collection
//   const [recentEnrollments, setRecentEnrollments] = useState([]);

//   // Fetch upcoming exams, ordered by examDate ascending
//   useEffect(() => {
//     const examsQuery = query(
//       collection(db, "Exams"),
//       orderBy("examDate", "asc")
//     );
//     const unsubscribeExams = onSnapshot(examsQuery, (querySnapshot) => {
//       const examsData = [];
//       querySnapshot.forEach((doc) => {
//         examsData.push({ id: doc.id, ...doc.data() });
//       });
//       setUpcomingExams(examsData);
//     });
//     return () => unsubscribeExams();
//   }, [db]);

//   // Fetch recent student enrollments, ordered by enrollmentDate descending (limit to 5)
//   useEffect(() => {
//     const studentsQuery = query(
//       collection(db, "Students"),
//       orderBy("enrollmentDate", "desc"),
//       limit(5)
//     );
//     const unsubscribeStudents = onSnapshot(studentsQuery, (querySnapshot) => {
//       const studentsData = [];
//       querySnapshot.forEach((doc) => {
//         studentsData.push({ id: doc.id, ...doc.data() });
//       });
//       setRecentEnrollments(studentsData);
//     });
//     return () => unsubscribeStudents();
//   }, [db]);

//   // Framer Motion variants for card animations
//   const cardVariants = {
//     hidden: { opacity: 0, y: 20 },
//     visible: { opacity: 1, y: 0 },
//   };

//   return (
//     <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
//       <motion.div
//         initial="hidden"
//         animate="visible"
//         variants={{
//           visible: { transition: { staggerChildren: 0.1 } },
//         }}
//       >
//         <Row gutter={[16, 16]}>
//           {/* Quick Actions */}
//           <Col xs={24} lg={6}>
//             <motion.div variants={cardVariants}>
//               <Card title="Quick Actions" className="h-full">
//                 <div className="space-y-2">
//                   <Button
//                     type="primary"
//                     icon={<MdDocumentScanner />}
//                     block
//                     onClick={() => navigate("/scanNFC")}
//                     className="bg-green-600"
//                   >
//                     Scan NFC
//                   </Button>
//                   <Button
//                     icon={<IoMdCalendar />}
//                     block
//                     onClick={() => navigate("/viewExams")}
//                   >
//                     View Exams
//                   </Button>
//                   <Button
//                     icon={<FaUserGraduate />}
//                     block
//                     onClick={() => navigate("/enrollStudents")}
//                   >
//                     Enroll Students
//                   </Button>
//                   <Button
//                     icon={<BsTable />}
//                     block
//                     onClick={() => navigate("/viewExamAttendance")}
//                   >
//                     View Attendance
//                   </Button>
//                 </div>
//               </Card>
//             </motion.div>
//           </Col>

//           {/* Upcoming Exams */}
//           <Col xs={24} lg={10}>
//             <motion.div variants={cardVariants}>
//               <Card title="Upcoming Exams" extra={<a href="/viewExams">View All</a>}>
//                 <Timeline
//                   items={upcomingExams.map((exam) => ({
//                     color: "green",
//                     children: (
//                       <div>
//                         <Text strong>
//                           {exam.courseName} {exam.courseCode ? `(${exam.courseCode})` : ""}
//                         </Text>
//                         <br />
//                         <Text type="secondary">
//                           {new Date(exam.examDate.seconds * 1000).toLocaleDateString()} - {exam.examLocation}
//                         </Text>
//                       </div>
//                     ),
//                   }))}
//                 />
//               </Card>
//             </motion.div>
//           </Col>

//           {/* Recent Enrollments */}
//           <Col xs={24} lg={8}>
//             <motion.div variants={cardVariants}>
//               <Card title="Recent Enrollments" extra={<Badge count={recentEnrollments.length} />}>
//                 <List
//                   itemLayout="horizontal"
//                   dataSource={recentEnrollments}
//                   renderItem={(item) => (
//                     <List.Item>
//                       <List.Item.Meta
//                         avatar={
//                           <Avatar style={{ backgroundColor: "#00923f" }}>
//                             {item.name?.[0] || "S"}
//                           </Avatar>
//                         }
//                         title={item.name}
//                         description={`ID: ${item.nfcTagId || item.id} - Enrolled: ${new Date(
//                           item.enrollmentDate.seconds * 1000
//                         ).toLocaleDateString()}`}
//                       />
//                     </List.Item>
//                   )}
//                 />
//               </Card>
//             </motion.div>
//           </Col>
//         </Row>
//       </motion.div>
//     </div>
//   );
// };

// export default HomeScreen;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Card,
  Row,
  Col,
  Typography,
  Badge,
  Timeline,
  List,
  Avatar,
  Button,
} from "antd";
import { IoMdCalendar } from "react-icons/io";
import { FaUserGraduate } from "react-icons/fa6";
import { MdDocumentScanner } from "react-icons/md";
import { BsTable } from "react-icons/bs";
import useAuth from "../../utils/config/useAuth";

// Import Firestore functions from Firebase
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

const { Title, Text } = Typography;

const HomeScreen = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const db = getFirestore();

  // State for upcoming exams from the "Exams" collection
  const [upcomingExams, setUpcomingExams] = useState([]);
  // State for recent student enrollments from the "Students" collection
  const [recentEnrollments, setRecentEnrollments] = useState([]);

  // Fetch upcoming exams, filtered by the current user's uid (createdBy) and ordered by examDate ascending
  useEffect(() => {
    if (!currentUser) return;
    const examsQuery = query(
      collection(db, "Exams"),
      where("createdBy", "==", currentUser.uid),
      orderBy("examDate", "asc")
    );
    const unsubscribeExams = onSnapshot(examsQuery, (querySnapshot) => {
      const examsData = [];
      querySnapshot.forEach((doc) => {
        examsData.push({ id: doc.id, ...doc.data() });
      });
      setUpcomingExams(examsData);
    });
    return () => unsubscribeExams();
  }, [db, currentUser]);

  // Fetch recent student enrollments, filtered by the current user's uid (userId) and ordered by enrollmentDate descending (limit to 5)
  useEffect(() => {
    if (!currentUser) return;
    const studentsQuery = query(
      collection(db, "Students"),
      where("userId", "==", currentUser.uid),
      orderBy("enrollmentDate", "desc"),
      limit(5)
    );
    const unsubscribeStudents = onSnapshot(studentsQuery, (querySnapshot) => {
      const studentsData = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ id: doc.id, ...doc.data() });
      });
      setRecentEnrollments(studentsData);
    });
    return () => unsubscribeStudents();
  }, [db, currentUser]);

  // Framer Motion variants for card animations
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        <Row gutter={[16, 16]}>
          {/* Quick Actions */}
          <Col xs={24} lg={6}>
            <motion.div variants={cardVariants}>
              <Card title="Quick Actions" className="h-full">
                <div className="space-y-2">
                  <Button
                    type="primary"
                    icon={<MdDocumentScanner />}
                    block
                    onClick={() => navigate("/scanNFC")}
                    className="bg-green-600"
                  >
                    Scan NFC
                  </Button>
                  <Button
                    icon={<IoMdCalendar />}
                    block
                    onClick={() => navigate("/viewExams")}
                  >
                    View Exams
                  </Button>
                  <Button
                    icon={<FaUserGraduate />}
                    block
                    onClick={() => navigate("/enrollStudents")}
                  >
                    Enroll Students
                  </Button>
                  <Button
                    icon={<BsTable />}
                    block
                    onClick={() => navigate("/viewExamAttendance")}
                  >
                    View Attendance
                  </Button>
                </div>
              </Card>
            </motion.div>
          </Col>

          {/* Upcoming Exams */}
          <Col xs={24} lg={10}>
            <motion.div variants={cardVariants}>
              <Card
                title="Upcoming Exams"
                extra={<a href="/viewExams">View All</a>}
              >
                {upcomingExams.length > 0 ? (
                  <Timeline
                    items={upcomingExams.map((exam) => ({
                      color: "green",
                      children: (
                        <div>
                          <Text strong>
                            {exam.courseName}{" "}
                            {exam.courseCode ? `(${exam.courseCode})` : ""}
                          </Text>
                          <br />
                          <Text type="secondary">
                            {new Date(
                              exam.examDate.seconds * 1000
                            ).toLocaleDateString()}{" "}
                            - {exam.examLocation}
                          </Text>
                        </div>
                      ),
                    }))}
                  />
                ) : (
                  <Text type="secondary">No upcoming exams available.</Text>
                )}
              </Card>
            </motion.div>
          </Col>

          {/* Recent Enrollments */}
          {/* <Col xs={24} lg={8}>
            <motion.div variants={cardVariants}>
              <Card title="Recent Enrollments" extra={<Badge count={recentEnrollments.length} />}>
                {recentEnrollments.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={recentEnrollments}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar style={{ backgroundColor: "#00923f" }}>
                              {item.name?.[0] || "S"}
                            </Avatar>
                          }
                          title={item.name}
                          description={`ID: ${item.nfcTagId || item.id} - Enrolled: ${new Date(
                            item.enrollmentDate.seconds * 1000
                          ).toLocaleDateString()}`}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text type="secondary">No recent enrollments available.</Text>
                )}
              </Card>
            </motion.div>
          </Col> */}
          <Col xs={24} lg={8}>
            <motion.div variants={cardVariants}>
              <Card
                title="Recent Enrollments"
                extra={<Badge count={recentEnrollments.length} />}
              >
                {recentEnrollments.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={recentEnrollments}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar style={{ backgroundColor: "#00923f" }}>
                              {(item.firstName && item.firstName[0]) || "S"}
                            </Avatar>
                          }
                          title={`${item.firstName || ""} ${
                            item.lastName || ""
                          }`}
                          description={`Matric: ${
                            item.matricNumber || "N/A"
                          } | NFC ID: ${
                            item.nfcTagId || item.id
                          } - Enrolled: ${new Date(
                            item.enrollmentDate.seconds * 1000
                          ).toLocaleDateString()}`}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text type="secondary">No recent enrollments available.</Text>
                )}
              </Card>
            </motion.div>
          </Col>
        </Row>
      </motion.div>
    </div>
  );
};

export default HomeScreen;
