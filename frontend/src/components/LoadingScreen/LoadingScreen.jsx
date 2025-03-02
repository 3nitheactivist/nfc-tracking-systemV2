import React, { useEffect } from "react";
import PropTypes from 'prop-types';
import "./LoadingScreen.css";
import Ylogo from "../../assets/images/white 1.png";
import { PulseLoader } from "react-spinners";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../utils/firebase/firebase"; // Adjust path if needed

const LoadingScreen = ({ delay = 3000 }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setTimeout(() => {
        navigate(user ? "/students" : "/login");
      }, delay);
    });

    return () => unsubscribe();
  }, [navigate, delay]);

  return (
    <div className="container" role="alert" aria-label="Loading">
      <img src={Ylogo} alt="Yaba College of Technology Logo" className="logo" />
      <PulseLoader color="#00923f" />
    </div>
  );
};

LoadingScreen.propTypes = {
  delay: PropTypes.number
};

export default LoadingScreen;

