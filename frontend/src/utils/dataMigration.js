// import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
// import { db, auth } from './firebase/firebase';

// export const migrateExistingData = async () => {
//   const user = auth.currentUser;
//   if (!user) {
//     console.error('User must be logged in to migrate data');
//     return;
//   }

//   const collections = ['students', 'courses', 'attendance', 'hostelAssignments'];
  
//   for (const collectionName of collections) {
//     try {
//       const querySnapshot = await getDocs(collection(db, collectionName));
      
//       for (const document of querySnapshot.docs) {
//         // Skip documents that already have a createdBy field
//         if (document.data().createdBy) continue;
        
//         await updateDoc(doc(db, collectionName, document.id), {
//           createdBy: user.uid
//         });
        
//         console.log(`Updated ${collectionName} document ${document.id}`);
//       }
      
//       console.log(`Migration completed for ${collectionName}`);
//     } catch (error) {
//       console.error(`Error migrating ${collectionName}:`, error);
//     }
//   }
  
//   console.log('Data migration completed');
// }; 