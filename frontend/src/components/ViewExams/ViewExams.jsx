// // // import React, { useState, useEffect } from "react";
// // // import {
// // //   Layout,
// // //   Modal,
// // //   Form,
// // //   Input,
// // //   DatePicker,
// // //   Select,
// // //   Button,
// // //   List,
// // //   Card,
// // //   message,
// // // } from "antd";
// // // import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
// // // import {
// // //   getFirestore,
// // //   collection,
// // //   query,
// // //   where,
// // //   onSnapshot,
// // //   addDoc,
// // //   updateDoc,
// // //   deleteDoc,
// // //   doc,
// // //   Timestamp,
// // // } from "firebase/firestore";
// // // import useAuth from "../../utils/config/useAuth";
// // // import moment from "moment";

// // // const { Content } = Layout;

// // // const ViewExams = () => {
// // //   const [exams, setExams] = useState([]);
// // //   const [isModalVisible, setIsModalVisible] = useState(false);
// // //   const [isSubmitting, setIsSubmitting] = useState(false);
// // //   const [editingExam, setEditingExam] = useState(null);
// // //   const [form] = Form.useForm();
// // //   const { currentUser } = useAuth();
// // //   const db = getFirestore();

// // //   useEffect(() => {
// // //     if (!currentUser) return;

// // //     const examsRef = collection(db, "Exams");
// // //     const q = query(examsRef, where("createdBy", "==", currentUser.uid));

// // //     const unsubscribe = onSnapshot(
// // //       q,
// // //       (snapshot) => {
// // //         const fetchedExams = snapshot.docs.map((docSnap) => {
// // //           const data = docSnap.data();
// // //           return {
// // //             id: docSnap.id,
// // //             ...data,
// // //             examDate: data.examDate instanceof Timestamp ? data.examDate : null,
// // //           };
// // //         });

// // //         // Sort exams by date (ascending order)
// // //         const sortedExams = fetchedExams.sort(
// // //           (a, b) => a.examDate.toMillis() - b.examDate.toMillis()
// // //         );
// // //         setExams(sortedExams);
// // //       },
// // //       (error) => {
// // //         console.error("Error fetching exams:", error);
// // //         message.error("Failed to fetch exams.");
// // //       }
// // //     );

// // //     return () => unsubscribe();
// // //   }, [db, currentUser]);

// // //   const handleAddExam = () => {
// // //     setEditingExam(null);
// // //     form.resetFields();
// // //     setIsModalVisible(true);
// // //   };

// // //   const handleEditExam = (exam) => {
// // //     setEditingExam(exam);
// // //     form.setFieldsValue({
// // //       courseName: exam.courseName,
// // //       courseCode: exam.courseCode,
// // //       date: exam.examDate ? moment(exam.examDate.toDate()) : null,
// // //       examLocation: exam.examLocation,
// // //     });
// // //     setIsModalVisible(true);
// // //   };

// // //   const handleDeleteExam = async (examId) => {
// // //     try {
// // //       await deleteDoc(doc(db, "Exams", examId));
// // //       message.success("Exam deleted successfully");
// // //     } catch (error) {
// // //       console.error("Error deleting exam:", error);
// // //       message.error("Failed to delete exam.");
// // //     }
// // //   };

// // //   const onFinish = async (values) => {
// // //     if (!currentUser) {
// // //       message.error("User not logged in");
// // //       return;
// // //     }

// // //     setIsSubmitting(true);
// // //     try {
// // //       const examDate = Timestamp.fromDate(values.date.toDate());
// // //       const examData = {
// // //         courseName: values.courseName,
// // //         courseCode: values.courseCode,
// // //         examDate,
// // //         examLocation: values.examLocation,
// // //         createdBy: currentUser.uid,
// // //       };

// // //       if (editingExam) {
// // //         await updateDoc(doc(db, "Exams", editingExam.id), examData);
// // //         message.success("Exam updated successfully");
// // //       } else {
// // //         await addDoc(collection(db, "Exams"), examData);
// // //         message.success("Exam added successfully");
// // //       }
// // //       setIsModalVisible(false);
// // //       form.resetFields();
// // //     } catch (error) {
// // //       console.error("Error saving exam:", error);
// // //       message.error("Failed to save exam.");
// // //     } finally {
// // //       setIsSubmitting(false);
// // //     }
// // //   };

