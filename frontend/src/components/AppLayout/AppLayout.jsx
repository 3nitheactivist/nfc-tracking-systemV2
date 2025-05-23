// import React, { useState } from "react";
// import { Button, Avatar, Dropdown, Space, Typography, Layout, Menu } from "antd";
// import {
//   MenuOutlined,
//   UserOutlined,
//   LogoutOutlined,
//   FilterOutlined,
//   SettingOutlined,
//   BookOutlined,
//   MedicineBoxOutlined,
//   SafetyOutlined,
//   ApartmentOutlined,
//   ScheduleOutlined,
//   HomeOutlined,
//   FileTextOutlined,
//   MenuFoldOutlined,
//   MenuUnfoldOutlined,
// } from "@ant-design/icons";
// import { motion } from "framer-motion";
// import PropTypes from "prop-types";
// import logo from "../../assets/images/logoWhite.png";
// import { useNavigate } from "react-router-dom";
// import BluetoothButton from "../BluetoothButton/BluetoothButton";
// import { useAuth } from "../../hooks/useAuth";
// // import "./AppLayout.css";

// const { Header: AntHeader, Sider, Content } = Layout;
// const { Text } = Typography;

// const AppHeader = ({ toggleSidebar }) => {
//   const [user, setUser] = useState(null);
//   const navigate = useNavigate();
//   const { logout } = useAuth();

//   const handleLogout = async () => {
//     try {
//       await logout();
//       navigate("/login");
//     } catch (error) {
//       console.error("Error logging out:", error.message);
//     }
//   };

//   const userMenuItems = [
//     {
//       key: "logout",
//       label: "Logout",
//       icon: <LogoutOutlined />,
//       onClick: handleLogout,
//     },
//   ];

//   return (
//     <AntHeader
//       style={{
//         background: "#00923f",
//         padding: "0 20px",
//         height: "70px",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "space-between",
//         position: "fixed",
//         width: "100%",
//         zIndex: 1000,
//         boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
//       }}
//     >
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 0.5 }}
//         style={{ display: "flex", alignItems: "center" }}
//       >
//         <Button
//           type="text"
//           icon={<MenuOutlined style={{ fontSize: "20px", color: "white" }} />}
//           onClick={toggleSidebar}
//           style={{ marginRight: "20px", border: "none" }}
//         />
//         <img src={logo} alt="Logo" style={{ height: "60px" }} />
//       </motion.div>

//       {user && (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.5 }}
//           style={{ display: "flex", alignItems: "center" }}
//         >
//           <Dropdown
//             menu={{ items: userMenuItems }}
//             placement="bottomRight"
//             arrow
//           >
//             <Space style={{ cursor: "pointer", color: "white" }}>
//               <Text style={{ color: "white", marginRight: "10px" }}>
//                 {user.displayName}
//               </Text>
//               <Avatar
//                 style={{
//                   backgroundColor: "#1890ff",
//                   color: "white",
//                   cursor: "pointer",
//                 }}
//               >
//                 {user.displayName?.charAt(0)?.toUpperCase()}
//               </Avatar>
//             </Space>
//           </Dropdown>
//         </motion.div>
//       )}
//     </AntHeader>
//   );
// };

// const AppSidebar = ({ isOpen, toggleSidebar }) => {
//   const navigate = useNavigate();

//   const handleNavigation = (path) => {
//     toggleSidebar();
//     navigate(path);
//   };

//   const sidebarItems = [
//     {
//       key: "students management",
//       icon: <HomeOutlined />,
//       label: "Students Management",
//       onClick: () => handleNavigation("/students"),
//     },
//     {
//       key: "library",
//       icon: <BookOutlined />,
//       label: "Library Access",
//       onClick: () => handleNavigation("/library"),
//     },
//     {
//       key: "medical",
//       icon: <MedicineBoxOutlined />,
//       label: "Medical Records",
//       onClick: () => handleNavigation("/medical"),
//     },
//     {
//       key: "campus",
//       icon: <SafetyOutlined />,
//       label: "Campus Access",
//       onClick: () => handleNavigation("/campus"),
//     },
//     {
//       key: "hostel",
//       icon: <ApartmentOutlined />,
//       label: "Hostel Management",
//       onClick: () => handleNavigation("/hostel"),
//     },
//     {
//       key: "attendance",
//       icon: <ScheduleOutlined />,
//       label: "Class Attendance",
//       onClick: () => handleNavigation("/attendance"),
//     },
//     {
//       key: "exam schedule",
//       icon: <FileTextOutlined />,
//       label: "Exam Schedule",
//       onClick: () => handleNavigation("/examSchedule"),
//     },
//   ];

//   return (
//     <Sider
//       trigger={null}
//       collapsible
//       collapsed={!isOpen}
//       style={{
//         overflow: "auto",
//         height: "100vh",
//         position: "fixed",
//         left: 0,
//         top: 70,
//         bottom: 0,
//       }}
//     >
//       <Menu
//         theme="dark"
//         mode="inline"
//         defaultSelectedKeys={["dashboard"]}
//         items={sidebarItems}
//       />
//       <div style={{ position: "absolute", bottom: "20px", width: "100%", display: "flex", justifyContent: "center" }}>
//         <BluetoothButton />
//       </div>
//     </Sider>
//   );
// };

// const AppLayout = ({ children }) => {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   const toggleSidebar = () => {
//     setSidebarOpen(!sidebarOpen);
//   };

