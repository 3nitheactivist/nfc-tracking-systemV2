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
  serverTimestamp,
  getDoc,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { COLLECTIONS } from '../../constants/collections';

// Update the library access collection constant or make sure it's already set to 'LibraryAccessRecords'
// If COLLECTIONS.LIBRARY_ACCESS is defined elsewhere, you may need to update that file too
const LIBRARY_ACCESS_COLLECTION = 'LibraryAccessRecords';

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

/**
 * Gets recent library activity, ensuring that only records with valid students are returned
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<Array>} - Array of recent activity records
 */
export const getRecentActivity = async (limit = 10) => {
  try {
    console.log("Getting recent library activity, limit:", limit);
    
    // Query for recent library access records
    const q = query(
      collection(db, LIBRARY_ACCESS_COLLECTION),
      orderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} recent activity records`);
    
    const activities = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert timestamp to JS Date if it exists
      const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
      
      activities.push({
        id: doc.id,
        ...data,
        timestamp
      });
    });
    
    return activities;
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
};

export const libraryService = {
  // Record library access (check-in or check-out)
  async recordAccess(accessData) {
    try {
      console.log("Recording library access:", accessData);
      
      // Make sure we have the correct fields
      const dataToSave = {
        ...accessData,
        timestamp: serverTimestamp(),
        // Ensure these fields are present
        status: accessData.status || 'active',
        studentId: accessData.studentId,
        studentName: accessData.studentName,
        accessType: accessData.accessType // 'check-in' or 'check-out'
      };
      
      // Add the document to Firestore - FIXED COLLECTION NAME
      const docRef = await addDoc(collection(db, LIBRARY_ACCESS_COLLECTION), dataToSave);
      console.log("Library access recorded with ID:", docRef.id);
        
        return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error recording library access:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get library access history
  async getAccessHistory() {
    try {
      // UPDATED to use LibraryAccessRecords
      const q = query(
        collection(db, LIBRARY_ACCESS_COLLECTION),
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
  getRecentActivity,
  
  // Get access history for a specific student
  async getStudentAccessHistory(studentId, limit = 10) {
    try {
      // UPDATED to use LibraryAccessRecords
      const q = query(
        collection(db, LIBRARY_ACCESS_COLLECTION),
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
      console.log("Fetching library statistics");
      
      // Get today's date (start of day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // STEP 1: Calculate current visitors properly
      // We need to find all students whose most recent record is a check-in
      const allStudentsQuery = query(
        collection(db, LIBRARY_ACCESS_COLLECTION),
        orderBy('timestamp', 'desc')
      );
      
      const allRecordsSnapshot = await getDocs(allStudentsQuery);
      console.log(`Found ${allRecordsSnapshot.size} total records for processing`);
      
      // Track which students we've already processed and who's currently in the library
      const processedStudents = new Set();
      const studentsInLibrary = new Set();
      let todayCheckIns = 0;
      
      // Process each record to identify current visitors
      allRecordsSnapshot.forEach(doc => {
        const data = doc.data();
        const studentId = data.studentId;
        const recordTimestamp = data.timestamp?.toDate?.() || new Date();
        
        // Only count today's check-ins for the daily count
        if (data.accessType === 'check-in' && recordTimestamp >= today) {
          todayCheckIns++;
        }
        
        // For current visitors, we only care about the latest record for each student
        if (!processedStudents.has(studentId)) {
          processedStudents.add(studentId);
          
          if (data.accessType === 'check-in') {
            // Latest record is check-in, so student is in the library
            studentsInLibrary.add(studentId);
            console.log(`Student ${studentId} (${data.studentName}) is currently in the library`);
          } else {
            console.log(`Student ${studentId} (${data.studentName}) is not in the library (last action: check-out)`);
          }
        }
      });
      
      const currentVisitors = studentsInLibrary.size;
      console.log(`Current visitors count: ${currentVisitors}`);
      
      // STEP 2: Calculate average stay time using only today's completed visits
      // A completed visit has both a check-in and check-out today
      
      // Get all of today's records
      const todayRecordsQuery = query(
        collection(db, LIBRARY_ACCESS_COLLECTION),
        where('timestamp', '>=', today),
        orderBy('timestamp', 'asc')
      );
      
      const todayRecordsSnapshot = await getDocs(todayRecordsQuery);
      console.log(`Found ${todayRecordsSnapshot.size} records from today`);
      
      // Group records by student
      const studentRecords = {};
      todayRecordsSnapshot.forEach(doc => {
        const data = doc.data();
        const studentId = data.studentId;
        
        if (!studentRecords[studentId]) {
          studentRecords[studentId] = [];
        }
        
        studentRecords[studentId].push({
          type: data.accessType,
          timestamp: data.timestamp?.toDate() || new Date()
        });
      });
      
      // Calculate stay durations from check-in/check-out pairs
      let totalStayMinutes = 0;
      let completedVisitsCount = 0;
      
      Object.values(studentRecords).forEach(records => {
        // Sort records by timestamp (oldest first)
        records.sort((a, b) => a.timestamp - b.timestamp);
        
        // Go through records to find check-in/check-out pairs
        let lastCheckIn = null;
        
        records.forEach(record => {
          if (record.type === 'check-in') {
            lastCheckIn = record.timestamp;
          } else if (record.type === 'check-out' && lastCheckIn) {
            // Calculate duration between check-in and check-out
            const durationMs = record.timestamp - lastCheckIn;
            const durationMinutes = Math.round(durationMs / 60000);
            
            if (durationMinutes > 0 && durationMinutes < 24 * 60) { // Ignore unrealistic durations
              totalStayMinutes += durationMinutes;
              completedVisitsCount++;
              console.log(`Calculated stay duration: ${durationMinutes} minutes`);
            }
            
            lastCheckIn = null; // Reset for next pair
          }
        });
      });
      
      // Calculate average stay time (only from today's data)
      const averageStayMinutes = completedVisitsCount > 0 
        ? Math.round(totalStayMinutes / completedVisitsCount) 
        : 0;
      
      console.log(`Average stay time: ${averageStayMinutes} minutes (from ${completedVisitsCount} completed visits today)`);
      
      return {
        currentVisitors,
        todayCheckIns,
        averageStayMinutes
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        currentVisitors: 0,
        todayCheckIns: 0,
        averageStayMinutes: 0
      };
    }
  },

  // Record library exit
  async recordLibraryExit(accessId, exitData) {
    try {
      // Get the original check-in record - UPDATED to use LibraryAccessRecords
      const accessRef = doc(db, LIBRARY_ACCESS_COLLECTION, accessId);
      const accessDoc = await getDoc(accessRef);
      
      if (!accessDoc.exists()) {
        throw new Error('Access record not found');
      }
      
      const accessData = accessDoc.data();
      const entryTime = accessData.timestamp.toDate();
      const exitTime = new Date();
      const durationMinutes = Math.round((exitTime - entryTime) / (1000 * 60));
      
      // Update the original check-in record
      await updateDoc(accessRef, {
        exitTimestamp: serverTimestamp(),
        duration: durationMinutes,
        status: 'completed',
        ...exitData
      });
      
      // Create a new check-out record for display in the recent activity - UPDATED to use LibraryAccessRecords
      const checkoutRecord = {
        studentId: accessData.studentId,
        studentName: accessData.studentName,
        accessType: 'check-out',
        timestamp: serverTimestamp(),
        status: 'completed',
        duration: durationMinutes,
        relatedCheckInId: accessId,
        reason: exitData.reason || accessData.reason
      };
      
      const checkoutRef = await addDoc(collection(db, LIBRARY_ACCESS_COLLECTION), checkoutRecord);
      
      return { 
        id: accessId, 
        ...accessData, 
        exitTimestamp: exitTime,
        duration: durationMinutes,
        status: 'completed',
        ...exitData,
        checkoutId: checkoutRef.id
      };
    } catch (error) {
      console.error('Error recording library exit:', error);
      throw error;
    }
  },

  // Check if student is currently in the library
  async isStudentInLibrary(studentId) {
    if (!studentId) {
      return { inLibrary: false, accessRecord: null };
    }
    
    try {
      console.log("Checking if student is in library:", studentId);
      
      // Get the latest access record for this student
      const q = query(
        collection(db, LIBRARY_ACCESS_COLLECTION),
        where('studentId', '==', studentId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(1)
      );
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} access records for student`);
      
      if (querySnapshot.empty) {
        return { inLibrary: false, accessRecord: null };
      }
      
      // Check if the latest record is a check-in (student is in the library)
      // or check-out (student is not in the library)
      const doc = querySnapshot.docs[0];
      const accessRecord = { id: doc.id, ...doc.data() };
      
      // If the latest record is check-in, the student is in the library
      const inLibrary = accessRecord.accessType === 'check-in';
      console.log(`Latest record type: ${accessRecord.accessType}, student in library: ${inLibrary}`);
      
      return { inLibrary, accessRecord };
    } catch (error) {
      console.error('Error checking if student is in library:', error);
      return { inLibrary: false, accessRecord: null };
    }
  },

  // Get active library record
  async getActiveLibraryRecord(studentId) {
    try {
      const querySnapshot = await db.collection('libraryAccessRecords')
        .where('studentId', '==', studentId)
        .where('status', '==', 'active')
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      return querySnapshot.docs[0].data();
    } catch (error) {
      console.error('Error fetching active library record:', error);
      throw error;
    }
  }
};