// // //   return (
// // //     <Content style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
// // //       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
// // //         <h2>Upcoming Exams</h2>
// // //         <Button type="primary" icon={<PlusOutlined />} onClick={handleAddExam}>
// // //           Schedule New Exam
// // //         </Button>
// // //       </div>

// // //       <List
// // //         itemLayout="horizontal"
// // //         dataSource={exams}
// // //         renderItem={(exam) => (
// // //           <Card style={{ marginBottom: "16px" }}>
// // //             <List.Item
// // //               actions={[
// // //                 <Button type="link" icon={<EditOutlined />} onClick={() => handleEditExam(exam)}>
// // //                   Edit
// // //                 </Button>,
// // //                 <Button type="link" icon={<DeleteOutlined />} danger onClick={() => handleDeleteExam(exam.id)}>
// // //                   Delete
// // //                 </Button>,
// // //               ]}
// // //             >
// // //               <List.Item.Meta
// // //                 title={`${exam.courseName} (${exam.courseCode})`}
// // //                 description={`📅 ${exam.examDate ? moment(exam.examDate.toDate()).format("MMM DD, YYYY") : "No date set"} 📍 ${exam.examLocation || "No location set"}`}
// // //               />
// // //             </List.Item>
// // //           </Card>
// // //         )}
// // //       />

// // //       <Modal
// // //         title={editingExam ? "Edit Exam" : "Schedule New Exam"}
// // //         visible={isModalVisible}
// // //         onCancel={() => setIsModalVisible(false)}
// // //         footer={null}
// // //       >
// // //         <Form form={form} layout="vertical" onFinish={onFinish}>
// // //           <Form.Item name="courseName" label="Course Name" rules={[{ required: true, message: "Please enter course name" }]}>
// // //             <Input />
// // //           </Form.Item>
// // //           <Form.Item name="courseCode" label="Course Code" rules={[{ required: true, message: "Please enter course code" }]}>
// // //             <Input />
// // //           </Form.Item>
// // //           <Form.Item name="date" label="Exam Date" rules={[{ required: true, message: "Please select exam date" }]}>
// // //             <DatePicker style={{ width: "100%" }} />
// // //           </Form.Item>
// // //           <Form.Item name="examLocation" label="Location">
// // //             <Input placeholder="Optional" />
// // //           </Form.Item>
// // //           <Form.Item>
// // //             <Button type="primary" htmlType="submit" loading={isSubmitting} block>
// // //               {editingExam ? "Update Exam" : "Schedule Exam"}
// // //             </Button>
// // //           </Form.Item>
// // //         </Form>
// // //       </Modal>
// // //     </Content>
// // //   );
// // // };

// // // export default ViewExams;

// // import React, { useState, useEffect } from "react";
// // import {
// //   Layout,
// //   Modal,
// //   Form,
// //   Input,
// //   DatePicker,
// //   Select,
// //   Button,
// //   List,
// //   Card,
// //   message,
// // } from "antd";
// // import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
// // import {
// //   getFirestore,
// //   collection,
// //   query,
// //   where,
// //   onSnapshot,
// //   addDoc,
// //   updateDoc,
// //   deleteDoc,
// //   doc,
// //   Timestamp,
// //   serverTimestamp,
// // } from "firebase/firestore";
// // import useAuth from "../../utils/config/useAuth";
// // import moment from "moment";

// // const { Content } = Layout;

// // const ViewExams = () => {
// //   const [exams, setExams] = useState([]);
// //   const [studentOptions, setStudentOptions] = useState([]);

// //   // For scheduling modal
// //   const [isModalVisible, setIsModalVisible] = useState(false);
// //   const [isSubmitting, setIsSubmitting] = useState(false);
// //   const [editingExam, setEditingExam] = useState(null);
// //   const [form] = Form.useForm();

// //   // For viewing assigned students modal
// //   const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
// //   const [selectedExamForStudents, setSelectedExamForStudents] = useState(null);

// //   const { currentUser } = useAuth();
// //   const db = getFirestore();

