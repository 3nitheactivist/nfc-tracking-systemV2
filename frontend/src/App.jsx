import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./utils/config/AuthProvider"; // Ensure this path matches your project
import HomeScreen from "./components/HomeScreen/HomeScreen";
import SignupUser from "./components/SignupUser/SignupUser";
import LoginUser from "./components/LoginUser/LoginUser";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
import PrivateRoute from "./components/PrivateRoute";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import { BluetoothProvider } from "./components/BluetoothButton/BluetoothContext";
import { AppLayout } from "./components/AppLayout/AppLayout";
import "antd/dist/reset.css";
import './styles/pages.css';
import AttendanceTrackingPage from "./pages/AttendanceTrackingPage";
import LibraryAccessPage from "./pages/LibraryAccessPage";
import MedicalRecordsPage from "./pages/MedicalRecordsPage";
import CampusAccessPage from "./pages/CampusAccessPage";
import HostelManagementPage from "./pages/HostelManagementPage";
import StudentEnrollmentPage from "./pages/StudentEnrollmentPage";
import StudentManagementPage from "./pages/StudentManagementPage";

function App() {
  return (
    <AuthProvider>
      <BluetoothProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoadingScreen />} />
            {/* <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <HomeScreen />
                  </AppLayout>
                </PrivateRoute>
              }
            /> */}
            <Route path="/signup" element={<SignupUser />} />
            <Route path="/login" element={<LoginUser />} />
            <Route path="/forgotPassword" element={<ForgotPassword />} />
          {/* ====== */}
            {/* <Route path="/dashboard" element={<PrivateRoute><AppLayout><StudentEnrollmentPage /></AppLayout></PrivateRoute>} /> */}
            <Route path="/attendance" element={<PrivateRoute><AppLayout><AttendanceTrackingPage /></AppLayout></PrivateRoute>} />
            <Route path="/library" element={<PrivateRoute><AppLayout><LibraryAccessPage /></AppLayout></PrivateRoute>} />
            <Route path="/medical" element={<PrivateRoute><AppLayout><MedicalRecordsPage /></AppLayout></PrivateRoute>} />
            <Route path="/campus" element={<PrivateRoute><AppLayout><CampusAccessPage /></AppLayout></PrivateRoute>} />
            <Route path="/hostel" element={<PrivateRoute><AppLayout><HostelManagementPage /></AppLayout></PrivateRoute>} />
            <Route path="/students" element={<PrivateRoute><AppLayout><StudentManagementPage /></AppLayout></PrivateRoute>} />
          </Routes>
        </Router>
      </BluetoothProvider>
    </AuthProvider>
  );
}

export default App;
