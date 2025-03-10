import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  orderBy,
  limit,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { COLLECTIONS } from '../../constants/collections';

export const studentService = {
  // Create new student
  async enrollStudent(studentData) {
    try {
      // Log the incoming data
      console.log('Attempting to enroll student with data:', studentData);

      // Only check for NFC tag if it's provided
      if (studentData.nfcTagId) {
        const nfcExists = await this.checkNFCTagExists(studentData.nfcTagId);
        console.log('NFC check result:', nfcExists);
        
        if (nfcExists) {
          throw new Error('NFC tag already registered');
        }
      }

      // Add student to Firestore
      const docRef = await addDoc(collection(db, COLLECTIONS.STUDENTS), {
        ...studentData,
        enrollmentDate: new Date(),
        status: 'active',
        permissions: {
          attendance: true,
          library: true,
          medical: true,
          campus: true,
          hostel: false // Requires additional approval
        }
      });

      console.log('Student enrolled successfully with ID:', docRef.id);
      return { success: true, studentId: docRef.id };
    } catch (error) {
      console.error('Error in enrollStudent:', error);
      throw error;
    }
  },

  // Check if NFC tag is already registered
  async checkNFCTagExists(nfcTagId) {
    try {
      console.log('Checking NFC tag:', nfcTagId);
      
      if (!nfcTagId) {
        console.log('No NFC tag provided');
        return false;
      }

      const q = query(
        collection(db, COLLECTIONS.STUDENTS), 
        where('nfcTagId', '==', nfcTagId)
      );
      
      const snapshot = await getDocs(q);
      const exists = !snapshot.empty;
      
      console.log('NFC tag exists:', exists);
      return exists;
    } catch (error) {
      console.error('Error checking NFC tag:', error);
      return false;
    }
  },

  // Get a student by their NFC ID
  async getStudentByNfcId(nfcId) {
    try {
      // Try lowercase first
      console.log(`Looking for student with NFC ID: ${nfcId}`);
      
      // Try both nfcId and nfcTagId fields
      let querySnapshot = await getDocs(
        query(collection(db, COLLECTIONS.STUDENTS), where('nfcId', '==', nfcId))
      );
      
      if (querySnapshot.empty) {
        console.log(`No student found with nfcId: ${nfcId}, trying nfcTagId`);
        querySnapshot = await getDocs(
          query(collection(db, COLLECTIONS.STUDENTS), where('nfcTagId', '==', nfcId))
        );
      }
      
      // If we found a match, return the student
      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        return {
          id: studentDoc.id,
          ...studentDoc.data()
        };
      }
      
      // If no direct match found, try a case-insensitive approach by getting all students
      console.log(`No direct match found, checking all students for NFC ID match`);
      const allStudentsSnapshot = await getDocs(collection(db, COLLECTIONS.STUDENTS));
      
      // Manually check each student for a match
      for (const studentDoc of allStudentsSnapshot.docs) {
        const studentData = studentDoc.data();
        const nfcTagId = studentData.nfcTagId;
        const studentNfcId = studentData.nfcId;
        
        // Create variations of the IDs for comparison
        const variations = [
          nfcId, 
          nfcId.toUpperCase(), 
          nfcId.toLowerCase(),
          `NFC_${nfcId}`,
          `NFC-${nfcId}`,
          nfcId.replace(/^(nfc[_-]?)/i, '')
        ];
        
        // Check for any match
        if (variations.includes(nfcTagId) || variations.includes(studentNfcId)) {
          console.log(`Found matching student: ${studentData.name}`);
          return {
            id: studentDoc.id,
            ...studentData
          };
        }
      }
      
      console.log(`No student found with NFC ID: ${nfcId} after trying all variations`);
      return null;
    } catch (error) {
      console.error('Error getting student by NFC ID:', error);
      throw error;
    }
  },
  
  // Update a student's NFC ID
  async updateStudentNfcId(studentId, nfcId) {
    try {
      const studentRef = doc(db, COLLECTIONS.STUDENTS, studentId);
      
      // Update both field names to ensure compatibility
      await updateDoc(studentRef, { 
        nfcId: nfcId,
        nfcTagId: nfcId 
      });
      
      console.log(`Updated student ${studentId} with NFC ID: ${nfcId}`);
      return true;
    } catch (error) {
      console.error('Error updating student NFC ID:', error);
      throw error;
    }
  },
  
  // Get a student by their ID
  async getStudentById(studentId) {
    try {
      const studentDoc = await getDoc(doc(db, COLLECTIONS.STUDENTS, studentId));
      
      if (!studentDoc.exists()) {
        return null;
      }
      
      const studentData = studentDoc.data();
      
      return {
        id: studentDoc.id,
        ...studentData,
        // Normalize the NFC ID field
        nfcId: studentData.nfcTagId || studentData.nfcId
      };
    } catch (error) {
      console.error('Error getting student by ID:', error);
      throw error;
    }
  },

  // Get all students
  async getAllStudents() {
    try {
      const q = query(
        collection(db, COLLECTIONS.STUDENTS),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Normalize the NFC ID field
          nfcId: data.nfcTagId || data.nfcId
        };
      });
    } catch (error) {
      console.error('Error getting all students:', error);
      throw error;
    }
  },

  // Delete student
  async deleteStudent(studentId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.STUDENTS, studentId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  },

  // Function to find student by NFC Tag ID
  async findStudentByNfcTagId(nfcTagId) {
    try {
      console.log(`Looking for student with NFC Tag ID: ${nfcTagId}`);
      
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('nfcTagId', '==', nfcTagId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const student = querySnapshot.docs[0].data();
        console.log('Student found:', student);
        return student;
      }
      
      console.log('No student found with NFC Tag ID');
      return null;
    } catch (error) {
      console.error('Error finding student by NFC Tag ID:', error);
      throw error;
    }
  },

  // Delete student and all related data
  async deleteStudentWithRelatedData(studentId) {
    try {
      const batch = writeBatch(db);
      
      // Delete attendance records
      const attendanceRef = collection(db, 'attendance');
      const attendanceQuery = query(attendanceRef, where('studentId', '==', studentId));
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      attendanceSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete hostel assignments
      const hostelAssignmentsRef = collection(db, 'hostelAssignments');
      const hostelAssignmentsQuery = query(hostelAssignmentsRef, where('studentId', '==', studentId));
      const hostelAssignmentsSnapshot = await getDocs(hostelAssignmentsQuery);
      
      hostelAssignmentsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete hostel access events
      const hostelEventsRef = collection(db, 'hostelAccessEvents');
      const hostelEventsQuery = query(hostelEventsRef, where('studentId', '==', studentId));
      const hostelEventsSnapshot = await getDocs(hostelEventsQuery);
      
      hostelEventsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete library access records
      const libraryAccessRef = collection(db, 'libraryAccess');
      const libraryAccessQuery = query(libraryAccessRef, where('studentId', '==', studentId));
      const libraryAccessSnapshot = await getDocs(libraryAccessQuery);
      
      libraryAccessSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete medical records
      const medicalRecordsRef = collection(db, 'medicalRecords');
      const medicalRecordsQuery = query(medicalRecordsRef, where('studentId', '==', studentId));
      const medicalRecordsSnapshot = await getDocs(medicalRecordsQuery);
      
      medicalRecordsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete campus access records
      const campusAccessRef = collection(db, 'campusAccess');
      const campusAccessQuery = query(campusAccessRef, where('studentId', '==', studentId));
      const campusAccessSnapshot = await getDocs(campusAccessQuery);
      
      campusAccessSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete the student record
      batch.delete(doc(db, 'students', studentId));
      
      // Commit all the deletions as a batch
      await batch.commit();
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting student with related data:', error);
      throw error;
    }
  }
};