// //   // ------------------------------------------------------------------
// //   // 1) Fetch exams created by current user
// //   // ------------------------------------------------------------------
// //   useEffect(() => {
// //     if (!currentUser) return;

// //     const examsRef = collection(db, "Exams");
// //     const q = query(examsRef, where("createdBy", "==", currentUser.uid));

// //     const unsubscribe = onSnapshot(
// //       q,
// //       (snapshot) => {
// //         const fetchedExams = snapshot.docs.map((docSnap) => {
// //           const data = docSnap.data();
// //           // Ensure examDate is a Firestore Timestamp
// //           const examDate =
// //             data.examDate instanceof Timestamp ? data.examDate : null;
// //           return { id: docSnap.id, ...data, examDate };
// //         });
// //         // Sort exams by date ascending
// //         const sortedExams = fetchedExams.sort(
// //           (a, b) => a.examDate.toMillis() - b.examDate.toMillis()
// //         );
// //         setExams(sortedExams);
// //       },
// //       (error) => {
// //         console.error("Error fetching exams:", error);
// //         message.error("Failed to fetch exams.");
// //       }
// //     );

// //     return () => unsubscribe();
// //   }, [db, currentUser]);

// //   // ------------------------------------------------------------------
// //   // 2) Fetch students for assignment options
// //   // ------------------------------------------------------------------
// //   useEffect(() => {
// //     if (!currentUser) return;

// //     const studentsRef = collection(db, "Students");
// //     const q = query(studentsRef, where("userId", "==", currentUser.uid));

// //     const unsubscribe = onSnapshot(
// //       q,
// //       (snapshot) => {
// //         const options = snapshot.docs.map((docSnap) => {
// //           const data = docSnap.data();
// //           return {
// //             label: `${data.firstName || ""} ${data.lastName || ""} - ${data.matricNumber || "N/A"}`,
// //             value: docSnap.id,
// //           };
// //         });
// //         setStudentOptions(options);
// //       },
// //       (error) => {
// //         console.error("Error fetching students:", error);
// //         message.error("Failed to fetch student list.");
// //       }
// //     );

// //     return () => unsubscribe();
// //   }, [db, currentUser]);

// //   // ------------------------------------------------------------------
// //   // 3) Helper: Convert Firestore Timestamp to moment
// //   // ------------------------------------------------------------------
// //   const getExamMoment = (examDate) => {
// //     if (!examDate) return null;
// //     if (examDate instanceof Timestamp) {
// //       return moment(examDate.toDate());
// //     }
// //     return moment(examDate);
// //   };

// //   // ------------------------------------------------------------------
// //   // 4) Handle "Schedule New Exam" button
// //   // ------------------------------------------------------------------
// //   const handleAddExam = () => {
// //     setEditingExam(null);
// //     form.resetFields();
// //     setIsModalVisible(true);
// //   };

// //   // ------------------------------------------------------------------
// //   // 5) Handle "Edit Exam"
// //   // ------------------------------------------------------------------
// //   const handleEditExam = (exam) => {
// //     setEditingExam(exam);
// //     form.setFieldsValue({
// //       courseName: exam.courseName,
// //       courseCode: exam.courseCode,
// //       date: exam.examDate ? getExamMoment(exam.examDate) : null,
// //       examLocation: exam.examLocation,
// //       students: exam.enrolledStudents || [],
// //     });
// //     setIsModalVisible(true);
// //   };

// //   // ------------------------------------------------------------------
// //   // 6) Handle "Delete Exam"
// //   // ------------------------------------------------------------------
// //   const handleDeleteExam = async (examId) => {
// //     try {
// //       await deleteDoc(doc(db, "Exams", examId));
// //       message.success("Exam deleted successfully");
// //     } catch (error) {
// //       console.error("Error deleting exam:", error);
// //       message.error("Failed to delete exam.");
// //     }
// //   };

// //   // ------------------------------------------------------------------
// //   // 7) Handle "View Students" button for a given exam
// //   // ------------------------------------------------------------------
// //   const handleViewStudentsForExam = (exam) => {
// //     setSelectedExamForStudents(exam);
// //     setIsStudentModalVisible(true);
// //   };

// //   // ------------------------------------------------------------------
// //   // 8) Submit exam form (create or update)
// //   // ------------------------------------------------------------------
// //   const onFinish = async (values) => {
// //     if (!currentUser) {
// //       message.error("User not logged in");
// //       return;
// //     }

