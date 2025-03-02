import React, { useState } from "react";
import image from "../../assets/images/white 1.png";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../utils/firebase/firebase"; // Adjust path to your Firebase configuration
import { Alert, AlertTitle } from "@mui/material";
import "../LoginUser/LoginUser.css";
import { PulseLoader } from "react-spinners";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

function LoginUser() {
  const [email, setEmail] = useState(""); // Email state
  const [password, setPassword] = useState(""); // Password state
  const [error, setError] = useState(null); // To store error messages
  const [isLoading, setIsLoading] = useState(false); // Loader state
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility


  const navigate = useNavigate(); // To navigate to other pages

  console.log("Current User:", auth.currentUser);

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null); // Clear any previous errors
    setIsLoading(true); // Show the loader

    try {
      // Authenticate user with Firebase
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/students"); // Navigate to the students page on success
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email. Please sign up.");
      } else {
        setError("Login failed. Please try again.");
      }

      // Clear the error message after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 4000);
    } finally {
      setIsLoading(false); // Hide the loader
    }
  };

  return (
    <div className="container">
      <img
        src={image}
        alt="Yaba College of Technology Logo"
        className="logo-1"
      />

      <form className="Regform" onSubmit={handleLogin}>
        <div className="title">LOGIN</div>
        {/* Display Error Message */}
        {error && (
          <Alert severity="error" className="alert">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}
        {/* Show loader if isLoading is true */}
        {isLoading && (
          <div className="flex justify-center mb-4">
            <PulseLoader color="#FFF" size={10} margin={5} />
          </div>
        )}
        <label htmlFor="email">Enter Email Address</label>
        <input
          type="email"
          placeholder="sample@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Update email state
          required
        />
        <label htmlFor="password">Enter Password</label>
        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="**************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="toggle-password"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
          </span>
        </div>



        <button type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Log In"}
        </button>
        <Link to="/forgotPassword" className="link2">
          forgot password?
        </Link>
      </form>

      {/* Navigation Link to Signup */}
      <p className="loglink">
        Don't have an account?{" "}
        <Link to="/signup" className="link">
          Sign up here
        </Link>
      </p>
    </div>
  );
}

export default LoginUser;
