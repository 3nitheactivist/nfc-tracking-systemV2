// Header.jsx
import React from 'react';
import { Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import logo from "../../assets/images/logoWhite.png";

const { Header: AntHeader } = Layout;

const Header = ({ toggleSidebar }) => {
  return (
    <AntHeader 
      style={{ 
        background: '#00923f',
        padding: '0 20px',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        width: '100%',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: '20px', color: 'white' }} />}
          onClick={toggleSidebar}
          style={{ marginRight: '20px', border: 'none' }}
        />
        <img
          src={logo} // Replace with your logo path
          alt="Logo"
          style={{ height: '60px',  }}
        />
      </motion.div>
    </AntHeader>
  );
};

// Sidebar.jsx
// import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  HomeOutlined, 
  FilterOutlined, 
  SettingOutlined, 
  UserOutlined, 
  LogoutOutlined,
  BookOutlined,
  MedicineBoxOutlined,
  SafetyOutlined,
  ApartmentOutlined,
  ScheduleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../utils/firebase/firebase';
import {  AnimatePresence } from 'framer-motion';

const { Sider } = Layout;

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    toggleSidebar();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: '-100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '250px',
          background: 'white',
          zIndex: 1001,
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ 
          height: '70px', 
          background: '#00923f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={logo} // Replace with your logo path
            alt="Logo"
            style={{ height: '60px'}}
          />
        </div>

        <Menu
          mode="inline"
          style={{ borderRight: 0 }}
          items={[
            {
              key: 'students management',
              icon: <HomeOutlined />,
              label: 'Students Management',
              onClick: () => handleNavigation('/students')
            },
            {
              key: 'library',
              icon: <BookOutlined />,
              label: 'Library Access',
              onClick: () => handleNavigation('/library')
            },
            {
              key: 'medical',
              icon: <MedicineBoxOutlined />,
              label: 'Medical Records',
              onClick: () => handleNavigation('/medical')
            },
            {
              key: 'campus',
              icon: <SafetyOutlined />,
              label: 'Campus Access',
              onClick: () => handleNavigation('/campus')
            },
            {
              key: 'hostel',
              icon: <ApartmentOutlined />,
              label: 'Hostel Management',
              onClick: () => handleNavigation('/hostel')
            },
            {
              key: 'attendance',
              icon: <ScheduleOutlined />,
              label: 'Class Attendance',
              onClick: () => handleNavigation('/attendance')
            },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'Log Out',
              onClick: handleLogout
            },
          ]}
        />
      </motion.div>
    </>
  );
};

// App Layout Component (to wrap your dashboard)
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Layout.Content style={{ marginTop: '70px', padding: '24px' }}>
        {children}
      </Layout.Content>
    </Layout>
  );
};

AppLayout.propTypes = {
  children: PropTypes.node.isRequired
};

export { Header, Sidebar, AppLayout };