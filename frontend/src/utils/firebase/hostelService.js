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
  updateDoc,
  serverTimestamp,
  onSnapshot,
  getDoc,
  setDoc
} from 'firebase/firestore';

export const hostelService = {
  // Get all hostels
  async getHostels() {
    try {
      const q = query(collection(db, 'hostels'), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting hostels:', error);
      throw error;
    }
  },
  
  // Get a specific hostel
  async getHostel(hostelId) {
    try {
      const docRef = doc(db, 'hostels', hostelId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting hostel:', error);
      throw error;
    }
  },
  
  // Add a new hostel
  async addHostel(hostelData) {
    try {
      const docRef = await addDoc(collection(db, 'hostels'), {
        ...hostelData,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding hostel:', error);
      throw error;
    }
  },
  
  // Update a hostel
  async updateHostel(hostelId, hostelData) {
    try {
      const docRef = doc(db, 'hostels', hostelId);
      await updateDoc(docRef, {
        ...hostelData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating hostel:', error);
      throw error;
    }
  },
  
  // Delete a hostel
  async deleteHostel(hostelId) {
    try {
      await deleteDoc(doc(db, 'hostels', hostelId));
      return true;
    } catch (error) {
      console.error('Error deleting hostel:', error);
      throw error;
    }
  },
  
  // Get all rooms for a hostel
  async getHostelRooms(hostelId) {
    try {
      const q = query(
        collection(db, 'hostelRooms'), 
        where('hostelId', '==', hostelId),
        orderBy('roomNumber')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting hostel rooms:', error);
      throw error;
    }
  },
  
  // Add a new room to a hostel
  async addRoom(roomData) {
    try {
      const docRef = await addDoc(collection(db, 'hostelRooms'), {
        ...roomData,
        createdAt: serverTimestamp(),
        occupants: [],
        capacity: roomData.capacity || 2,
        status: 'available'
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding room:', error);
      throw error;
    }
  },
  
  // Update a room
  async updateRoom(roomId, roomData) {
    try {
      const docRef = doc(db, 'hostelRooms', roomId);
      await updateDoc(docRef, {
        ...roomData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  },
  
  // Delete a room
  async deleteRoom(roomId) {
    try {
      await deleteDoc(doc(db, 'hostelRooms', roomId));
      return true;
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  },
  
  // Update student's hostel assignment
  async updateStudentHostelAssignment(studentId, assignment) {
    try {
      console.log(`Updating assignment for student ${studentId}`, assignment);
      
      // Get student document
      const studentRef = doc(db, 'students', studentId);
      const studentSnap = await getDoc(studentRef);
      
      if (!studentSnap.exists()) {
        throw new Error(`Student ${studentId} not found`);
      }
      
      const studentData = studentSnap.data();
      console.log('Student data:', studentData);
      
      // Update student document with assignment info
      await updateDoc(studentRef, { hostelAssignment: assignment });
      console.log(`Updated student ${studentId} with assignment`, assignment);
      
      // If we're removing the assignment (assignment is null)
      if (!assignment) {
        console.log(`Removed hostel assignment for student ${studentId}`);
        return;
      }
      
      // Update room's occupants
      const roomRef = doc(db, 'hostelRooms', assignment.roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error(`Room ${assignment.roomId} not found`);
      }
      
      const roomData = roomSnap.data();
      console.log('Room data:', roomData);
      
      // Ensure occupants is an array
      const occupants = Array.isArray(roomData.occupants) ? roomData.occupants : [];
      console.log('Current occupants:', occupants);
      
      // Check if student is already in occupants
      const isStudentInRoom = occupants.some(s => s.id === studentId);
      
      if (!isStudentInRoom) {
        // Add student to occupants
        const newOccupants = [
          ...occupants,
          {
            id: studentId,
            name: studentData.name || 'Unknown',
            studentId: studentData.schoolId || studentData.studentId || ''
          }
        ];
        
        console.log('New occupants:', newOccupants);
        
        // Update room with new occupants
        await updateDoc(roomRef, { occupants: newOccupants });
        console.log(`Added student ${studentId} to room ${assignment.roomId}`);
      } else {
        console.log(`Student ${studentId} already in room ${assignment.roomId}`);
      }
    } catch (error) {
      console.error('Error updating student hostel assignment:', error);
      throw error;
    }
  },
  
  // Remove student from room
  async removeStudentFromRoom(roomId, studentId) {
    try {
      console.log(`Removing student ${studentId} from room ${roomId}`);
      
      // First update the student document to remove assignment
      await updateDoc(doc(db, 'students', studentId), { hostelAssignment: null });
      console.log(`Removed hostel assignment from student ${studentId}`);
      
      // Then update room occupants
      const roomRef = doc(db, 'hostelRooms', roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        console.log(`Room ${roomId} not found, skipping occupant removal`);
        return;
      }
      
      const roomData = roomSnap.data();
      
      // Ensure occupants is an array
      if (!Array.isArray(roomData.occupants)) {
        console.log(`Room ${roomId} has no occupants, nothing to remove`);
        return;
      }
      
      // Filter out the student
      const newOccupants = roomData.occupants.filter(s => s.id !== studentId);
      
      // Update room with new occupants
      await updateDoc(roomRef, { occupants: newOccupants });
      console.log(`Removed student ${studentId} from room ${roomId} occupants`);
      
    } catch (error) {
      console.error('Error removing student from room:', error);
      throw error;
    }
  },
  
  // Assign student to room
  async assignStudentToRoom(roomId, studentId) {
    try {
      console.log(`Assigning student ${studentId} to room ${roomId}`);
      
      // Get room data
      const roomRef = doc(db, 'hostelRooms', roomId);
      const roomSnap = await getDoc(roomRef);
      
      if (!roomSnap.exists()) {
        throw new Error(`Room ${roomId} not found`);
      }
      
      const roomData = roomSnap.data();
      console.log('Room data:', roomData);
      
      // Ensure occupants is an array
      const occupants = Array.isArray(roomData.occupants) ? roomData.occupants : [];
      
      // Check capacity
      if (occupants.length >= roomData.capacity) {
        throw new Error('Room is at full capacity');
      }
      
      // Check if student is already assigned
      if (occupants.some(s => s.id === studentId)) {
        throw new Error('Student is already assigned to this room');
      }
      
      // Get hostel data
      const hostelRef = doc(db, 'hostels', roomData.hostelId);
      const hostelSnap = await getDoc(hostelRef);
      
      if (!hostelSnap.exists()) {
        throw new Error(`Hostel ${roomData.hostelId} not found`);
      }
      
      const hostelData = hostelSnap.data();
      
      // Create assignment object
      const assignment = {
        roomId: roomId,
        hostelId: roomData.hostelId,
        roomNumber: roomData.roomNumber,
        hostelName: hostelData.name
      };
      
      // Update student's hostel assignment
      await this.updateStudentHostelAssignment(studentId, assignment);
      console.log(`Successfully assigned student ${studentId} to room ${roomId}`);
      
    } catch (error) {
      console.error('Error assigning student to room:', error);
      throw error;
    }
  },
  
  // Record hostel access event
  async recordAccessEvent(eventData) {
    try {
      const accessEvent = {
        ...eventData,
        timestamp: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'hostelAccess'), accessEvent);
      return { success: true, eventId: docRef.id };
    } catch (error) {
      console.error('Error recording hostel access event:', error);
      throw error;
    }
  },
  
  // Get student's hostel access events
  async getStudentAccessEvents(studentId, limit = 20) {
    try {
      const q = query(
        collection(db, 'hostelAccess'),
        where('studentId', '==', studentId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
    } catch (error) {
      console.error('Error getting student hostel access events:', error);
      throw error;
    }
  },
  
  // Subscribe to hostel access events
  subscribeToHostelAccessEvents(hostelId, callback) {
    const q = query(
      collection(db, 'hostelAccess'),
      where('hostelId', '==', hostelId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(100)
    );
    
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      callback(events);
    }, (error) => {
      console.error('Error subscribing to hostel access events:', error);
    });
  },
  
  // Subscribe to recent hostel access events
  subscribeToRecentAccessEvents(limit, callback) {
    const q = query(
      collection(db, 'hostelAccess'),
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
      console.error('Error subscribing to recent hostel access events:', error);
    });
  },
  
  // Get hostel statistics
  async getHostelStatistics() {
    try {
      // Get all hostels
      const hostels = await this.getHostels();
      
      // Get all rooms
      const roomsSnapshot = await getDocs(collection(db, 'hostelRooms'));
      const rooms = roomsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Calculate statistics
      const stats = {
        totalHostels: hostels.length,
        totalRooms: rooms.length,
        totalCapacity: rooms.reduce((sum, room) => sum + (room.capacity || 0), 0),
        totalOccupants: rooms.reduce((sum, room) => sum + (room.occupants?.length || 0), 0),
        occupancyRate: 0,
        hostelStats: {}
      };
      
      // Calculate occupancy rate
      if (stats.totalCapacity > 0) {
        stats.occupancyRate = (stats.totalOccupants / stats.totalCapacity) * 100;
      }
      
      // Calculate per-hostel statistics
      hostels.forEach(hostel => {
        const hostelRooms = rooms.filter(room => room.hostelId === hostel.id);
        const hostelCapacity = hostelRooms.reduce((sum, room) => sum + (room.capacity || 0), 0);
        const hostelOccupants = hostelRooms.reduce((sum, room) => sum + (room.occupants?.length || 0), 0);
        let occupancyRate = 0;
        
        if (hostelCapacity > 0) {
          occupancyRate = (hostelOccupants / hostelCapacity) * 100;
        }
        
        stats.hostelStats[hostel.id] = {
          name: hostel.name,
          totalRooms: hostelRooms.length,
          capacity: hostelCapacity,
          occupants: hostelOccupants,
          occupancyRate,
          availableRooms: hostelRooms.filter(room => room.status === 'available').length,
          fullRooms: hostelRooms.filter(room => room.status === 'full').length
        };
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting hostel statistics:', error);
      throw error;
    }
  },
  
  // Subscribe to hostels in real-time
  subscribeToHostels(callback) {
    try {
      const hostelsRef = collection(db, 'hostels');
      const q = query(hostelsRef, orderBy('name'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const hostelsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        
        callback(hostelsData);
      }, (error) => {
        console.error('Error subscribing to hostels:', error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up hostels subscription:', error);
      throw error;
    }
  },
  
  // Subscribe to hostel statistics in real-time
  subscribeToHostelStatistics(callback) {
    try {
      // Subscribe to hostels
      const hostelsUnsubscribe = onSnapshot(
        query(collection(db, 'hostels')),
        (hostelsSnapshot) => {
          // Subscribe to rooms
          const roomsUnsubscribe = onSnapshot(
            query(collection(db, 'hostelRooms')),
            (roomsSnapshot) => {
              // Calculate statistics
              const hostels = hostelsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              const rooms = roomsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              console.log('Raw rooms data:', rooms); // Debug log
              
              // Calculate overall stats
              const totalHostels = hostels.length;
              const totalRooms = rooms.length;
              let totalCapacity = 0;
              let totalOccupants = 0;
              
              // Calculate stats for each hostel
              const hostelStats = {};
              
              hostels.forEach(hostel => {
                const hostelRooms = rooms.filter(room => room.hostelId === hostel.id);
                
                // Debug log
                console.log(`Rooms for hostel ${hostel.name}:`, hostelRooms.map(r => ({
                  roomNumber: r.roomNumber,
                  capacity: r.capacity,
                  type: typeof r.capacity
                })));
                
                // Ensure capacity is a number
                const hostelCapacity = hostelRooms.reduce((sum, room) => {
                  const capacity = room.capacity ? parseInt(room.capacity, 10) : 0;
                  return sum + capacity;
                }, 0);
                
                const hostelOccupants = hostelRooms.reduce((sum, room) => {
                  return sum + (Array.isArray(room.occupants) ? room.occupants.length : 0);
                }, 0);
                
                const occupancyRate = hostelCapacity > 0 ? (hostelOccupants / hostelCapacity) * 100 : 0;
                
                // Count available and full rooms
                const availableRooms = hostelRooms.filter(room => {
                  const capacity = room.capacity ? parseInt(room.capacity, 10) : 0;
                  const occupants = Array.isArray(room.occupants) ? room.occupants.length : 0;
                  return occupants < capacity;
                }).length;
                
                const fullRooms = hostelRooms.filter(room => {
                  const capacity = room.capacity ? parseInt(room.capacity, 10) : 0;
                  const occupants = Array.isArray(room.occupants) ? room.occupants.length : 0;
                  return occupants >= capacity && capacity > 0;
                }).length;
                
                // Add to totals
                totalCapacity += hostelCapacity;
                totalOccupants += hostelOccupants;
                
                // Debug log
                console.log(`Hostel ${hostel.name} stats:`, {
                  totalRooms: hostelRooms.length,
                  capacity: hostelCapacity,
                  occupants: hostelOccupants
                });
                
                // Store hostel stats
                hostelStats[hostel.id] = {
                  name: hostel.name,
                  totalRooms: hostelRooms.length,
                  capacity: hostelCapacity,
                  occupants: hostelOccupants,
                  occupancyRate: occupancyRate,
                  availableRooms: availableRooms,
                  fullRooms: fullRooms
                };
              });
              
              // Calculate overall occupancy rate
              const occupancyRate = totalCapacity > 0 ? (totalOccupants / totalCapacity) * 100 : 0;
              
              // Debug overall totals
              console.log('Final statistics:', {
                totalHostels,
                totalRooms,
                totalCapacity,
                totalOccupants,
                occupancyRate
              });
              
              // Return stats object
              const stats = {
                totalHostels,
                totalRooms,
                totalCapacity,
                totalOccupants,
                occupancyRate,
                hostelStats
              };
              
              callback(stats);
            },
            (error) => {
              console.error('Error subscribing to rooms:', error);
            }
          );
          
          // Return a cleanup function
          return () => {
            roomsUnsubscribe();
          };
        },
        (error) => {
          console.error('Error subscribing to hostels:', error);
        }
      );
      
      // Return a cleanup function
      return () => {
        hostelsUnsubscribe();
      };
    } catch (error) {
      console.error('Error setting up hostel statistics subscription:', error);
      throw error;
    }
  },
  
  // Subscribe to hostel access events in real-time
  subscribeToHostelAccessEvents(hostelId, callback) {
    try {
      const eventsRef = collection(db, 'hostelAccessEvents');
      const q = query(
        eventsRef,
        where('hostelId', '==', hostelId),
        orderBy('timestamp', 'desc'),
        firestoreLimit(20)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const events = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        }));
        
        callback(events);
      }, (error) => {
        console.error('Error subscribing to hostel access events:', error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up hostel access events subscription:', error);
      throw error;
    }
  }
}; 