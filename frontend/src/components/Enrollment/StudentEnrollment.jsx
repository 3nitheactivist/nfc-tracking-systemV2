// import { Form, Input, Button, message } from 'antd';
// import { NFCScanner } from '../shared/NFCScanner';

// const StudentEnrollment = () => {
//   const [form] = Form.useForm();
//   const [isRegistering, setIsRegistering] = useState(false);

//   const handleNFCScanned = (nfcTagId) => {
//     form.setFieldValue('nfcTagId', nfcTagId);
//   };

//   const onFinish = async (values) => {
//     try {
//       setIsRegistering(true);
//       // Create student document in Firestore
//       await addDoc(collection(db, 'students'), {
//         ...values,
//         enrollmentDate: serverTimestamp(),
//         // Default access permissions
//         permissions: {
//           library: true,
//           medical: true,
//           campus: true,
//           attendance: true,
//           hostel: false // might require additional approval //I suggest to make it true
//         }
//       });
//       message.success('Student enrolled successfully');
//       form.resetFields();
//     } catch (error) {
//       message.error('Failed to enroll student');
//     } finally {
//       setIsRegistering(false);
//     }
//   };

//   return (
//     <div>
//       <NFCScanner onScan={handleNFCScanned} scannerType="Enrollment" />
//       <Form form={form} onFinish={onFinish}>
//         <Form.Item name="name" rules={[{ required: true }]}>
//           <Input placeholder="Full Name" />
//         </Form.Item>
//         <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
//           <Input placeholder="Email" />
//         </Form.Item>
//         <Form.Item name="phone" rules={[{ required: true }]}>
//           <Input placeholder="Phone" />
//         </Form.Item>
//         <Form.Item name="schoolId" rules={[{ required: true }]}>
//           <Input placeholder="School ID" />
//         </Form.Item>
//         <Form.Item name="nfcTagId">
//           <Input disabled placeholder="NFC Tag ID (Scan card to populate)" />
//         </Form.Item>
//         <Button type="primary" htmlType="submit" loading={isRegistering}>
//           Enroll Student
//         </Button>
//       </Form>
//     </div>
//   );
// }; 

