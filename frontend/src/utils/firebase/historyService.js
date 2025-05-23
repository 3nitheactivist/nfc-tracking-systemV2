// Student History Service: Aggregates a student's activity across all modules
import { attendanceService } from './attendanceService';
import { libraryService } from './libraryService';
import { campusAccessService } from './campusAccessService';
import { medicalService } from './medicalService';
import { db } from './firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

// Fetch attendance records (class attendance)
async function fetchAttendanceHistory(studentId) {
  // Try both 'attendance' and 'ClassAttendanceRecords' collections
  let records = [];
  try {
    // Try 'attendance' collection
    const q1 = query(collection(db, 'attendance'), where('studentId', '==', studentId), orderBy('timestamp', 'desc'));
    const snap1 = await getDocs(q1);
    records = snap1.docs.map(doc => ({ id: doc.id, ...doc.data(), module: 'Class Attendance' }));
    if (records.length > 0) return records;
  } catch {}
  try {
    // Try 'ClassAttendanceRecords' collection
    const q2 = query(collection(db, 'ClassAttendanceRecords'), where('studentId', '==', studentId), orderBy('checkInTime', 'desc'));
    const snap2 = await getDocs(q2);
    records = snap2.docs.map(doc => ({ id: doc.id, ...doc.data(), module: 'Class Attendance' }));
    return records;
  } catch {}
  return [];
}

// Fetch library access records
async function fetchLibraryHistory(studentId) {
  try {
    return await libraryService.getStudentAccessHistory(studentId, 50).then(records =>
      records.map(r => ({ ...r, module: 'Library' }))
    );
  } catch {
    return [];
  }
}

// Fetch campus access records
async function fetchCampusAccessHistory(studentId) {
  try {
    return await campusAccessService.getStudentAccessEvents(studentId).then(records =>
      records.map(r => ({ ...r, module: 'Campus Access' }))
    );
  } catch {
    return [];
  }
}

// Fetch medical records
async function fetchMedicalHistory(studentId) {
  try {
    return await medicalService.getStudentMedicalRecords(studentId).then(records =>
      records.map(r => ({ ...r, module: 'Medical' }))
    );
  } catch {
    return [];
  }
}

// Fetch exam attendance and absence records
async function fetchExamAttendanceHistory(studentId) {
  try {
    // Fetch all registrations for this student
    const regQ = query(
      collection(db, 'examRegistrations'),
      where('studentId', '==', studentId)
    );
    const regSnap = await getDocs(regQ);
    const registrations = regSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Fetch all attendance records for this student
    const attQ = query(
      collection(db, 'examAttendance'),
      where('studentId', '==', studentId)
    );
    const attSnap = await getDocs(attQ);
    const attendance = attSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Map attendance by examId for quick lookup
    const attendanceByExam = {};
    attendance.forEach(rec => {
      if (rec.examId) attendanceByExam[rec.examId] = rec;
    });

    // Cache for exam lookups
    const examCache = {};
    async function getExamDetails(examId) {
      if (!examId) return {};
      if (examCache[examId]) return examCache[examId];
      try {
        const examDoc = await getDocs(query(collection(db, 'Exams'), where('__name__', '==', examId)));
        if (!examDoc.empty) {
          const data = examDoc.docs[0].data();
          examCache[examId] = {
            examTitle: data.courseName || examId,
            courseCode: data.courseCode || '',
            examLocation: data.examLocation || '',
            duration: data.duration || '',
            examiner: data.examiner || '',
            examDate: data.examDate || '',
          };
          return examCache[examId];
        }
      } catch {}
      examCache[examId] = { examTitle: examId };
      return examCache[examId];
    }

    // For each registration, check for attendance
    const allExamHistory = await Promise.all(registrations.map(async reg => {
      const att = attendanceByExam[reg.examId];
      const examDetails = await getExamDetails(reg.examId);
      if (att) {
        // Completed or in-progress attendance
        return {
          ...att,
          module: 'Exam Attendance',
          examTitle: att.examTitle || examDetails.examTitle || '',
          courseCode: examDetails.courseCode,
          examLocation: examDetails.examLocation,
          duration: examDetails.duration,
          examiner: examDetails.examiner,
          examDate: examDetails.examDate,
          status: att.status || 'completed',
          checkInTime: att.checkInTime,
          checkOutTime: att.checkOutTime,
        };
      } else {
        // Absent
        return {
          id: reg.id + '_absent',
          module: 'Exam Attendance',
          examId: reg.examId,
          examTitle: examDetails.examTitle,
          courseCode: examDetails.courseCode,
          examLocation: examDetails.examLocation,
          duration: examDetails.duration,
          examiner: examDetails.examiner,
          examDate: examDetails.examDate,
          status: 'absent',
          registeredAt: reg.registeredAt,
        };
      }
    }));

    // Sort by checkInTime, checkOutTime, registeredAt, or createdAt (desc)
    allExamHistory.sort((a, b) => {
      const getDate = (rec) => rec.checkInTime || rec.checkOutTime || rec.registeredAt || rec.createdAt || rec.timestamp || 0;
      return new Date(getDate(b)) - new Date(getDate(a));
    });
    return allExamHistory;
  } catch {
    return [];
  }
}

// Main function: fetch and group all history
export async function fetchStudentFullHistory(studentId) {
  const [attendance, library, campus, medical, exam] = await Promise.all([
    fetchAttendanceHistory(studentId),
    fetchLibraryHistory(studentId),
    fetchCampusAccessHistory(studentId),
    fetchMedicalHistory(studentId),
    fetchExamAttendanceHistory(studentId)
  ]);
  // Combine and sort all records by date descending
  const all = [
    ...attendance,
    ...library,
    ...campus,
    ...medical,
    ...exam
  ];
  // Use the most relevant date field for sorting
  all.sort((a, b) => {
    const getDate = (rec) => rec.timestamp || rec.checkInTime || rec.createdAt || rec.visitDate || rec.date || 0;
    return new Date(getDate(b)) - new Date(getDate(a));
  });
  // Group by module
  const grouped = all.reduce((acc, rec) => {
    if (!acc[rec.module]) acc[rec.module] = [];
    acc[rec.module].push(rec);
    return acc;
  }, {});
  return grouped;
} 