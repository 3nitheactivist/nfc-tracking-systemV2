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

export const campusAccessService = {
  // Record a new campus access event
  async recordAccessEvent(eventData) {
    try {
      const accessEvent = {
        ...eventData,
        timestamp: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'campusAccess'), accessEvent);
      return { success: true, eventId: docRef.id };
    } catch (error) {
      console.error('Error recording access event:', error);
      throw error;
    }
  },
  
  // Get access events for a specific student
  async getStudentAccessEvents(studentId) {
    try {
      const q = query(
        collection(db, 'campusAccess'),
        where('studentId', '==', studentId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
    } catch (error) {
      console.error('Error getting student access events:', error);
      throw error;
    }
  },
  
  // Get all access events
  async getAllAccessEvents() {
    try {
      const q = query(
        collection(db, 'campusAccess'),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
    } catch (error) {
      console.error('Error getting all access events:', error);
      throw error;
    }
  },
  
  // Delete an access event
  async deleteAccessEvent(eventId) {
    try {
      await deleteDoc(doc(db, 'campusAccess', eventId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting access event:', error);
      throw error;
    }
  },
  
  // Real-time listener for all access events
  subscribeToAllAccessEvents(callback) {
    const q = query(
      collection(db, 'campusAccess'),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      callback(events);
    }, (error) => {
      console.error('Error subscribing to access events:', error);
    });
  },
  
  // Real-time listener for a specific student's access events
  subscribeToStudentAccessEvents(studentId, callback) {
    const q = query(
      collection(db, 'campusAccess'),
      where('studentId', '==', studentId),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      callback(events);
    }, (error) => {
      console.error(`Error subscribing to student ${studentId} access events:`, error);
    });
  },
  
  // Real-time listener for recent access events (for dashboard)
  subscribeToRecentAccessEvents(limit, callback) {
    const q = query(
      collection(db, 'campusAccess'),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );
    
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      callback(events);
    }, (error) => {
      console.error('Error subscribing to recent access events:', error);
    });
  },
  
  // Get today's access events
  subscribeToDailyAccessEvents(callback) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, 'campusAccess'),
      where('timestamp', '>=', startOfDay),
      orderBy('timestamp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      callback(events);
    }, (error) => {
      console.error('Error subscribing to daily access events:', error);
    });
  },
  
  // Real-time listener for limited access events
  subscribeToLimitedAccessEvents(limit, callback) {
    const q = query(
      collection(db, 'campusAccess'),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );
    
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      callback(events);
    }, (error) => {
      console.error('Error subscribing to limited access events:', error);
    });
  }
};