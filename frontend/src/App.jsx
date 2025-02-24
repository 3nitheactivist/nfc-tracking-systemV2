import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./utils/config/AuthProvider"; // Ensure this path matches your project
import HomeScreen from "./components/HomeScreen/HomeScreen";
import RegisterStudent from "./components/EnrollStudent/EnrollStudents";
import TakeAttendance from "./components/TakeAttendance/TakeAttendance";
import AttendanceVerification from "./components/ViewAttendance/ViewAttendance";
import SignupUser from "./components/SignupUser/SignupUser";
import LoginUser from "./components/LoginUser/LoginUser";
import LoadingScreen from "./components/LoadingScreen/LoadingScreen";
import Profile from "./components/Profile/Profile";
import PrivateRoute from "./components/PrivateRoute";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import ViewExams from "./components/ViewExams/ViewExams";
import { BluetoothProvider } from "./components/BluetoothButton/BluetoothContext";
import { AppLayout } from "./components/AppLayout/AppLayout";
// import "antd/dist/reset.css";
import "antd/dist/reset.css";
import EnrollStudent from "./components/EnrollStudent/EnrollStudents";
import ViewStudents from "./components/EnrollStudent/ViewStudents/ViewStudents";
import StudentProfile from "./components/StudentProfile/StudentProfile";
function App() {
  return (
    <AuthProvider>
      <BluetoothProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoadingScreen />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <HomeScreen />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route path="/signup" element={<SignupUser />} />
            <Route path="/login" element={<LoginUser />} />
            <Route path="/forgotPassword" element={<ForgotPassword />} />
            <Route
              path="/registerStudent"
              element={
                <PrivateRoute>
                  <RegisterStudent />
                </PrivateRoute>
              }
            />
            <Route
              path="/viewExams"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <ViewExams />
                  </AppLayout>
                </PrivateRoute>
              }
            />
               <Route
              path="/student-profile/:studentId"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <StudentProfile />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/viewStudents"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <ViewStudents />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/enrollStudents"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <EnrollStudent />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/takeAttendance"
              element={
                <PrivateRoute>
                  <TakeAttendance />
                </PrivateRoute>
              }
            />
            <Route
              path="/viewExamAttendance"
              element={
                <PrivateRoute>
                  <AppLayout>
                    <AttendanceVerification />
                  </AppLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </BluetoothProvider>
    </AuthProvider>
  );
}

export default App;
