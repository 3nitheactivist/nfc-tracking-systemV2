import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, DatePicker, TimePicker, Select, 
  message, Card, Space, Alert 
} from 'antd';
import { 
  UserOutlined, CalendarOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../utils/firebase/firebase';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_CONFIG } from '../../../utils/apiConfig';

const { Option } = Select;
const { TextArea } = Input;

function AppointmentForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fetch students on component mount
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

  const sendAppointmentEmail = async (appointmentData) => {
    try {
      const response = await axios.post(`${API_CONFIG.BASE_URL}/send-email`, {
        recipient: appointmentData.studentEmail,
        subject: 'Medical Appointment Confirmation',
        message: `
          <h2>Medical Appointment Confirmation</h2>
          <p>Dear ${appointmentData.studentName},</p>
          <p>Your medical appointment has been scheduled for:</p>
          <p><strong>Date:</strong> ${appointmentData.appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentData.appointmentTime}</p>
          <p><strong>Reason:</strong> ${appointmentData.reason}</p>
          <p>Please arrive 10 minutes before your scheduled time with your student ID card.</p>
          <p>If you need to reschedule, please contact the medical office.</p>
        `
      });

      if (response.status === 200) {
        message.success('Appointment confirmation email sent');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      message.warning('Appointment created but email notification failed');
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Format date and time
      const appointmentDate = values.appointmentDate.format('YYYY-MM-DD');
      const appointmentTime = values.appointmentTime.format('HH:mm');

      // Create appointment document
      const appointmentData = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        schoolId: selectedStudent.schoolId,
        studentEmail: selectedStudent.email,
        appointmentDate,
        appointmentTime,
        reason: values.reason,
        notes: values.notes,
        status: 'scheduled',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to Firebase
      const appointmentsRef = collection(db, 'medical_appointments');
      const docRef = await addDoc(appointmentsRef, appointmentData);

      // Send email notification
      await sendAppointmentEmail(appointmentData);

      message.success('Appointment scheduled successfully');
      form.resetFields();
      setSelectedStudent(null);

    } catch (error) {
      console.error('Error scheduling appointment:', error);
      message.error('Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Schedule Medical Appointment">
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

          {/* Date and Time Selection */}
          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="appointmentDate"
              label="Appointment Date"
              rules={[{ required: true, message: 'Please select date' }]}
              style={{ width: '50%' }}
            >
              <DatePicker 
                style={{ width: '100%' }}
                disabledDate={(current) => {
                  return current && current < dayjs().startOf('day');
                }}
              />
            </Form.Item>

            <Form.Item
              name="appointmentTime"
              label="Appointment Time"
              rules={[{ required: true, message: 'Please select time' }]}
              style={{ width: '50%' }}
            >
              <TimePicker 
                format="HH:mm"
                minuteStep={15}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Space>

          {/* Reason and Notes */}
          <Form.Item
            name="reason"
            label="Reason for Appointment"
            rules={[{ required: true, message: 'Please enter reason' }]}
          >
            <Input prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Additional Notes"
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
              Schedule Appointment
            </Button>
          </Form.Item>
        </Space>
      </Form>
    </Card>
  );
}

export default AppointmentForm; 