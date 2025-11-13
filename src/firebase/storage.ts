
"use client";

import {
  ref,
  getDownloadURL,
  FirebaseStorage,
  uploadBytesResumable,
  UploadTaskSnapshot,
} from "firebase/storage";

/**
 * Uploads a file to Firebase Storage with progress tracking.
 * @param storage The Firebase Storage instance.
 * @param path The full path where the file will be stored in the bucket (e.g., 'profile-images/userId/filename.jpg').
 * @param file The file to upload.
 * @param onProgress A callback function to receive progress updates (a number from 0 to 100).
 * @returns A promise that resolves with the public download URL of the uploaded file.
 */
export function uploadFile(
  storage: FirebaseStorage,
  path: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot: UploadTaskSnapshot) => {
        // Calculate progress percentage
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
          console.error("Failed to get download URL:", error);
          reject(error);
        }
      }
    );
  });
}

    