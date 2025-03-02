import React, { useState } from "react";
import "./SignupUser.css";
import image from "../../assets/images/white 1.png";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../utils/firebase/firebase"; // Adjust the path to your firebase.js file
import { Alert, AlertTitle } from "@mui/material";
import { useNavigate, Link } from "react-router-dom";
import { PulseLoader } from "react-spinners";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

const SignupUser  = () => {
  const [name, setName] = useState(""); // State for user's name
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // For confirm password visibility

  const navigate = useNavigate();

 

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
        setError("Passwords do not match!");
        return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update the user's profile with the display name
        await updateProfile(user, { displayName: name });

        // Show success message
        setSuccess("Successfully registered! Redirecting to the dashboard...");

        // Wait 3 seconds before navigating
        setTimeout(() => {
            navigate("/students", { replace: true });
        }, 3000); // 3-second delay
    } catch (err) {
        console.error("Error during registration:", err.message);

        // Handle specific Firebase Auth errors
        if (err.code === "auth/email-already-in-use") {
            setError("This email is already registered. Please log in.");
        } else {
            setError("An unexpected error occurred. Please try again.");
        }
    } finally {
        setIsLoading(false);
    }
};

   return (
    <div className="container">
      <img
        src={image}
        alt="Yaba College of Technology Logo"
        className="logo-1"
      />

      <form onSubmit={handleSubmit} className="Regform">
        <div className="title">REGISTRATION</div>

        {/* Error Message */}
        {error && (
          <Alert severity="error" className="alert">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {/* Success Message */}
        {success && (
          <Alert severity="success" className="alert">
            <AlertTitle>Success</AlertTitle>
            {success}
          </Alert>
        )}

        {/* Loader */}
        {isLoading && (
          <div className="flex justify-center mb-4">
            <PulseLoader color="#FFFF" size={10} margin={5} />
          </div>
        )}

        <label htmlFor="name">Enter Your Name</label>
        <input
          type="text"
          placeholder="Famade Eniola"
          value={name}
          onChange={(e) => setName(e.target.value)} // Update name state
          required
        />

        <label htmlFor="email">Enter Email Address</label>
        <input
          type="email"
          placeholder="sample@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

          {/* ////////////// */}


        <label htmlFor="confirmPassword">Confirm Password</label>
        <div className="password-container">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="**************"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <span
            className="toggle-password"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
          </span>
        </div>
          {/* /////////////////// */}


        <button type="submit" disabled={isLoading}>
          {isLoading ? "Sigining..." : "Signup"}
        </button>
      </form>

      {/* Navigation Link */}
      <p className="loglink">
        Already have an account?{" "}
        <Link to="/login" className="link">
          Login here
        </Link>
      </p>
    </div>
  );
};

export default SignupUser;
