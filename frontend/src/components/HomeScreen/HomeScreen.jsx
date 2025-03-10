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
import BluetoothButton from "../BluetoothButton/BluetoothButton";

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
      orderBy("examDate", "asc"),
      limit(5)
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
              <div style={{margin: "auto", paddingBottom: "20px"}}>
        <BluetoothButton />
        </div>
        
        <Row gutter={[16, 16]}>

          {/* Quick Actions */}
          <Col xs={24} lg={6}>
          
            <motion.div variants={cardVariants}>
              <Card title="Quick Actions" className="h-full">
                <div className="space-y-2">
                  {/* <Button
                    type="primary"
                    icon={<MdDocumentScanner />}
                    block
                    onClick={() => navigate("/scanNFC")}
                    className="bg-green-600"
                  >
                    Scan NFC
                  </Button> */}

                  <Button
                    icon={<FaUserGraduate />}
                    block
                    onClick={() => navigate("/enrollStudents")}
                  >
                    Enroll/View Students
                  </Button>
                  <Button
                    icon={<IoMdCalendar />}
                    block
                    onClick={() => navigate("/viewExams")}
                  >
                    Schedule/View Exams
                  </Button>
                  <Button
                    icon={<BsTable />}
                    block
                    onClick={() => navigate("/viewExamAttendance")}
                  >
                    Scan/View Attendance
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
                    items={upcomingExams.slice(0, 5).map((exam) => ({
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
