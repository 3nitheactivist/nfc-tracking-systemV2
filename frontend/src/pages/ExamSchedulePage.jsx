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
  Button,
  Tabs,
  Empty,
  message,
} from "antd";
import { IoMdCalendar } from "react-icons/io";
import { FaUserGraduate } from "react-icons/fa6";
import { MdDocumentScanner } from "react-icons/md";
import { BsTable } from "react-icons/bs";
import { UserOutlined } from "@ant-design/icons";
import useAuth from "../utils/config/useAuth";
import ExamAttendanceScanner from "../components/ExamAttendance/ExamAttendanceScanner";
import ExamScheduleForm from '../components/ExamSchedule/ExamScheduleForm';

// Import Firestore functions
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
const { TabPane } = Tabs;

const ExamSchedulePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const db = getFirestore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);

  // Fetch upcoming exams
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

  // Fetch recent enrollments
  useEffect(() => {
    if (!currentUser) return;
    const studentsQuery = query(
      collection(db, "students"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
    const unsubscribeStudents = onSnapshot(studentsQuery, (querySnapshot) => {
      const studentsData = [];
      querySnapshot.forEach((doc) => {
        studentsData.push({ 
          id: doc.id, 
          ...doc.data(),
          timestamp: doc.data().createdAt || new Date()
        });
      });
      setRecentEnrollments(studentsData);
    });
    return () => unsubscribeStudents();
  }, [db, currentUser]);

  // Framer Motion variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Dashboard content
  const DashboardContent = () => (
    <Row gutter={[16, 16]}>
      {/* Quick Actions */}
      <Col xs={24} lg={6}>
        <motion.div variants={cardVariants}>
          <Card title="Quick Actions" className="h-full">
            <div className="space-y-2">
              <Button
                icon={<IoMdCalendar />}
                block
                onClick={() => setActiveTab('schedule')}
              >
                Schedule New Exam
              </Button>
              <Button
                icon={<BsTable />}
                block
                onClick={() => setActiveTab('attendance')}
                type="primary"
              >
                Scan Attendance
              </Button>
              <Button
                icon={<MdDocumentScanner />}
                block
                onClick={() => navigate("/viewExams")}
              >
                View All Exams
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
              <Empty description="No upcoming exams" />
            )}
          </Card>
        </motion.div>
      </Col>

      {/* Recent Enrollments */}
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
                renderItem={(student) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
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
                          {student.profileImage?.data ? (
                            <img 
                              src={student.profileImage.data}
                              alt={student.name}
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
                      }
                      title={student.name || "Unknown Student"}
                      description={
                        <div>
                          <div>School ID: {student.schoolId || "N/A"}</div>
                          <div>NFC ID: {student.nfcTagId || "N/A"}</div>
                          <div>Enrolled: {student.timestamp instanceof Object && student.timestamp.toDate ? 
                            new Date(student.timestamp.toDate()).toLocaleDateString() : 
                            new Date(student.timestamp).toLocaleDateString()}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No recent enrollments" />
            )}
          </Card>
        </motion.div>
      </Col>
    </Row>
  );

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          style={{ marginBottom: 24 }}
        >
          <TabPane tab="Dashboard" key="dashboard">
            <DashboardContent />
          </TabPane>
          
          <TabPane tab="Schedule Exam" key="schedule">
            <ExamScheduleForm 
              onSuccess={() => {
                message.success('Exam scheduled successfully');
                setActiveTab('dashboard'); // Optionally return to dashboard
              }}
            />
          </TabPane>
          
          <TabPane tab="Attendance Scanner" key="attendance">
            <ExamAttendanceScanner />
          </TabPane>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default ExamSchedulePage;