//   return (
//     <Layout style={{ minHeight: "100vh" }}>
//       <AppHeader toggleSidebar={toggleSidebar} />
//       <AppSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
//       <Layout style={{ marginLeft: sidebarOpen ? 200 : 0, transition: "margin-left 0.2s" }}>
//         <Content style={{ marginTop: "70px", padding: "24px" }}>
//           {children}
//         </Content>
//       </Layout>
//     </Layout>
//   );
// };

// AppLayout.propTypes = {
//   children: PropTypes.node.isRequired,
// };

// AppHeader.propTypes = {
//   toggleSidebar: PropTypes.func.isRequired,
// };

// AppSidebar.propTypes = {
//   isOpen: PropTypes.bool.isRequired,
//   toggleSidebar: PropTypes.func.isRequired,
// };

// export default AppLayout;


import React, { useState, useEffect } from "react";
import { Button, Avatar, Dropdown, Space, Typography, Layout, Menu } from "antd";
import {
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  FilterOutlined,
  SettingOutlined,
  BookOutlined,
  MedicineBoxOutlined,
  SafetyOutlined,
  ApartmentOutlined,
  ScheduleOutlined,
  HomeOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import PropTypes from "prop-types";
import logo from "../../assets/images/logoWhite.png";
import { useNavigate } from "react-router-dom";
import BluetoothButton from "../BluetoothButton/BluetoothButton";
import { useAuth } from "../../hooks/useAuth";

const { Header: AntHeader, Content } = Layout;
const { Text } = Typography;

// Function to get initials from name
const getInitials = (name) => {
  if (!name) return "";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2); // Limit to 2 characters
};

// Function to generate a consistent color based on name
const getAvatarColor = (name) => {
  if (!name) return "#1890ff"; // Default blue color

  // Generate a simple hash from the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert hash to a color
  const colors = [
    "#1890ff", // Blue
    "#52c41a", // Green
    "#faad14", // Yellow
    "#f5222d", // Red
    "#722ed1", // Purple
    "#eb2f96", // Pink
    "#fa8c16", // Orange
    "#13c2c2", // Cyan
    "#2f54eb", // Geekblue
  ];

  // Use the hash to select a color from the array
  return colors[Math.abs(hash) % colors.length];
};

const AppHeader = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const userMenuItems = [
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <AntHeader 
      style={{ 
        background: "#00923f",
        padding: "0 20px",
        height: "70px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "fixed",
        width: "100%",
        zIndex: 1000,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ display: "flex", alignItems: "center" }}
      >
        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: "20px", color: "white" }} />}
          onClick={toggleSidebar}
          style={{ marginRight: "20px", border: "none" }}
        />
        <img src={logo} alt="Logo" style={{ height: "60px" }} />
      </motion.div>

      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{ display: "flex", alignItems: "center" }}
        >
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <Space style={{ cursor: "pointer", color: "white" }}>
              <Text style={{ color: "white", marginRight: "10px" }}>
                {user.displayName || (user.email?.split("@")[0]) || "User"}
              </Text>
              <Avatar
                style={{
                  backgroundColor: getAvatarColor(user.displayName || ""),
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {getInitials(user.displayName || "")}
              </Avatar>
            </Space>
          </Dropdown>
        </motion.div>
      )}
    </AntHeader>
  );
};

const AppSidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleNavigation = (path) => {
    toggleSidebar();
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
  };

  const sidebarItems = [
    {
      key: "students management",
      icon: <HomeOutlined />,
      label: "Students Management",
      onClick: () => handleNavigation("/students"),
    },
    {
      key: "library",
      icon: <BookOutlined />,
      label: "Library Access",
      onClick: () => handleNavigation("/library"),
    },
    {
      key: "medical",
      icon: <MedicineBoxOutlined />,
      label: "Medical Records",
      onClick: () => handleNavigation("/medical"),
    },
    {
      key: "campus",
      icon: <SafetyOutlined />,
      label: "Campus Access",
      onClick: () => handleNavigation("/campus"),
    },
    {
      key: "hostel",
      icon: <ApartmentOutlined />,
      label: "Hostel Management",
      onClick: () => handleNavigation("/hostel"),
    },
    {
      key: "attendance",
      icon: <ScheduleOutlined />,
      label: "Class Attendance",
      onClick: () => handleNavigation("/attendance"),
    },
    {
      key: "exam schedule",
      icon: <FileTextOutlined />,
      label: "Exam Schedule",
      onClick: () => handleNavigation("/examSchedule"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Log Out",
      onClick: handleLogout,
    },
  ];

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
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 1000,
            }}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        variants={sidebarVariants}
        style={{
          position: "fixed",
          top: "70px",
          left: 0,
          bottom: 0,
          width: "250px",
          background: "white",
          zIndex: 1001,
          boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
        }}
      >
        <Menu
          mode="inline"
          style={{ borderRight: 0 }}
          items={sidebarItems}
        />
        <div style={{ position: "absolute", bottom: "20px", width: "100%", display: "flex", justifyContent: "center" }}>
          <BluetoothButton />
        </div>
      </motion.div>
    </>
  );
};

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AppHeader toggleSidebar={toggleSidebar} />
      <AppSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Layout>
        <Content style={{ marginTop: "70px", padding: "24px" }}>
        {children}
        </Content>
      </Layout>
    </Layout>
  );
};

AppLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

AppHeader.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
};

AppSidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
};

export default AppLayout;