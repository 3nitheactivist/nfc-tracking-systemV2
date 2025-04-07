import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

// Your web app's Firebase configuration

const firebaseConfig = {
  apiKey: "AIzaSyCFYT6MkoqTdhQlVI4WAyZhu60yi-8xA3w",
  authDomain: "nfc-tag-tracking-systemv2.firebaseapp.com",
  projectId: "nfc-tag-tracking-systemv2",
  storageBucket: "nfc-tag-tracking-systemv2.firebasestorage.app",
  messagingSenderId: "865381535528",
  appId: "1:865381535528:web:66226fcd224a643aa4ca1d",
  measurementId: "G-N0X20QR56W"
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

export { db, auth, app };