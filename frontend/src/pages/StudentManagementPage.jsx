import React, { useState } from 'react';
import { Tabs, Card } from 'antd';
import { UserAddOutlined, TeamOutlined } from '@ant-design/icons';
import StudentEnrollmentPage from './StudentEnrollmentPage';
import ViewEnrolledStudentsPage from './ViewEnrolledStudentsPage';
import { motion } from 'framer-motion';

const StudentManagementPage = () => {
  const items = [
    {
      key: 'enroll',
      label: (
        <span>
          <UserAddOutlined />
          Enroll Student
        </span>
      ),
      children: <StudentEnrollmentPage />
    },
    {
      key: 'view',
      label: (
        <span>
          <TeamOutlined />
          View Students
        </span>
      ),
      children: <ViewEnrolledStudentsPage />
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <Tabs defaultActiveKey="enroll" items={items} size="large" />
      </Card>
    </motion.div>
  );
};

export default StudentManagementPage;
