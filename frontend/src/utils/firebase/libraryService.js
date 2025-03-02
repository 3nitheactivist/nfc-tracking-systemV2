import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { COLLECTIONS } from '../../constants/collections';

// Helper functions for date operations
const getStartOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const getEndOfDay = (date) => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

export const libraryService = {
  // Record library access (check-in or check-out)
  async recordAccess(accessData) {
    try {
      const accessRecord = {
        ...accessData,
        timestamp: serverTimestamp()
      };
      
      await addDoc(collection(db, COLLECTIONS.LIBRARY_ACCESS), accessRecord);
      return { success: true };
    } catch (error) {
      console.error('Error recording library access:', error);
      throw error;
    }
  },
  
  // Get library access history
  async getAccessHistory() {
    try {
      const q = query(
        collection(db, COLLECTIONS.LIBRARY_ACCESS),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting access history:', error);
      throw error;
    }
  },
  
  // Get recent activity for dashboard
  async getRecentActivity(limit = 5) {
    try {
      const q = query(
        collection(db, COLLECTIONS.LIBRARY_ACCESS),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw error;
    }
  },
  
  // Get access history for a specific student
  async getStudentAccessHistory(studentId, limit = 10) {
    try {
      const q = query(
        collection(db, COLLECTIONS.LIBRARY_ACCESS),
        where('studentId', '==', studentId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting student access history:', error);
      throw error;
    }
  },
  
  // Get library statistics
  async getStatistics() {
    try {
      // Get today's check-ins
      const today = new Date();
      const startOfToday = getStartOfDay(today);
      
      // Get all access records for today
      const accessRecords = await this.getAccessHistory();
      
      // Filter for today's records
      const todayRecords = accessRecords.filter(record => {
        if (!record.timestamp) return false;
        const recordDate = new Date(record.timestamp.seconds * 1000);
        return recordDate >= startOfToday;
      });
      
      // Count check-ins and check-outs
      const checkIns = todayRecords.filter(record => record.accessType === 'check-in').length;
      
      // Count current visitors (check-ins minus check-outs)
      const checkOuts = todayRecords.filter(record => record.accessType === 'check-out').length;
      const currentVisitors = checkIns - checkOuts;
      
      // Count books issued (mock data for now)
      const booksIssued = 37; // This would come from a books collection in a real app
      
      // Calculate average stay time
      let totalStayTime = 0;
      let stayCount = 0;
      
      todayRecords.forEach(record => {
        if (record.accessType === 'check-out' && record.duration) {
          totalStayTime += record.duration;
          stayCount++;
        }
      });
      
      const averageStayTime = stayCount > 0 ? Math.round(totalStayTime / stayCount) : 0;
      
      return {
        currentVisitors: Math.max(0, currentVisitors), // Ensure it's not negative
        totalCheckInsToday: checkIns,
        booksIssued,
        averageStayTime
      };
    } catch (error) {
      console.error('Error getting library statistics:', error);
      // Return default values if there's an error
      return {
        currentVisitors: 0,
        totalCheckInsToday: 0,
        booksIssued: 0,
        averageStayTime: 0
      };
    }
  }
};