import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Modal, message, Popconfirm, Row, Col, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase/firebase';
import CourseForm from './CourseForm';

function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Load courses on component mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Load courses from Firestore
  const loadCourses = async () => {
    setLoading(true);
    try {
      const coursesCollection = collection(db, 'courses');
      const coursesSnapshot = await getDocs(coursesCollection);
      const coursesList = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      setCourses(coursesList);
    } catch (error) {
      console.error('Error loading courses:', error);
      message.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Handle course creation success
  const handleCourseCreated = (newCourse) => {
    setCourses(prev => [...prev, newCourse]);
    setIsModalVisible(false);
  };

  // Handle course deletion
  const handleDeleteCourse = async (courseId) => {
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      message.success('Course deleted successfully');
      setCourses(prev => prev.filter(course => course.id !== courseId));
    } catch (error) {
      console.error('Error deleting course:', error);
      message.error('Failed to delete course');
    }
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  // Filter courses based on search text
  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchText.toLowerCase()) ||
    course.code.toLowerCase().includes(searchText.toLowerCase())
  );

  // Table columns
  const columns = [
    {
      title: 'Course Code',
      dataIndex: 'code',
      key: 'code',
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: 'Course Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      sorter: (a, b) => a.level.localeCompare(b.level),
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date?.toLocaleString() || 'N/A',
      sorter: (a, b) => a.createdAt - b.createdAt,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="Are you sure you want to delete this course?"
            onConfirm={() => handleDeleteCourse(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="course-management">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="Course Management">
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <Input
                placeholder="Search courses"
                prefix={<SearchOutlined />}
                style={{ width: 300 }}
                value={searchText}
                onChange={handleSearch}
              />
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
                Add Course
              </Button>
            </div>
            
            <Table
              dataSource={filteredCourses}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
        
        <Col xs={24} md={8}>
          <CourseForm onSuccess={handleCourseCreated} />
        </Col>
      </Row>
      
      <Modal
        title="Add New Course"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <CourseForm onSuccess={handleCourseCreated} />
      </Modal>
    </div>
  );
}

export default CourseManagement; 