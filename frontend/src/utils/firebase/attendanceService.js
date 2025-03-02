import { db } from './firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export const attendanceService = {
  async recordAttendance(studentId, classData) {
    return await addDoc(collection(db, 'ClassAttendanceRecords'), {
      studentId,
      ...classData,
      checkInTime: new Date(),
      status: 'present'
    });
  },

  async getStudentAttendance(studentId, courseCode) {
    const q = query(
      collection(db, 'ClassAttendanceRecords'),
      where('studentId', '==', studentId),
      where('courseCode', '==', courseCode)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};