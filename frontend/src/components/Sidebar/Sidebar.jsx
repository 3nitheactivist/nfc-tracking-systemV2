import React from "react";
import "./Sidebar.css";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../utils/firebase/firebase"; // Adjust path

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    toggleSidebar(); // Close the sidebar after navigation
    navigate(path);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully");
      navigate("/login"); // Redirect to login page after logout
    } catch (error) {
      console.error("Error logging out: ", error.message);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <button onClick={toggleSidebar} className="back-button">←</button>
        </div>
        <ul className="sidebar-menu">
          <li onClick={() => handleNavigation("/dashboard")}>Home</li>
          <li onClick={() => handleNavigation("#")}>Filter</li>
          <li onClick={() => handleNavigation("#")}>Settings</li>
          <li onClick={() => handleNavigation("/profile")}>Profile</li>
          <li onClick={handleLogout}>Log Out</li>
        </ul>
      </div>
    </>
  );
};

export default Sidebar;

 