// //     setIsSubmitting(true);
// //     try {
// //       const examDate = Timestamp.fromDate(values.date.toDate());
// //       const examData = {
// //         courseName: values.courseName,
// //         courseCode: values.courseCode,
// //         examDate,
// //         examLocation: values.examLocation,
// //         enrolledStudents: values.students || [],
// //         updatedAt: serverTimestamp(),
// //       };

// //       if (editingExam) {
// //         await updateDoc(doc(db, "Exams", editingExam.id), examData);
// //         message.success("Exam updated successfully");
// //       } else {
// //         examData.createdBy = currentUser.uid;
// //         await addDoc(collection(db, "Exams"), examData);
// //         message.success("Exam scheduled successfully");
// //       }

// //       setIsModalVisible(false);
// //       form.resetFields();
// //     } catch (error) {
// //       console.error("Error saving exam:", error);
// //       message.error("Failed to save exam.");
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   // ------------------------------------------------------------------
// //   // 9) Exam Scheduling/Editing Modal
// //   // ------------------------------------------------------------------
// //   const ExamModal = () => (
// //     <Modal
// //       title={editingExam ? "Edit Exam" : "Schedule New Exam"}
// //       open={isModalVisible}
// //       onCancel={() => {
// //         if (!isSubmitting) {
// //           setIsModalVisible(false);
// //           form.resetFields();
// //         }
// //       }}
// //       footer={null}
// //       maskClosable={!isSubmitting}
// //       closable={!isSubmitting}
// //     >
// //       <Form form={form} layout="vertical" onFinish={onFinish}>
// //         <Form.Item
// //           name="courseName"
// //           label="Course Name"
// //           rules={[{ required: true, message: "Please enter course name" }]}
// //         >
// //           <Input placeholder="Course Name" disabled={isSubmitting} />
// //         </Form.Item>
// //         <Form.Item
// //           name="courseCode"
// //           label="Course Code"
// //           rules={[{ required: true, message: "Please enter course code" }]}
// //         >
// //           <Input placeholder="Course Code" disabled={isSubmitting} />
// //         </Form.Item>
// //         <Form.Item
// //           name="date"
// //           label="Exam Date"
// //           rules={[{ required: true, message: "Please select exam date" }]}
// //         >
// //           <DatePicker
// //             showTime
// //             format="YYYY-MM-DD HH:mm"
// //             style={{ width: "100%" }}
// //             disabled={isSubmitting}
// //           />
// //         </Form.Item>
// //         <Form.Item
// //           name="examLocation"
// //           label="Location"
// //           rules={[{ required: true, message: "Please enter exam location" }]}
// //         >
// //           <Input placeholder="Exam Location" disabled={isSubmitting} />
// //         </Form.Item>
// //         <Form.Item
// //           name="students"
// //           label="Assign Students"
// //           rules={[{ required: true, message: "Please select students" }]}
// //         >
// //           <Select
// //             mode="multiple"
// //             placeholder="Select students"
// //             options={studentOptions}
// //             disabled={isSubmitting}
// //           />
// //         </Form.Item>
// //         <Form.Item>
// //           <Button
// //             type="primary"
// //             htmlType="submit"
// //             loading={isSubmitting}
// //             style={{ backgroundColor: "#00923f", borderColor: "#00923f" }}
// //             block
// //           >
// //             {editingExam ? "Update Exam" : "Schedule Exam"}
// //           </Button>
// //         </Form.Item>
// //       </Form>
// //     </Modal>
// //   );

