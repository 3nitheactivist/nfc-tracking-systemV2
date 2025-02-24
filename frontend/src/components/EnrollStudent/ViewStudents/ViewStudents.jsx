// import React, { useState, useEffect } from 'react';
// import { 
//   Table, 
//   Input, 
//   Space, 
//   Modal, 
//   Form, 
//   Alert, 
//   Skeleton,
//   Button,
//   Tooltip,
//   Popconfirm
// } from 'antd';
// import { 
//   SearchOutlined, 
//   EditOutlined, 
//   DeleteOutlined,
//   EyeOutlined
// } from '@ant-design/icons';
// import { useNavigate } from 'react-router-dom';
// import { collection, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
// import { getFirestore } from 'firebase/firestore';

// const ViewStudents = () => {
//   const [students, setStudents] = useState([]);
//   const [filteredStudents, setFilteredStudents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isEditModalVisible, setIsEditModalVisible] = useState(false);
//   const [alertMessage, setAlertMessage] = useState('');
//   const [alertType, setAlertType] = useState('');
//   const [form] = Form.useForm();
//   const navigate = useNavigate();
//   const db = getFirestore();

//   // Real-time fetch of student data from the "Students" collection
//   useEffect(() => {
//     const studentsCollection = collection(db, 'Students'); // note: capital S
//     const unsubscribe = onSnapshot(studentsCollection, (snapshot) => {
//       const studentList = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setStudents(studentList);
//       setFilteredStudents(studentList);
//       setLoading(false);
//     }, (error) => {
//       console.error('Error fetching students:', error);
//       setAlertMessage('Error fetching students');
//       setAlertType('error');
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [db]);

//   // Search functionality: combine firstName and lastName into full name
//   const handleSearch = (e) => {
//     const searchText = e.target.value.toLowerCase();
//     const filtered = students.filter(student => {
//       const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
//       return (
//         fullName.includes(searchText) ||
//         (student.nfcTagId && student.nfcTagId.toLowerCase().includes(searchText)) ||
//         (student.email && student.email.toLowerCase().includes(searchText)) ||
//         (student.department && student.department.toLowerCase().includes(searchText)) ||
//         (student.phone && student.phone.toLowerCase().includes(searchText))
//       );
//     });
//     setFilteredStudents(filtered);
//   };

//   // Handle edit: load selected record into the edit form
//   const handleEdit = (record) => {
//     form.setFieldsValue({
//       id: record.id,
//       firstName: record.firstName,
//       lastName: record.lastName,
//       nfcTagId: record.nfcTagId,
//       email: record.email,
//       phone: record.phone,
//       department: record.department
//     });
//     setIsEditModalVisible(true);
//   };

//   // Handle update student in Firestore
//   const handleUpdateStudent = async () => {
//     try {
//       const values = await form.validateFields();
//       const studentRef = doc(db, 'Students', values.id);
//       // Update editable fields
//       await updateDoc(studentRef, {
//         firstName: values.firstName,
//         lastName: values.lastName,
//         email: values.email,
//         phone: values.phone,
//         department: values.department
//       });
      
//       setAlertMessage('Student updated successfully');
//       setAlertType('success');
//       setIsEditModalVisible(false);
//     } catch (error) {
//       console.error('Error updating student:', error);
//       setAlertMessage('Error updating student');
//       setAlertType('error');
//     }
//   };

//   // Handle delete student
//   const handleDelete = async (id) => {
//     try {
//       await deleteDoc(doc(db, 'Students', id));
//       setAlertMessage('Student deleted successfully');
//       setAlertType('success');
//     } catch (error) {
//       console.error('Error deleting student:', error);
//       setAlertMessage('Error deleting student');
//       setAlertType('error');
//     }
//   };

//   // Navigate to student profile page
//   const handleViewProfile = (studentId) => {
//     navigate(`/student-profile/${studentId}`);
//   };

