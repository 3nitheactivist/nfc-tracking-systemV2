import { Client, Storage, ID } from 'appwrite';
import { APPWRITE_CONFIG } from './config';

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

const storage = new Storage(client);
const BUCKET_ID = APPWRITE_CONFIG.bucketId;

export const appwriteService = {
  // Upload student profile image
  uploadStudentImage: async (file, studentId) => {
    try {
      // Create a unique file name using the student ID
      const fileName = `student_${studentId}_${Date.now()}`;
      
      // Upload file to Appwrite Storage
      const result = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      );
      
      // Get file URL
      const fileUrl = storage.getFileView(BUCKET_ID, result.$id);
      
      return {
        success: true,
        fileId: result.$id,
        fileUrl
      };
    } catch (error) {
      console.error('Error uploading image to Appwrite:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Delete student image
  deleteStudentImage: async (fileId) => {
    try {
      await storage.deleteFile(BUCKET_ID, fileId);
      return { success: true };
    } catch (error) {
      console.error('Error deleting image from Appwrite:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  // Get file preview URL (for thumbnails)
  getFilePreview: (fileId, width = 200, height = 200) => {
    if (!fileId) return null;
    return storage.getFilePreview(BUCKET_ID, fileId, width, height);
  }
};