// //   // ------------------------------------------------------------------
// //   // 10) Exam List View (Card List)
// //   // ------------------------------------------------------------------
// //   // const ExamList = () => (
// //   //   <List
// //   //     itemLayout="horizontal"
// //   //     dataSource={exams}
// //   //     renderItem={(exam) => {
// //   //       const examMoment = getExamMoment(exam.examDate);
// //   //       return (
// //   //         <Card style={{ marginBottom: "16px" , width: "100%"}}>
// //   //           <List.Item
// //   //             actions={[
// //   //               <Button type="link" onClick={() => handleViewStudentsForExam(exam)}>
// //   //                 View Students
// //   //               </Button>,
// //   //               <Button type="link" onClick={() => handleEditExam(exam)}>
// //   //                 Edit
// //   //               </Button>,
// //   //               <Button type="link" danger onClick={() => handleDeleteExam(exam.id)}>
// //   //                 Delete
// //   //               </Button>,
// //   //             ]}
// //   //           >
// //   //             <List.Item.Meta
// //   //               title={`${exam.courseName} (${exam.courseCode})`}
// //   //               description={`Date: ${
// //   //                 exam.examDate ? examMoment.format("MMM DD, YYYY HH:mm") : "N/A"
// //   //               } | Location: ${exam.examLocation || "N/A"} | Students: ${
// //   //                 exam.enrolledStudents ? exam.enrolledStudents.length : 0
// //   //               }`}
// //   //             />
// //   //           </List.Item>
// //   //         </Card>
// //   //       );
// //   //     }}
// //   //   />
// //   // );

// //   const ExamList = () => (
// //     <motion.div
// //       initial={{ opacity: 0 }}
// //       animate={{ opacity: 1 }}
// //       transition={{ duration: 0.5 }}
// //     >
// //       <List
// //         grid={{
// //           gutter: 16,
// //           xs: 1,
// //           sm: 1,
// //           md: 2,
// //           lg: 2,
// //           xl: 2,
// //           xxl: 2,
// //         }}
// //         dataSource={exams}
// //         renderItem={(exam) => {
// //           const examMoment = getExamMoment(exam.examDate);
// //           return (
// //             <List.Item>
// //               <Card
// //                 style={{
// //                   marginBottom: "16px",
// //                   borderRadius: "8px",
// //                   boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
// //                   display: "flex",
// //                   flexDirection: "column",
// //                   justifyContent: "space-between",
// //                   minHeight: "180px", // Ensures the card is not too tall
// //                   padding: "16px",
// //                 }}
// //               >
// //                 <div style={{ marginBottom: "16px" }}>
// //                   <h3 style={{ margin: 0 }}>{`${exam.courseName} (${exam.courseCode})`}</h3>
// //                   <p style={{ margin: "4px 0" }}>
// //                     Date: {exam.examDate ? examMoment.format("MMM DD, YYYY HH:mm") : "N/A"}
// //                   </p>
// //                   <p style={{ margin: "4px 0" }}>
// //                     Location: {exam.examLocation || "N/A"}
// //                   </p>
// //                   <p style={{ margin: "4px 0" }}>
// //                     Students: {exam.enrolledStudents ? exam.enrolledStudents.length : 0}
// //                   </p>
// //                 </div>
// //                 <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
// //                   <Button
// //                     type="primary"
// //                     onClick={() => handleViewStudentsForExam(exam)}
// //                     style={{
// //                       backgroundColor: "#00923f",
// //                       borderColor: "#00923f",
// //                       color: "#fff",
// //                     }}
// //                   >
// //                     View Students
// //                   </Button>
// //                   <Button
// //                     onClick={() => handleEditExam(exam)}
// //                     style={{
// //                       backgroundColor: "#00923f",
// //                       borderColor: "#00923f",
// //                       color: "#fff",
// //                     }}
// //                   >
// //                     Edit
// //                   </Button>
// //                   <Button
// //                     danger
// //                     onClick={() => handleDeleteExam(exam.id)}
// //                   >
// //                     Delete
// //                   </Button>
// //                 </div>
// //               </Card>
// //             </List.Item>
// //           );
// //         }}
// //       />
// //     </motion.div>
// //   );

// //   // ------------------------------------------------------------------
// //   // 11) Modal to View Assigned Students for an Exam
// //   // ------------------------------------------------------------------
// //   const StudentsModal = () => {
// //     // Filter studentOptions for those assigned to the selected exam
// //     const assignedStudents = selectedExamForStudents && selectedExamForStudents.enrolledStudents
// //       ? studentOptions.filter((opt) => selectedExamForStudents.enrolledStudents.includes(opt.value))
// //       : [];

