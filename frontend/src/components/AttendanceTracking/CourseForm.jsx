import React, { useState } from 'react';
import { Form, Input, Button, Select, Card, message, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';

const { Option } = Select;

function CourseForm({ onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Level options
  const levelOptions = [
    { value: '100', label: '100 Level' },
    { value: '200', label: '200 Level' },
    { value: '300', label: '300 Level' },
    { value: '400', label: '400 Level' },
    { value: '500', label: '500 Level' },
    { value: 'PG', label: 'Postgraduate' }
  ];

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Create course object
      const courseData = {
        name: values.name,
        code: values.code,
        level: values.level,
        createdAt: new Date()
      };
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'courses'), courseData);
      
      message.success(`Course "${values.code} - ${values.name}" created successfully`);
      
      // Reset form
      form.resetFields();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess({
          id: docRef.id,
          ...courseData
        });
      }
    } catch (error) {
      console.error('Error creating course:', error);
      message.error('Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Create New Course" className="course-form-card">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label="Course Name"
          rules={[
            { required: true, message: 'Please enter the course name' },
            { min: 3, message: 'Course name must be at least 3 characters' }
          ]}
        >
          <Input placeholder="e.g. Introduction to Computer Science" />
        </Form.Item>
        
        <Form.Item
          name="code"
          label="Course Code"
          rules={[
            { required: true, message: 'Please enter the course code' },
            { pattern: /^[A-Z]{3,4}\s?\d{3,4}$/, message: 'Course code should be in format: CSC 101' }
          ]}
        >
          <Input placeholder="e.g. CSC 101" />
        </Form.Item>
        
        <Form.Item
          name="level"
          label="Level"
          rules={[{ required: true, message: 'Please select the course level' }]}
        >
          <Select placeholder="Select course level">
            {levelOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<PlusOutlined />}
            loading={loading}
            block
          >
            Create Course
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default CourseForm; 