//   // Table columns definition
//   const columns = [
//     {
//       title: 'Name',
//       key: 'name',
//       render: (text, record) => `${record.firstName || ''} ${record.lastName || ''}`,
//       sorter: (a, b) => {
//         const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
//         const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
//         return nameA.localeCompare(nameB);
//       }
//     },
//     {
//       title: 'Student ID',
//       dataIndex: 'nfcTagId',
//       key: 'nfcTagId',
//     },
//     {
//       title: 'Email',
//       dataIndex: 'email',
//       key: 'email',
//     },
//     {
//       title: 'Phone',
//       dataIndex: 'phone',
//       key: 'phone',
//     },
//     {
//       title: 'Department',
//       dataIndex: 'department',
//       key: 'department',
//       filters: [...new Set(students.map(s => s.department))].map(dept => ({
//         text: dept,
//         value: dept,
//       })),
//       onFilter: (value, record) => record.department === value,
//     },
//     {
//       title: 'Enrolled On',
//       dataIndex: 'enrollmentDate',
//       key: 'enrollmentDate',
//       render: (enrollmentDate) => enrollmentDate ? new Date(enrollmentDate.seconds * 1000).toLocaleDateString() : '',
//       sorter: (a, b) => {
//         const dateA = a.enrollmentDate ? new Date(a.enrollmentDate.seconds * 1000) : new Date(0);
//         const dateB = b.enrollmentDate ? new Date(b.enrollmentDate.seconds * 1000) : new Date(0);
//         return dateA - dateB;
//       }
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space size="middle">
//           <Tooltip title="View Profile">
//             <Button 
//               type="primary" 
//               icon={<EyeOutlined />} 
//               onClick={() => handleViewProfile(record.id)}
//               style={{ backgroundColor: '#00923f', borderColor: '#00923f', color: '#fff' }}
//             />
//           </Tooltip>
//           <Tooltip title="Edit">
//             <Button 
//               icon={<EditOutlined />} 
//               onClick={() => handleEdit(record)}
//               style={{ backgroundColor: '#00923f', borderColor: '#00923f', color: '#fff' }}
//             />
//           </Tooltip>
//           <Tooltip title="Delete">
//             <Popconfirm
//               title="Are you sure you want to delete this student?"
//               onConfirm={() => handleDelete(record.id)}
//               okText="Yes"
//               cancelText="No"
//             >
//               <Button 
//                 icon={<DeleteOutlined />} 
//                 style={{ backgroundColor: '#00923f', borderColor: '#00923f', color: '#fff' }}
//               />
//             </Popconfirm>
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div style={{ padding: '1rem' }}>
//       <div style={{ marginBottom: '1rem' }}>
//         <h2>View Students</h2>
//       </div>

//       {alertMessage && (
//         <Alert
//           message={alertMessage}
//           type={alertType}
//           showIcon
//           closable
//           onClose={() => setAlertMessage('')}
//           style={{ marginBottom: '16px' }}
//         />
//       )}

//       <Space style={{ marginBottom: 16 }}>
//         <Input
//           placeholder="Search students..."
//           prefix={<SearchOutlined />}
//           onChange={handleSearch}
//           allowClear
//           style={{ width: 300 }}
//         />
//       </Space>

//       {loading ? (
//         <Skeleton active paragraph={{ rows: 6 }} title={false} />
//       ) : (
//         <div style={{ overflowX: 'auto' }}>
//           <Table
//             columns={columns}
//             dataSource={filteredStudents}
//             pagination={{ pageSize: 5 }}
//             scroll={{ y: 300 }}
//             rowKey="id"
//           />
//         </div>
//       )}

