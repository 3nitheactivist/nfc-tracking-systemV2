import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Select, DatePicker, Space, 
  Card, Alert, message, Typography, InputNumber 
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../utils/firebase/firebase';
import { API_CONFIG } from '../../../config/apiConfig';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

function PrescriptionForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const studentsRef = collection(db, 'students');
      const q = query(
        studentsRef,
        where('permissions.medical', '==', true),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      const studentsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
      message.error('Failed to load students list');
    }
  };

  const handleStudentSelect = (value) => {
    const student = students.find(s => s.id === value);
    setSelectedStudent(student);
    form.setFieldsValue({
      studentId: student.schoolId,
      studentEmail: student.email
    });
  };

  const sendPrescriptionEmail = async (prescriptionData) => {
    try {
      const response = await API_CONFIG.sendEmail(
        prescriptionData.studentEmail,
        'Medical Prescription Notification',
        `
        <h2>Medical Prescription Notification</h2>
        <p>Dear ${prescriptionData.studentName},</p>
        <p>A new prescription has been issued for you:</p>
        <h3>Medications:</h3>
        <ul>
          ${prescriptionData.medications.map(med => `
            <li>
              <strong>${med.name}</strong><br>
              Dosage: ${med.dosage}<br>
              Instructions: ${med.instructions}
            </li>
          `).join('')}
        </ul>
        <p><strong>Valid Until:</strong> ${prescriptionData.expiryDate}</p>
        <p><strong>Additional Instructions:</strong> ${prescriptionData.additionalInstructions || 'None'}</p>
        <p>Please come to the medical office to collect your medications. Bring your student ID card.</p>
        <p>If you have any questions, please contact the medical office.</p>
        `
      );

      if (response.success) {
        message.success('Prescription notification email sent');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      message.warning('Prescription created but email notification failed');
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const prescriptionData = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        schoolId: selectedStudent.schoolId,
        studentEmail: selectedStudent.email,
        medications: values.medications,
        prescriptionDate: serverTimestamp(),
        expiryDate: values.expiryDate.format('YYYY-MM-DD'),
        additionalInstructions: values.additionalInstructions,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to Firebase
      const prescriptionsRef = collection(db, 'medical_prescriptions');
      const docRef = await addDoc(prescriptionsRef, prescriptionData);

      // Send email notification
      await sendPrescriptionEmail(prescriptionData);

      message.success('Prescription created successfully');
      form.resetFields();
      setSelectedStudent(null);

    } catch (error) {
      console.error('Error creating prescription:', error);
      message.error('Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Create Prescription">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Student Selection */}
          <Form.Item
            name="student"
            label="Select Student"
            rules={[{ required: true, message: 'Please select a student' }]}
          >
            <Select
              showSearch
              placeholder="Search for student"
              optionFilterProp="children"
              onChange={handleStudentSelect}
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              options={students.map(student => ({
                value: student.id,
                label: `${student.name} (${student.schoolId})`
              }))}
            />
          </Form.Item>

          {/* Display selected student info */}
          {selectedStudent && (
            <Alert
              message="Selected Student Information"
              description={
                <Space direction="vertical">
                  <div>Name: {selectedStudent.name}</div>
                  <div>ID: {selectedStudent.schoolId}</div>
                  <div>Email: {selectedStudent.email}</div>
                </Space>
              }
              type="info"
              showIcon
            />
          )}

          {/* Medications List */}
          <Title level={5}>Medications</Title>
          <Form.List name="medications">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      rules={[{ required: true, message: 'Missing medication name' }]}
                    >
                      <Input placeholder="Medication Name" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'dosage']}
                      rules={[{ required: true, message: 'Missing dosage' }]}
                    >
                      <Input placeholder="Dosage" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'instructions']}
                      rules={[{ required: true, message: 'Missing instructions' }]}
                    >
                      <Input placeholder="Instructions" />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Medication
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* Expiry Date */}
          <Form.Item
            name="expiryDate"
            label="Valid Until"
            rules={[{ required: true, message: 'Please select expiry date' }]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              disabledDate={(current) => {
                return current && current < dayjs().endOf('day');
              }}
            />
          </Form.Item>

          {/* Additional Instructions */}
          <Form.Item
            name="additionalInstructions"
            label="Additional Instructions"
          >
            <TextArea rows={4} />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
            >
              Create Prescription
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </Card>
  );
}

export default PrescriptionForm; 