// //     return (
// //       <Modal
// //         title="Assigned Students"
// //         open={isStudentModalVisible}
// //         onCancel={() => setIsStudentModalVisible(false)}
// //         footer={null}
// //       >
// //         {assignedStudents.length > 0 ? (
// //           <List
// //             dataSource={assignedStudents}
// //             renderItem={(item) => <List.Item>{item.label}</List.Item>}
// //           />
// //         ) : (
// //           <p>No students assigned to this exam.</p>
// //         )}
// //       </Modal>
// //     );
// //   };

// //   return (
// //     <Layout>
// //       <Content style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
// //         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
// //           <h2>Upcoming Exams</h2>
// //           <Button
// //             type="primary"
// //             icon={<PlusOutlined />}
// //             onClick={handleAddExam}
// //             style={{ backgroundColor: "#00923f", borderColor: "#00923f" }}
// //           >
// //             Schedule New Exam
// //           </Button>
// //         </div>

// //         <ExamList />

// //         <ExamModal />
// //         <StudentsModal />
// //       </Content>
// //     </Layout>
// //   );
// // };

// // export default ViewExams;

// import React, { useState, useEffect } from "react";
// import {
//   Layout,
//   Modal,
//   Form,
//   Input,
//   DatePicker,
//   Select,
//   Button,
//   List,
//   Card,
//   message,
// } from "antd";
// import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
// import {
//   getFirestore,
//   collection,
//   query,
//   where,
//   onSnapshot,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   Timestamp,
//   serverTimestamp,
// } from "firebase/firestore";
// import useAuth from "../../utils/config/useAuth";
// import moment from "moment";

// const { Content } = Layout;

// const ViewExams = () => {
//   const [exams, setExams] = useState([]);
//   const [studentOptions, setStudentOptions] = useState([]);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [editingExam, setEditingExam] = useState(null);
//   const [form] = Form.useForm();
//   const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
//   const [selectedExamForStudents, setSelectedExamForStudents] = useState(null);

//   const { currentUser } = useAuth();
//   const db = getFirestore();

//   const styles = {
//     container: {
//       padding: "20px",
//       maxWidth: "800px",
//       margin: "0 auto",
//     },
//     header: {
//       display: "flex",
//       justifyContent: "space-between",
//       alignItems: "center",
//       marginBottom: "20px",
//       flexWrap: "wrap",
//     },
//     card: {
//       borderRadius: "8px",
//       boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//       display: "flex",
//       flexDirection: "column",
//       justifyContent: "space-between",
//       padding: "16px",
//       minHeight: "180px",
//       marginBottom: "16px",
//     },
//     cardActions: {
//       display: "flex",
//       justifyContent: "flex-end",
//       gap: "8px",
//       marginTop: "16px",
//     },
//     title: {
//       marginBottom: "8px",
//       fontSize: "18px",
//       fontWeight: "600",
//     },
//     description: {
//       marginBottom: "4px",
//       fontSize: "14px",
//     },
//   };

//   // Fetch exams created by the current user
//   useEffect(() => {
//     if (!currentUser) return;
//     const examsRef = collection(db, "Exams");
//     const q = query(examsRef, where("createdBy", "==", currentUser.uid));
//     const unsubscribe = onSnapshot(
//       q,
//       (snapshot) => {
//         const fetchedExams = snapshot.docs.map((docSnap) => {
//           const data = docSnap.data();
//           const examDate = data.examDate instanceof Timestamp ? data.examDate : null;
//           return { id: docSnap.id, ...data, examDate };
//         });
//         // Sort exams by examDate ascending
//         const sortedExams = fetchedExams.sort(
//           (a, b) => a.examDate.toMillis() - b.examDate.toMillis()
//         );
//         setExams(sortedExams);
//       },
//       (error) => {
//         console.error("Error fetching exams:", error);
//         message.error("Failed to fetch exams.");
//       }
//     );
//     return () => unsubscribe();
//   }, [db, currentUser]);

//   // Fetch students for the "Assign Students" selector
//   useEffect(() => {
//     if (!currentUser) return;
//     const studentsRef = collection(db, "Students");
//     const q = query(studentsRef, where("userId", "==", currentUser.uid));
//     const unsubscribe = onSnapshot(
//       q,
//       (snapshot) => {
//         const options = snapshot.docs.map((docSnap) => {
//           const data = docSnap.data();
//           return {
//             label: `${data.firstName || ""} ${data.lastName || ""} - ${data.matricNumber || "N/A"}`,
//             value: docSnap.id,
//           };
//         });
//         setStudentOptions(options);
//       },
//       (error) => {
//         console.error("Error fetching students:", error);
//         message.error("Failed to fetch student list.");
//       }
//     );
//     return () => unsubscribe();
//   }, [db, currentUser]);

