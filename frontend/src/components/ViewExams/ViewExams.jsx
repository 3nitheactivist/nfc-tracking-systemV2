import React, { useState, useEffect } from "react";
import {
  Layout,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  List,
  Card,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import useAuth from "../../utils/config/useAuth";
import moment from "moment";
import { useNavigate } from "react-router-dom";

const { Content } = Layout;

const ViewExams = () => {
  const [exams, setExams] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [form] = Form.useForm();
  const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
  const [selectedExamForStudents, setSelectedExamForStudents] = useState(null);

  const { currentUser } = useAuth();
  const db = getFirestore();
  const Navigate = useNavigate();

  const styles = {
    pageContainer: {
      minHeight: "100vh",
      backgroundColor: "#fff",
      padding: "20px",
    },
    contentWrapper: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 20px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
      flexWrap: "wrap",
      gap: "16px",
    },
    headerTitle: {
      fontSize: "24px",
      fontWeight: "600",
      margin: 0,
    },
    examGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "24px",
      padding: "20px 0",
    },
    examCard: {
      border: "1px solid #e8e8e8",
      borderRadius: "8px",
      padding: "20px",
      backgroundColor: "#fff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      transition: "box-shadow 0.3s ease",
    },
    examTitle: {
      fontSize: "18px",
      fontWeight: "600",
      marginBottom: "8px",
      color: "#262626",
    },
    examCode: {
      fontSize: "14px",
      color: "#8c8c8c",
      marginBottom: "16px",
    },
    examDetail: {
      fontSize: "14px",
      color: "#595959",
      marginBottom: "8px",
    },
    buttonGroup: {
      display: "flex",
      gap: "8px",
      marginTop: "20px",
    },
    primaryButton: {
      backgroundColor: "#00923f",
      borderColor: "#00923f",
      color: "#fff",
      flex: 1,
      padding: "8px 16px",
      borderRadius: "4px",
      cursor: "pointer",
      border: "none",
      transition: "background-color 0.3s ease",
    },
    deleteButton: {
      backgroundColor: "#ff4d4f",
      borderColor: "#ff4d4f",
      color: "#fff",
      flex: 1,
      padding: "8px 16px",
      borderRadius: "4px",
      cursor: "pointer",
      border: "none",
      transition: "background-color 0.3s ease",
    },
    modal: {
      width: "100%",
      maxWidth: "500px",
    },
    form: {
      width: "100%",
    },
    formItem: {
      marginBottom: "16px",
    },
    input: {
      width: "100%",
      padding: "8px 12px",
      borderRadius: "4px",
      border: "1px solid #d9d9d9",
    },
    select: {
      width: "100%",
    },
  };

  useEffect(() => {
    if (!currentUser) return;
    const examsRef = collection(db, "Exams");
    const q = query(examsRef, where("createdBy", "==", currentUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedExams = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const examDate =
            data.examDate instanceof Timestamp ? data.examDate : null;
          return { id: docSnap.id, ...data, examDate };
        });
        const sortedExams = fetchedExams.sort(
          (a, b) => a.examDate.toMillis() - b.examDate.toMillis()
        );
        setExams(sortedExams);
      },
      (error) => {
        console.error("Error fetching exams:", error);
        message.error("Failed to fetch exams.");
      }
    );
    return () => unsubscribe();
  }, [db, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const studentsRef = collection(db, "Students");
    const q = query(studentsRef, where("userId", "==", currentUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const options = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            label: `${data.firstName || ""} ${data.lastName || ""} - ${
              data.matricNumber || "N/A"
            }`,
            value: docSnap.id,
          };
        });
        setStudentOptions(options);
      },
      (error) => {
        console.error("Error fetching students:", error);
        message.error("Failed to fetch student list.");
      }
    );
    return () => unsubscribe();
  }, [db, currentUser]);

  const getExamMoment = (examDate) => {
    if (!examDate) return null;
    return examDate instanceof Timestamp
      ? moment(examDate.toDate())
      : moment(examDate);
  };

  const handleAddExam = () => {
    setEditingExam(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditExam = (exam) => {
    setEditingExam(exam);
    form.setFieldsValue({
      courseName: exam.courseName,
      courseCode: exam.courseCode,
      date: exam.examDate ? moment(exam.examDate.toDate()) : null,
      examLocation: exam.examLocation,
      students: exam.enrolledStudents || [],
    });
    setIsModalVisible(true);
  };

  const handleDeleteExam = async (examId) => {
    try {
      // First, delete all related attendance records
      const attendanceRef = collection(db, "AttendanceRecords");
      const attendanceQuery = query(attendanceRef, where("examId", "==", examId));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      // Delete attendance records in batch
      const deletePromises = attendanceSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Then delete the exam
      await deleteDoc(doc(db, "Exams", examId));
      
      message.success("Exam and related attendance records deleted successfully");
    } catch (error) {
      console.error("Error deleting exam:", error);
      message.error("Failed to delete exam and related records.");
    }
  };

  const onFinish = async (values) => {
    if (!currentUser) {
      message.error("User not logged in");
      return;
    }
    setIsSubmitting(true);
    try {
      const examDate = Timestamp.fromDate(values.date.toDate());
      const examData = {
        courseName: values.courseName,
        courseCode: values.courseCode,
        examDate,
        examLocation: values.examLocation,
        enrolledStudents: values.students || [],
        updatedAt: serverTimestamp(),
      };
      if (editingExam) {
        await updateDoc(doc(db, "Exams", editingExam.id), examData);
        message.success("Exam updated successfully");
      } else {
        examData.createdBy = currentUser.uid;
        await addDoc(collection(db, "Exams"), examData);
        message.success("Exam scheduled successfully");
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error saving exam:", error);
      message.error("Failed to save exam.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const ExamModal = () => (
    <Modal
      title={editingExam ? "Edit Exam" : "Schedule New Exam"}
      open={isModalVisible}
      onCancel={() => {
        if (!isSubmitting) {
          setIsModalVisible(false);
          form.resetFields();
        }
      }}
      footer={null}
      maskClosable={!isSubmitting}
      closable={!isSubmitting}
      style={styles.modal}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={styles.form}
      >
        <Form.Item
          name="courseName"
          label="Course Name"
          rules={[{ required: true, message: "Please enter course name" }]}
          style={styles.formItem}
        >
          <Input
            placeholder="Course Name"
            disabled={isSubmitting}
            style={styles.input}
          />
        </Form.Item>
        <Form.Item
          name="courseCode"
          label="Course Code"
          rules={[{ required: true, message: "Please enter course code" }]}
          style={styles.formItem}
        >
          <Input
            placeholder="Course Code"
            disabled={isSubmitting}
            style={styles.input}
          />
        </Form.Item>
        <Form.Item
          name="date"
          label="Exam Date"
          rules={[{ required: true, message: "Please select exam date" }]}
          style={styles.formItem}
        >
          <DatePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            style={{ ...styles.input }}
            disabled={isSubmitting}
          />
        </Form.Item>
        <Form.Item
          name="examLocation"
          label="Location"
          rules={[{ required: true, message: "Please enter exam location" }]}
          style={styles.formItem}
        >
          <Input
            placeholder="Exam Location"
            disabled={isSubmitting}
            style={styles.input}
          />
        </Form.Item>
        <Form.Item
          name="students"
          label="Assign Students"
          rules={[{ required: true, message: "Please select students" }]}
          style={styles.formItem}
        >
          <Select
            mode="multiple"
            placeholder="Select students"
            options={studentOptions}
            disabled={isSubmitting}
            style={styles.select}
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            style={styles.primaryButton}
            block
          >
            {editingExam ? "Update Exam" : "Schedule Exam"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );

  const StudentsModal = () => {
    const assignedStudents =
      selectedExamForStudents && selectedExamForStudents.enrolledStudents
        ? studentOptions.filter((opt) =>
            selectedExamForStudents.enrolledStudents.includes(opt.value)
          )
        : [];

    return (
      <Modal
        title="Assigned Students"
        open={isStudentModalVisible}
        onCancel={() => setIsStudentModalVisible(false)}
        footer={null}
        style={styles.modal}
      >
        {assignedStudents.length > 0 ? (
          <List
            dataSource={assignedStudents}
            renderItem={(item) => <List.Item>{item.label}</List.Item>}
          />
        ) : (
          <p>No students assigned to this exam.</p>
        )}
      </Modal>
    );
  };

  return (
    <Layout>
      <Button
        type="primary"
        icon={<ArrowLeftOutlined />}
        onClick={() => Navigate(-1)}
        style={{
          marginBottom: "16px",
          backgroundColor: "#00923f",
          borderColor: "#00923f",
          width: "12%"
        }}
      >
        Back
      </Button>
      <Content style={styles.pageContainer}>
        <div style={styles.contentWrapper}>
          <div style={styles.header}>
            <h2 style={styles.headerTitle}>Upcoming Exams</h2>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddExam}
              style={styles.primaryButton}
            >
              Schedule New Exam
            </Button>
          </div>

          <div style={styles.examGrid}>
            {exams.map((exam) => {
              const examMoment = getExamMoment(exam.examDate);
              return (
                <div key={exam.id} style={styles.examCard}>
                  <h3 style={styles.examTitle}>{exam.courseName}</h3>
                  <p style={styles.examCode}>{exam.courseCode}</p>
                  <p style={styles.examDetail}>
                    Date:{" "}
                    {examMoment
                      ? examMoment.format("MMM DD, YYYY HH:mm")
                      : "N/A"}
                  </p>
                  <p style={styles.examDetail}>
                    Location: {exam.examLocation || "N/A"}
                  </p>
                  <p style={styles.examDetail}>
                    Students:{" "}
                    {exam.enrolledStudents ? exam.enrolledStudents.length : 0}
                  </p>
                  <div style={styles.buttonGroup}>
                    <button
                      onClick={() => {
                        setSelectedExamForStudents(exam);
                        setIsStudentModalVisible(true);
                      }}
                      style={styles.primaryButton}
                    >
                      View Students
                    </button>
                    <button
                      onClick={() => handleEditExam(exam)}
                      style={styles.primaryButton}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <ExamModal />
          <StudentsModal />
        </div>
      </Content>
    </Layout>
  );
};

export default ViewExams;
