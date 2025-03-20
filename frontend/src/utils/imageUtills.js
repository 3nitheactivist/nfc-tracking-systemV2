// Convert a file to base64 for storage
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      console.log('fileToBase64: No file provided');
      resolve(null);
      return;
    }
    
    console.log('fileToBase64: Processing file', file.name, file.size, file.type);
    
    // Check file size - limit to 1MB to avoid database size issues
    if (file.size > 1024 * 1024) {
      console.log('fileToBase64: File too large, compressing...');
      return compressImage(file, 800, 0.7)
        .then(compressedFile => {
          console.log('fileToBase64: Compression complete', compressedFile.size);
          const reader = new FileReader();
          reader.readAsDataURL(compressedFile);
          reader.onload = () => {
            console.log('fileToBase64: Base64 conversion complete for compressed image');
            resolve(reader.result);
          };
          reader.onerror = (error) => {
            console.error('fileToBase64: Error reading compressed file', error);
            reject(error);
          };
        })
        .catch(error => {
          console.error('fileToBase64: Compression failed', error);
          reject(error);
        });
    } else {
      console.log('fileToBase64: File size acceptable, converting directly');
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        console.log('fileToBase64: Base64 conversion complete');
        resolve(reader.result);
      };
      reader.onerror = (error) => {
        console.error('fileToBase64: Error reading file', error);
        reject(error);
      };
    }
  });
};

// Compress image to save space
export const compressImage = (file, maxWidth, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        try {
          const img = new Image();
          img.src = event.target.result;
          
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
              
              canvas.width = width;
              canvas.height = height;
              
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert to blob with reduced quality
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    console.error('compressImage: Blob creation failed');
                    reject(new Error('Failed to create blob'));
                    return;
                  }
                  const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                  resolve(compressedFile);
                },
                'image/jpeg',
                quality
              );
            } catch (canvasError) {
              console.error('compressImage: Canvas operation failed', canvasError);
              reject(canvasError);
            }
          };
          
          img.onerror = (imgError) => {
            console.error('compressImage: Image loading failed', imgError);
            reject(imgError);
          };
        } catch (imageError) {
          console.error('compressImage: Image creation failed', imageError);
          reject(imageError);
        }
      };
      
      reader.onerror = (readerError) => {
        console.error('compressImage: FileReader failed', readerError);
        reject(readerError);
      };
    } catch (error) {
      console.error('compressImage: Overall failure', error);
      reject(error);
    }
  });
};