//   // Helper: Convert Firestore Timestamp to moment object
//   const getExamMoment = (examDate) => {
//     if (!examDate) return null;
//     return examDate instanceof Timestamp ? moment(examDate.toDate()) : moment(examDate);
//   };

//   const handleAddExam = () => {
//     setEditingExam(null);
//     form.resetFields();
//     setIsModalVisible(true);
//   };

//   const handleEditExam = (exam) => {
//     setEditingExam(exam);
//     form.setFieldsValue({
//       courseName: exam.courseName,
//       courseCode: exam.courseCode,
//       date: exam.examDate ? moment(exam.examDate.toDate()) : null,
//       examLocation: exam.examLocation,
//       students: exam.enrolledStudents || [],
//     });
//     setIsModalVisible(true);
//   };

//   const handleDeleteExam = async (examId) => {
//     try {
//       await deleteDoc(doc(db, "Exams", examId));
//       message.success("Exam deleted successfully");
//     } catch (error) {
//       console.error("Error deleting exam:", error);
//       message.error("Failed to delete exam.");
//     }
//   };

//   // Open modal to view assigned students
//   const handleViewStudentsForExam = (exam) => {
//     setSelectedExamForStudents(exam);
//     setIsStudentModalVisible(true);
//   };

//   const onFinish = async (values) => {
//     if (!currentUser) {
//       message.error("User not logged in");
//       return;
//     }
//     setIsSubmitting(true);
//     try {
//       const examDate = Timestamp.fromDate(values.date.toDate());
//       const examData = {
//         courseName: values.courseName,
//         courseCode: values.courseCode,
//         examDate,
//         examLocation: values.examLocation,
//         enrolledStudents: values.students || [],
//         updatedAt: serverTimestamp(),
//       };
//       if (editingExam) {
//         await updateDoc(doc(db, "Exams", editingExam.id), examData);
//         message.success("Exam updated successfully");
//       } else {
//         examData.createdBy = currentUser.uid;
//         await addDoc(collection(db, "Exams"), examData);
//         message.success("Exam scheduled successfully");
//       }
//       setIsModalVisible(false);
//       form.resetFields();
//     } catch (error) {
//       console.error("Error saving exam:", error);
//       message.error("Failed to save exam.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const ExamModal = () => (
//     <Modal
//       title={editingExam ? "Edit Exam" : "Schedule New Exam"}
//       open={isModalVisible}
//       onCancel={() => {
//         if (!isSubmitting) {
//           setIsModalVisible(false);
//           form.resetFields();
//         }
//       }}
//       footer={null}
//       maskClosable={!isSubmitting}
//       closable={!isSubmitting}
//     >
//       <Form form={form} layout="vertical" onFinish={onFinish}>
//         <Form.Item
//           name="courseName"
//           label="Course Name"
//           rules={[{ required: true, message: "Please enter course name" }]}
//         >
//           <Input placeholder="Course Name" disabled={isSubmitting} />
//         </Form.Item>
//         <Form.Item
//           name="courseCode"
//           label="Course Code"
//           rules={[{ required: true, message: "Please enter course code" }]}
//         >
//           <Input placeholder="Course Code" disabled={isSubmitting} />
//         </Form.Item>
//         <Form.Item
//           name="date"
//           label="Exam Date"
//           rules={[{ required: true, message: "Please select exam date" }]}
//         >
//           <DatePicker
//             showTime
//             format="YYYY-MM-DD HH:mm"
//             style={{ width: "100%" }}
//             disabled={isSubmitting}
//           />
//         </Form.Item>
//         <Form.Item
//           name="examLocation"
//           label="Location"
//           rules={[{ required: true, message: "Please enter exam location" }]}
//         >
//           <Input placeholder="Exam Location" disabled={isSubmitting} />
//         </Form.Item>
//         <Form.Item
//           name="students"
//           label="Assign Students"
//           rules={[{ required: true, message: "Please select students" }]}
//         >
//           <Select
//             mode="multiple"
//             placeholder="Select students"
//             options={studentOptions}
//             disabled={isSubmitting}
//           />
//         </Form.Item>
//         <Form.Item>
//           <Button
//             type="primary"
//             htmlType="submit"
//             loading={isSubmitting}
//             style={{ backgroundColor: "#00923f", borderColor: "#00923f" }}
//             block
//           >
//             {editingExam ? "Update Exam" : "Schedule Exam"}
//           </Button>
//         </Form.Item>
//       </Form>
//     </Modal>
//   );

