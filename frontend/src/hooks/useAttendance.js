import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase/firebase';

export const useAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAttendance = async (dateRange = null) => {
    setLoading(true);
    setError(null);
    try {
      const attendanceRef = collection(db, 'attendance');
      let q = query(attendanceRef, orderBy('timestamp', 'desc'));

      if (dateRange) {
        const [startDate, endDate] = dateRange;
        q = query(
          attendanceRef,
          where('timestamp', '>=', startDate),
          where('timestamp', '<=', endDate),
          orderBy('timestamp', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAttendanceRecords(records);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  return {
    attendanceRecords,
    loading,
    error,
    fetchAttendance
  };
};