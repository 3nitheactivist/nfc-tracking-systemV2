import React, { createContext, useState, useEffect } from "react";
import { auth } from "../firebase/firebase"; // Adjust path as needed
import { onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import PulseLoader from "react-spinners/PulseLoader"; // Import the spinner

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser , setCurrentUser ] = useState(null);
  const [loading, setLoading] = useState(true); // Add a loading state for smoother transitions

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Ensure persistence across refreshes
        await setPersistence(auth, browserLocalPersistence);

        // Monitor authentication state
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setCurrentUser (user);
          setLoading(false); // Done loading once we determine the user
        });

        return () => unsubscribe(); // Cleanup on unmount
      } catch (error) {
        console.error("Error initializing authentication:", error);
        setLoading(false); // Ensure the UI renders even on error
      }
    };

    initializeAuth();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f4f4" }}>
        <PulseLoader color="#00923f" size={15} />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ currentUser  }}>
      {children}
    </AuthContext.Provider>
  );
};