//   const StudentsModal = () => {
//     const assignedStudents =
//       selectedExamForStudents && selectedExamForStudents.enrolledStudents
//         ? studentOptions.filter((opt) =>
//             selectedExamForStudents.enrolledStudents.includes(opt.value)
//           )
//         : [];

//     return (
//       <Modal
//         title="Assigned Students"
//         open={isStudentModalVisible}
//         onCancel={() => setIsStudentModalVisible(false)}
//         footer={null}
//       >
//         {assignedStudents.length > 0 ? (
//           <List
//             dataSource={assignedStudents}
//             renderItem={(item) => <List.Item>{item.label}</List.Item>}
//           />
//         ) : (
//           <p>No students assigned to this exam.</p>
//         )}
//       </Modal>
//     );
//   };

//   const ExamList = () => (
//     <List
//       grid={{
//         gutter: 16,
//         xs: 1,
//         sm: 1,
//         md: 2,
//         lg: 2,
//         xl: 2,
//         xxl: 2,
//       }}
//       dataSource={exams}
//       renderItem={(exam) => {
//         const examMoment = getExamMoment(exam.examDate);
//         return (
//           <List.Item>
//             <Card style={styles.card}>
//               <div>
//                 <h3 style={styles.title}>
//                   {`${exam.courseName} (${exam.courseCode})`}
//                 </h3>
//                 <p style={styles.description}>
//                   Date:{" "}
//                   {exam.examDate
//                     ? examMoment.format("MMM DD, YYYY HH:mm")
//                     : "N/A"}
//                 </p>
//                 <p style={styles.description}>
//                   Location: {exam.examLocation || "N/A"}
//                 </p>
//                 <p style={styles.description}>
//                   Students:{" "}
//                   {exam.enrolledStudents ? exam.enrolledStudents.length : 0}
//                 </p>
//               </div>
//               <div style={styles.cardActions}>
//                 <Button
//                   type="primary"
//                   onClick={() => {
//                     setSelectedExamForStudents(exam);
//                     setIsStudentModalVisible(true);
//                   }}
//                   style={{
//                     backgroundColor: "#00923f",
//                     borderColor: "#00923f",
//                     color: "#fff",
//                   }}
//                 >
//                   View Students
//                 </Button>
//                 <Button
//                   onClick={() => handleEditExam(exam)}
//                   style={{
//                     backgroundColor: "#00923f",
//                     borderColor: "#00923f",
//                     color: "#fff",
//                   }}
//                 >
//                   Edit
//                 </Button>
//                 <Button
//                   danger
//                   onClick={() => handleDeleteExam(exam.id)}
//                 >
//                   Delete
//                 </Button>
//               </div>
//             </Card>
//           </List.Item>
//         );
//       }}
//     />
//   );

//   return (
//     <Layout>
//       <Content style={styles.container}>
//         <div style={styles.header}>
//           <h2>Upcoming Exams</h2>
//           <Button
//             type="primary"
//             icon={<PlusOutlined />}
//             onClick={handleAddExam}
//             style={{ backgroundColor: "#00923f", borderColor: "#00923f" }}
//           >
//             Schedule New Exam
//           </Button>
//         </div>

//         <ExamList />
//         <ExamModal />
//         <StudentsModal />
//       </Content>
//     </Layout>
//   );
// };

// export default ViewExams;
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
      await deleteDoc(doc(db, "Exams", examId));
      message.success("Exam deleted successfully");
    } catch (error) {
      console.error("Error deleting exam:", error);
      message.error("Failed to delete exam.");
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
