export const getStudentByNfcId = async (nfcId) => {
  console.log('studentService: Looking up student with nfcTagId:', nfcId);
  try {
    const querySnapshot = await getDocs(
      query(collection(db, 'students'), where('nfcTagId', '==', nfcId))
    );
    
    if (querySnapshot.empty) {
      console.log('studentService: No student found with nfcTagId:', nfcId);
      return null;
    }
    
    const student = querySnapshot.docs[0].data();
    console.log('studentService: Found student:', student.name);
    return { id: querySnapshot.docs[0].id, ...student };
  } catch (error) {
    console.error('studentService: Error looking up student:', error);
    throw error;
  }
}; 