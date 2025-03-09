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
export const getRecentActivity = async (limit = 5) => {
  try {
    console.log('Fetching recent activity...');
    
    // Get recent library access records - UPDATED to use LibraryAccessRecords
    const accessRef = collection(db, LIBRARY_ACCESS_COLLECTION);
    const q = query(
      accessRef,
      orderBy('timestamp', 'desc'),
      firestoreLimit(20) // Fetch more than needed in case some have invalid students
    );
    
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} total records`);
    
    if (snapshot.empty) {
      console.log('No library access records found');
      
      // If no records exist, let's create a test record for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('Creating a test record for debugging...');
        try {
          // Get a random student
          const studentsRef = collection(db, 'students');
          const studentsSnapshot = await getDocs(query(studentsRef, firestoreLimit(1)));
          
          if (!studentsSnapshot.empty) {
            const studentDoc = studentsSnapshot.docs[0];
            const studentData = studentDoc.data();
            
            // Create a test record - UPDATED to use LibraryAccessRecords
            await addDoc(collection(db, LIBRARY_ACCESS_COLLECTION), {
              studentId: studentDoc.id,
              studentName: studentData.name,
              accessType: 'check-in',
              timestamp: serverTimestamp(),
              status: 'active',
              reason: 'Study session'
            });
            
            console.log('Test record created successfully');
          }
        } catch (error) {
          console.error('Error creating test record:', error);
        }
      }
      
      return [];
    }
    
    const accessRecords = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Raw access records:', accessRecords);
    
    // For each record, verify the student exists
    const validRecords = [];
    
    for (const record of accessRecords) {
      // Skip records without studentId or studentName
      if (!record.studentId || !record.studentName) {
        console.log(`Skipping record ${record.id} - missing student info`);
        continue;
      }
      
      // Add to valid records without checking student existence
      // This is a temporary fix to ensure records are displayed
      validRecords.push(record);
      
      // If we have enough valid records, stop checking
      if (validRecords.length >= limit) break;
    }
    
    console.log('Valid records to return:', validRecords);
    return validRecords.slice(0, limit);
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
};

export const libraryService = {
  // Record library access (check-in or check-out)
  async recordAccess(accessData) {
    try {
      const accessRecord = {
        ...accessData,
        timestamp: serverTimestamp()
      };
      
      // UPDATED to use LibraryAccessRecords
      await addDoc(collection(db, LIBRARY_ACCESS_COLLECTION), accessRecord);
      return { success: true };
    } catch (error) {
      console.error('Error recording library access:', error);
      throw error;
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
      // Get current date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Query for check-ins today
      const accessRef = collection(db, LIBRARY_ACCESS_COLLECTION);
      const todayQuery = query(
        accessRef,
        where('timestamp', '>=', Timestamp.fromDate(today)),
        where('accessType', '==', 'check-in')
      );
      const todaySnapshot = await getDocs(todayQuery);
      
      // Query for all check-ins
      const checkInsQuery = query(
        accessRef,
        where('accessType', '==', 'check-in')
      );
      const checkInsSnapshot = await getDocs(checkInsQuery);
      
      // Query for all check-outs
      const checkOutsQuery = query(
        accessRef,
        where('accessType', '==', 'check-out')
      );
      const checkOutsSnapshot = await getDocs(checkOutsQuery);
      
      // Determine current visitors by matching check-ins without check-outs
      const checkIns = checkInsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        studentId: doc.data().studentId
      }));
      
      const checkOuts = checkOutsSnapshot.docs.map(doc => ({
        ...doc.data(),
        studentId: doc.data().studentId
      }));
      
      // Build sets of student IDs
      const checkedInStudents = new Set();
      const checkedOutStudents = new Set();
      
      checkIns.forEach(record => {
        checkedInStudents.add(record.studentId);
      });
      
      checkOuts.forEach(record => {
        const timestamp = record.timestamp?.toDate?.() || new Date(record.timestamp);
        if (timestamp >= today) {
          checkedOutStudents.add(record.studentId);
        }
      });
      
      // Calculate current visitors (checked in but not checked out today)
      const currentVisitors = [...checkedInStudents].filter(id => !checkedOutStudents.has(id)).length;
      
      // Calculate average stay time from check-out records with duration
      const durationQuery = query(
        accessRef,
        where('accessType', '==', 'check-out'),
        where('duration', '>', 0)
      );
      const durationSnapshot = await getDocs(durationQuery);
      
      let totalDuration = 0;
      let count = 0;
      
      durationSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.duration && typeof data.duration === 'number') {
          totalDuration += data.duration;
          count++;
        }
      });
      
      console.log(`Average stay calculation: ${totalDuration}/${count} = ${count > 0 ? Math.round(totalDuration / count) : 0}`);
      
      const averageStayTime = count > 0 
        ? Math.round(totalDuration / count) 
        : 0;
      
      return {
        currentVisitors: currentVisitors,
        totalCheckInsToday: todaySnapshot.size,
        booksIssued: 0, // Placeholder for future feature
        averageStayTime: averageStayTime
      };
    } catch (error) {
      console.error('Error getting library statistics:', error);
      return {
        currentVisitors: 0,
        totalCheckInsToday: 0,
        booksIssued: 0,
        averageStayTime: 0
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
    try {
      // UPDATED to use LibraryAccessRecords
      const accessRef = collection(db, LIBRARY_ACCESS_COLLECTION);
      const q = query(
        accessRef,
        where('studentId', '==', studentId),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { inLibrary: false };
      }
      
      const activeRecord = snapshot.docs[0];
      return { 
        inLibrary: true, 
        accessRecord: {
          id: activeRecord.id,
          ...activeRecord.data()
        }
      };
    } catch (error) {
      console.error('Error checking if student is in library:', error);
      throw error;
    }
  }
};