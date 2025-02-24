import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyD2UGRo1F4yJVrptpK_PWaZ5vyICBgch-0",
  authDomain: "nfc-tag-tracking-system.firebaseapp.com",
  projectId: "nfc-tag-tracking-system",
  storageBucket: "nfc-tag-tracking-system.firebasestorage.app",
  messagingSenderId: "1007751154923",
  appId: "1:1007751154923:web:ac24f02ba1b6c49d4ec2ae",
  measurementId: "G-B5GC8HS4BN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore (Database)
const db = getFirestore(app);

// Authentication with Persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error setting persistence:", error);
});

export { db, auth };