//       <Modal
//         title="Edit Student"
//         visible={isEditModalVisible}
//         onOk={handleUpdateStudent}
//         onCancel={() => setIsEditModalVisible(false)}
//         okButtonProps={{ style: { backgroundColor: '#00923f', borderColor: '#00923f' } }}
//         cancelButtonProps={{ style: { borderColor: '#00923f' } }}
//       >
//         <Form form={form} layout="vertical">
//           <Form.Item name="id" hidden>
//             <Input />
//           </Form.Item>
//           <Form.Item
//             label="First Name"
//             name="firstName"
//             rules={[{ required: true, message: 'Please enter first name' }]}
//           >
//             <Input />
//           </Form.Item>
//           <Form.Item
//             label="Last Name"
//             name="lastName"
//             rules={[{ required: true, message: 'Please enter last name' }]}
//           >
//             <Input />
//           </Form.Item>
//           <Form.Item
//             label="Student ID"
//             name="nfcTagId"
//             rules={[{ required: true, message: 'Student ID is required' }]}
//           >
//             <Input disabled />
//           </Form.Item>
//           <Form.Item
//             label="Email"
//             name="email"
//             rules={[
//               { required: true, type: 'email', message: 'Please enter a valid email' },
//             ]}
//           >
//             <Input />
//           </Form.Item>
//           <Form.Item
//             label="Phone"
//             name="phone"
//             rules={[{ required: true, message: 'Please enter phone number' }]}
//           >
//             <Input />
//           </Form.Item>
//           <Form.Item
//             label="Department"
//             name="department"
//             rules={[{ required: true, message: 'Please enter department' }]}
//           >
//             <Input />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default ViewStudents;
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Input, 
  Space, 
  Modal, 
  Form, 
  Alert, 
  Skeleton,
  Button,
  Tooltip,
  Popconfirm
} from 'antd';
import { 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { collection, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const ViewStudents = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const db = getFirestore();

  // Real-time fetch of student data from the "Students" collection
  useEffect(() => {
    const studentsCollection = collection(db, 'Students'); // note: capital S
    const unsubscribe = onSnapshot(
      studentsCollection,
      (snapshot) => {
        const studentList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudents(studentList);
        setFilteredStudents(studentList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching students:', error);
        setAlertMessage('Error fetching students');
        setAlertType('error');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db]);

  // Search functionality: include full name, matricNumber, and nfcTagId
  const handleSearch = (e) => {
    const searchText = e.target.value.toLowerCase();
    const filtered = students.filter(student => {
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      return (
        fullName.includes(searchText) ||
        (student.matricNumber && student.matricNumber.toLowerCase().includes(searchText)) ||
        (student.nfcTagId && student.nfcTagId.toLowerCase().includes(searchText))
      );
    });
    setFilteredStudents(filtered);
  };

  // Handle edit: load selected record into the edit form
  const handleEdit = (record) => {
    form.setFieldsValue({
      id: record.id,
      firstName: record.firstName,
      lastName: record.lastName,
      matricNumber: record.matricNumber, // new field
      nfcTagId: record.nfcTagId,
      email: record.email,
      phone: record.phone,
      department: record.department
    });
    setIsEditModalVisible(true);
  };

  // Handle update student in Firestore
  const handleUpdateStudent = async () => {
    try {
      const values = await form.validateFields();
      const studentRef = doc(db, 'Students', values.id);
      // Update editable fields; note: matricNumber might not be editable if it's unique
      await updateDoc(studentRef, {
        firstName: values.firstName,
        lastName: values.lastName,
        matricNumber: values.matricNumber,
        email: values.email,
        phone: values.phone,
        department: values.department
      });
      
      setAlertMessage('Student updated successfully');
      setAlertType('success');
      setIsEditModalVisible(false);
    } catch (error) {
      console.error('Error updating student:', error);
      setAlertMessage('Error updating student');
      setAlertType('error');
    }
  };

  // Handle delete student
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'Students', id));
      setAlertMessage('Student deleted successfully');
      setAlertType('success');
    } catch (error) {
      console.error('Error deleting student:', error);
      setAlertMessage('Error deleting student');
      setAlertType('error');
    }
  };

  // Navigate to student profile page
  const handleViewProfile = (studentId) => {
    navigate(`/student-profile/${studentId}`);
  };

  // Table columns definition for summary view
  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (text, record) => `${record.firstName || ''} ${record.lastName || ''}`,
      sorter: (a, b) => {
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }
    },
    {
      title: 'Matric Number',
      dataIndex: 'matricNumber',
      key: 'matricNumber',
    },
    {
      title: 'NFC Tag ID',
      dataIndex: 'nfcTagId',
      key: 'nfcTagId',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Profile">
            <Button 
              type="primary" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewProfile(record.id)}
              style={{ backgroundColor: '#00923f', borderColor: '#00923f', color: '#fff' }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              style={{ backgroundColor: '#00923f', borderColor: '#00923f', color: '#fff' }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Are you sure you want to delete this student?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                icon={<DeleteOutlined />} 
                style={{ backgroundColor: '#00923f', borderColor: '#00923f', color: '#fff' }}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2>View Students</h2>
      </div>

      {alertMessage && (
        <Alert
          message={alertMessage}
          type={alertType}
          showIcon
          closable
          onClose={() => setAlertMessage('')}
          style={{ marginBottom: '16px' }}
        />
      )}

      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search students..."
          prefix={<SearchOutlined />}
          onChange={handleSearch}
          allowClear
          style={{ width: 300 }}
        />
      </Space>

      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} title={false} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table
            columns={columns}
            dataSource={filteredStudents}
            pagination={{ pageSize: 5 }}
            rowKey="id"
          />
        </div>
      )}

      <Modal
        title="Edit Student"
        visible={isEditModalVisible}
        onOk={handleUpdateStudent}
        onCancel={() => setIsEditModalVisible(false)}
        okButtonProps={{ style: { backgroundColor: '#00923f', borderColor: '#00923f' } }}
        cancelButtonProps={{ style: { borderColor: '#00923f' } }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[{ required: true, message: 'Please enter first name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Last Name"
            name="lastName"
            rules={[{ required: true, message: 'Please enter last name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Matric Number"
            name="matricNumber"
            rules={[{ required: true, message: 'Please enter matric number' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Student ID"
            name="nfcTagId"
            rules={[{ required: true, message: 'Student ID is required' }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Phone"
            name="phone"
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Department"
            name="department"
            rules={[{ required: true, message: 'Please enter department' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ViewStudents;
