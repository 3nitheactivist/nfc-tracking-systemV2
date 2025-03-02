import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { COLLECTIONS } from '../../constants/collections';

// Assuming you have a MEDICAL_RECORDS collection defined in your constants file
// If not, you can add it or use a string directly

export const medicalService = {
  // Record new medical record
  async addMedicalRecord(recordData) {
    try {
      const medicalRecord = {
        ...recordData,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'medicalRecords'), medicalRecord);
      return { success: true, recordId: docRef.id };
    } catch (error) {
      console.error('Error adding medical record:', error);
      throw error;
    }
  },
  
  // Get medical records for a specific student
  async getStudentMedicalRecords(studentId) {
    try {
      const q = query(
        collection(db, 'medicalRecords'),
        where('patientId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        visitDate: doc.data().visitDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));
    } catch (error) {
      console.error('Error getting student medical records:', error);
      throw error;
    }
  },
  
  // Get all medical records
  async getAllMedicalRecords() {
    try {
      const q = query(
        collection(db, 'medicalRecords'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        visitDate: doc.data().visitDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));
    } catch (error) {
      console.error('Error getting all medical records:', error);
      throw error;
    }
  },
  
  // Delete a medical record
  async deleteMedicalRecord(recordId) {
    try {
      await deleteDoc(doc(db, 'medicalRecords', recordId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting medical record:', error);
      throw error;
    }
  },
  
  // Real-time listener for all medical records
  subscribeToAllMedicalRecords(callback) {
    const q = query(
      collection(db, 'medicalRecords'),
      orderBy('createdAt', 'desc')
    );
    
    // Return the unsubscribe function
    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        visitDate: doc.data().visitDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      callback(records);
    }, (error) => {
      console.error('Error subscribing to medical records:', error);
    });
  },
  
  // Real-time listener for a specific student's medical records
  subscribeToStudentMedicalRecords(studentId, callback) {
    const q = query(
      collection(db, 'medicalRecords'),
      where('patientId', '==', studentId),
      orderBy('createdAt', 'desc')
    );
    
    // Return the unsubscribe function
    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        visitDate: doc.data().visitDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      callback(records);
    }, (error) => {
      console.error(`Error subscribing to student ${studentId} medical records:`, error);
    });
  },
  
  // Real-time listener for recent records (for dashboard)
  subscribeToRecentMedicalRecords(limit, callback) {
    const q = query(
      collection(db, 'medicalRecords'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );
    
    // Return the unsubscribe function
    return onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        visitDate: doc.data().visitDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      callback(records);
    }, (error) => {
      console.error('Error subscribing to recent medical records:', error);
    });
  }
}; 