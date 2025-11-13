
"use client";

import {
  ref,
  getDownloadURL,
  FirebaseStorage,
  uploadBytesResumable,
  UploadTaskSnapshot,
} from "firebase/storage";

/**
 * Uploads a profile image to Firebase Storage with progress tracking.
 * @param storage The Firebase Storage instance.
 * @param userId The user's ID.
 * @param file The image file to upload.
 * @param onProgress A callback function to receive progress updates (0-100).
 * @returns A promise that resolves with the download URL of the uploaded image.
 */
export function uploadProfileImage(
  storage: FirebaseStorage,
  userId: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create a storage reference
    const storageRef = ref(storage, `profile-images/${userId}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        // Observe state change events such as progress, pause, and resume
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        // Handle unsuccessful uploads
        console.error("Upload failed:", error);
        reject(error);
      },
      async () => {
        // Handle successful uploads on complete
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}


/**
 * Uploads a product image to Firebase Storage with progress tracking.
 * @param storage The Firebase Storage instance.
 * @param userId The user's ID.
 * @param calculationId The ID of the calculation.
 * @param file The image file to upload.
 * @param onProgress A callback function to receive progress updates (0-100).
 * @returns A promise that resolves with the download URL of the uploaded image.
 */
export function uploadProductImage(
  storage: FirebaseStorage,
  userId: string,
  calculationId: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create a storage reference
    const storageRef = ref(storage, `product-images/${userId}/${calculationId}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error("Product image upload failed:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}
