import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  DatePicker,
  TimePicker,
  Select,
  Card,
  message,
  Space,
  Divider,
  Upload,
  Typography,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  UploadOutlined,
  SaveOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';
import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';
import useAuth from '../../utils/config/useAuth';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

const ExamScheduleForm = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const studentsRef = collection(db, 'students');
      const studentsSnapshot = await getDocs(studentsRef);
      const studentsList = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
      message.error('Failed to load students');
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Combine date and time
      const examDateTime = values.examDate.clone()
        .hour(values.examTime.hour())
        .minute(values.examTime.minute());

      const examData = {
        courseName: values.courseName,
        courseCode: values.courseCode,
        examDate: Timestamp.fromDate(examDateTime.toDate()),
        examLocation: values.examLocation,
        duration: values.duration,
        examiner: values.examiner,
        registeredStudents: selectedStudents,
        createdBy: currentUser.uid,
        createdAt: Timestamp.now(),
        status: 'scheduled',
        notes: values.notes || '',
      };

      // Add exam to Firestore
      const examRef = await addDoc(collection(db, 'Exams'), examData);

      // Create exam registrations for selected students
      const registrationPromises = selectedStudents.map(studentId => 
        addDoc(collection(db, 'examRegistrations'), {
          examId: examRef.id,
          studentId,
          status: 'registered',
          registeredAt: Timestamp.now()
        })
      );

      await Promise.all(registrationPromises);

      message.success('Exam scheduled successfully');
      form.resetFields();
      setSelectedStudents([]);
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Error scheduling exam:', error);
      message.error('Failed to schedule exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Title level={4}>Schedule New Exam</Title>
      <Divider />
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          duration: 120, // Default duration: 2 hours
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="courseName"
              label="Course Name"
              rules={[{ required: true, message: 'Please enter course name' }]}
            >
              <Input placeholder="Enter course name" />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="courseCode"
              label="Course Code"
              rules={[{ required: true, message: 'Please enter course code' }]}
            >
              <Input placeholder="Enter course code" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="examDate"
              label="Exam Date"
              rules={[{ required: true, message: 'Please select exam date' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                disabledDate={current => current && current < dayjs().startOf('day')}
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="examTime"
              label="Exam Time"
              rules={[{ required: true, message: 'Please select exam time' }]}
            >
              <TimePicker 
                style={{ width: '100%' }}
                format="HH:mm"
                minuteStep={5}
              />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="duration"
              label="Duration (minutes)"
              rules={[{ required: true, message: 'Please enter exam duration' }]}
            >
              <Select>
                <Option value={60}>1 hour</Option>
                <Option value={90}>1.5 hours</Option>
                <Option value={120}>2 hours</Option>
                <Option value={180}>3 hours</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="examLocation"
              label="Exam Location"
              rules={[{ required: true, message: 'Please enter exam location' }]}
            >
              <Input placeholder="Enter exam location" />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="examiner"
              label="Examiner"
              rules={[{ required: true, message: 'Please enter examiner name' }]}
            >
              <Input placeholder="Enter examiner name" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="students"
          label="Register Students"
          rules={[{ required: true, message: 'Please select at least one student' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select students"
            onChange={setSelectedStudents}
            style={{ width: '100%' }}
            optionFilterProp="children"
            showSearch
          >
            {students.map(student => (
              <Option key={student.id} value={student.id}>
                {student.name} ({student.schoolId})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="notes"
          label="Additional Notes"
        >
          <Input.TextArea 
            rows={4}
            placeholder="Enter any additional notes or instructions"
          />
        </Form.Item>

        <Divider />

        <Form.Item>
          <Space>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SaveOutlined />}
              loading={loading}
            >
              Schedule Exam
            </Button>
            <Button 
              onClick={() => form.resetFields()}
              disabled={loading}
            >
              Reset Form
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ExamScheduleForm; 